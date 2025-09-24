import json
import ast
import re
import asyncio
from collections import defaultdict
from typing import Any, List, Optional, Tuple

import numpy as np
from supabase import Client
from pydantic import Field

from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_openai import OpenAIEmbeddings


# -------------------- utils --------------------

def _to_float_list(v: Any) -> List[float]:
    """Coerce Supabase result (vector/text/json) into List[float]."""
    if v is None:
        return []
    if isinstance(v, list):
        return [float(x) for x in v]
    if isinstance(v, str):
        try:
            parsed = json.loads(v)
        except json.JSONDecodeError:
            parsed = ast.literal_eval(v)
        return [float(x) for x in parsed]
    return [float(x) for x in v]


def _norm_text(s: str) -> str:
    return (s or "").lower()


def _extract_focus_terms(query: str) -> List[str]:
    """
    Heuristics (generic, domain-agnostic):
    - Quoted phrases: "foo bar"  -> foo bar
    - Capitalized multi-words: Project Atlas, Texas A&M
    - Fallback: nothing (pure semantic retrieval)
    """
    focus: List[str] = []

    # "quoted phrases"
    focus += [m.strip() for m in re.findall(r'"([^"]{3,}?)"', query or "") if m.strip()]

    # Capitalized multiword phrases (min 2 tokens)
    cap = re.findall(r'\b([A-Z][\w&.-]+(?:\s+[A-Z][\w&.-]+)+)\b', query or "")
    for m in cap:
        m = m.strip()
        if len(m.split()) >= 2:
            focus.append(m)

    # Dedup (case-insensitive), keep longer first
    seen = set()
    ordered: List[str] = []
    for t in sorted(focus, key=len, reverse=True):
        k = t.lower()
        if k not in seen:
            seen.add(k)
            ordered.append(t)
    return ordered


def _contains_all(text: str, phrase: str) -> bool:
    """All tokens of phrase must appear in text (case-insensitive)."""
    tl = _norm_text(text)
    toks = [t for t in _norm_text(phrase).split() if len(t) >= 3]
    return all(t in tl for t in toks) if toks else False


# -------------------- retriever --------------------

class SupabaseRetriever(BaseRetriever):
    # Required
    supabase: Client
    project_id: str

    # Tunables
    k: int = 12
    neighbor_window: int = 3           # ±window for neighbor expansion
    grouping_key: str = "file_id"      # group docs by this metadata key
    oversample: int = 2                 # how many*k to inspect before grouping
    prefer_focus_terms: bool = True     # bias target group by focus term hits

    # Internals
    embeddings_model: OpenAIEmbeddings = Field(default_factory=OpenAIEmbeddings)
    documents: List[Document] = Field(default_factory=list)
    embeddings: List[List[float]] = Field(default_factory=list)

    # Lifecycle
    def model_post_init(self, __context: Any) -> None:
        self._load_data()

    # ----- Load -----
    def _load_data(self) -> None:
        files_res = (
            self.supabase.table("files")
            .select("id,name")  # 'name' from your schema; harmless if null
            .eq("project_id", self.project_id)
            .eq("status", "completed")
            .execute()
        )
        file_rows = files_res.data or []
        file_ids = [r["id"] for r in file_rows]
        id_to_name = {r["id"]: r.get("name") for r in file_rows}
        if not file_ids:
            return

        chunks_res = (
            self.supabase.table("chunks")
            .select("id, content, file_id, chunk_index")
            .in_("file_id", file_ids)
            .execute()
        )
        chunks = chunks_res.data or []
        if not chunks:
            return
        chunk_ids = [c["id"] for c in chunks]

        embeds_res = (
            self.supabase.table("embeddings")
            .select("chunk_id, embedding")
            .in_("chunk_id", chunk_ids)
            .execute()
        )
        embed_map = {row["chunk_id"]: _to_float_list(row["embedding"])
                     for row in (embeds_res.data or [])}

        for row in chunks:
            vec = embed_map.get(row["id"])
            if not vec:
                continue
            self.documents.append(
                Document(
                    page_content=row["content"],
                    metadata={
                        "chunk_id": row["id"],
                        "file_id": row["file_id"],
                        "chunk_index": row.get("chunk_index"),
                        "file_name": id_to_name.get(row["file_id"]),
                    },
                )
            )
            self.embeddings.append(vec)

    # ----- Neighbor expansion -----
    def _neighbor_expand(self, base_idxs: List[int], window: int) -> List[int]:
        """
        Expand around base hits by ±window, grouped by self.grouping_key,
        using metadata['chunk_index'] when available.
        """
        key = self.grouping_key
        # Build group -> [(chunk_index, doc_idx)] sorted by index
        by_group: dict[str, List[Tuple[int, int]]] = {}
        for i, d in enumerate(self.documents):
            gid = d.metadata.get(key)
            ci = d.metadata.get("chunk_index")
            if gid is None or ci is None:
                continue
            by_group.setdefault(gid, []).append((int(ci), i))
        for gid in by_group:
            by_group[gid].sort(key=lambda t: t[0])

        expanded = list(base_idxs)
        seen = set(base_idxs)
        for si in base_idxs:
            gid = self.documents[si].metadata.get(key)
            ci = self.documents[si].metadata.get("chunk_index")
            if gid not in by_group or ci is None:
                continue
            ci = int(ci)
            for cj, j in by_group[gid]:
                if abs(cj - ci) <= window and j not in seen:
                    expanded.append(j)
                    seen.add(j)
        return expanded

    # ----- Retrieval -----
    def _get_relevant_documents(
    self,
    query: str,
    *,
    run_manager: Optional[CallbackManagerForRetrieverRun] = None,
) -> List[Document]:
        if not self.embeddings or not self.documents:
            return []

        # === Optional knobs (set on the instance; all are optional) ===
        # self.lexical_prefilter: bool | None
        # self.per_file_cap: int | None                # max docs per file in final selection
        # self.diversity_first_frac: float | None      # e.g., 0.5 => enforce diversity for first 50% of k
        # self.min_sim_quantile: float | None          # e.g., 0.90 => require top ≥ q-th quantile
        # self.min_sim_delta: float | None             # optional +delta above that quantile

        lexical_prefilter = getattr(self, "lexical_prefilter", True)
        per_file_cap = getattr(self, "per_file_cap", None)
        diversity_first_frac = getattr(self, "diversity_first_frac", None)
        min_sim_quantile = getattr(self, "min_sim_quantile", None)
        min_sim_delta = getattr(self, "min_sim_delta", 0.0)

        # ---------- helpers (query-driven, no hardcoded terms) ----------
        def _query_terms(q: str) -> list[str]:
            q = q or ""
            terms = []
            # quoted phrases and backticked code
            terms += re.findall(r'"([^"]{2,})"', q)
            terms += re.findall(r"`([^`]{1,})`", q)
            ql = q.lower()
            # dotted identifiers (e.g., module.func), snake/camel-ish tokens, braces/specs typed by user
            terms += re.findall(r"\b[a-z0-9_]+(?:\.[a-z0-9_]+)+\b", ql)
            terms += re.findall(r"\b[a-zA-Z][a-zA-Z0-9_]{2,}\b", q)  # identifiers length ≥3
            # raw non-stopword-ish tokens from query (length ≥3)
            terms += [t for t in re.split(r"[^a-zA-Z0-9_{}/:.]+", ql) if len(t) >= 3]
            # dedupe/normalize
            seen, out = set(), []
            for t in terms:
                t = t.strip().lower()
                if t and t not in seen:
                    seen.add(t)
                    out.append(t)
            return out

        def _text_has_any(text: str, terms: list[str]) -> bool:
            tl = (text or "").lower()
            return any(t in tl for t in terms)

        # ---------- candidate set (optional lexical prefilter) ----------
        candidate_idxs = list(range(len(self.documents)))
        if lexical_prefilter:
            must_terms = _query_terms(query)
            if must_terms:
                filtered = [i for i, d in enumerate(self.documents) if _text_has_any(d.page_content, must_terms)]
                if filtered:
                    candidate_idxs = filtered

        if not candidate_idxs:
            return []

        # ---------- dense scoring on candidates ----------
        q_vec = np.array(self.embeddings_model.embed_query(query), dtype=float)
        M = np.array([self.embeddings[i] for i in candidate_idxs], dtype=float)
        qn = np.linalg.norm(q_vec)
        if qn == 0 or M.size == 0:
            return []

        denom = (np.linalg.norm(M, axis=1) * qn)
        denom[denom == 0] = 1e-12
        sims = (M @ q_vec) / denom

        # ---------- optional “abstain” (no fixed threshold; quantile-based if provided) ----------
        if min_sim_quantile is not None:
            qth = float(np.quantile(sims, min_sim_quantile)) if sims.size else 0.0
            top = float(np.max(sims, initial=0.0))
            if top < (qth + (min_sim_delta or 0.0)):
                return []

        # ---------- diverse selection across files (no fixed fractions unless provided) ----------
        take = max(self.k * self.oversample, self.k + 10)
        order = np.argsort(sims)[-take:][::-1]  # best → worst among candidates
        pool = [(float(sims[j]), candidate_idxs[j]) for j in order]

        picked: list[int] = []
        used_groups: dict = {}
        group_key = self.grouping_key

        # Phase 1: enforce diversity for the first X% of k if configured
        first_target = int(self.k * diversity_first_frac) if diversity_first_frac else 0
        for sc, idx in pool:
            gid = self.documents[idx].metadata.get(group_key)
            if first_target and len(picked) < first_target:
                # pick if new group or under per-file cap
                if per_file_cap is None or used_groups.get(gid, 0) < per_file_cap:
                    if used_groups.get(gid, 0) == 0:  # prefer new groups in this phase
                        picked.append(idx)
                        used_groups[gid] = used_groups.get(gid, 0) + 1
            if len(picked) >= first_target:
                break

        # Phase 2: fill remaining purely by score, respecting per-file cap if set
        for sc, idx in pool:
            if len(picked) >= self.k:
                break
            if idx in picked:
                continue
            gid = self.documents[idx].metadata.get(group_key)
            if per_file_cap is not None and used_groups.get(gid, 0) >= per_file_cap:
                continue
            picked.append(idx)
            used_groups[gid] = used_groups.get(gid, 0) + 1

        chosen = picked[: self.k]
        return [self.documents[i] for i in chosen]


    async def _aget_relevant_documents(
        self,
        query: str,
        *,
        run_manager: Optional[CallbackManagerForRetrieverRun] = None,
    ) -> List[Document]:
        return await asyncio.to_thread(
            self._get_relevant_documents, query, run_manager=run_manager
        )


def build_supabase_retriever(supabase: Client, project_id: str) -> SupabaseRetriever:
    return SupabaseRetriever(supabase=supabase, project_id=project_id)