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
        if not self.embeddings:
            return []

        # 1) Embed & score all
        q = np.array(self.embeddings_model.embed_query(query), dtype=float)
        M = np.array(self.embeddings, dtype=float)
        denom = (np.linalg.norm(M, axis=1) * np.linalg.norm(q))
        denom[denom == 0] = 1e-12
        sims = (M @ q) / denom

        take = max(self.k * self.oversample, self.k + 6)
        global_top = np.argsort(sims)[-take:][::-1]

        # 2) Extract generic focus terms (quoted phrases, capitalized multi-words)
        focus_terms = _extract_focus_terms(query)

        # 3) Pick target group
        key = self.grouping_key
        # score per group = max similarity among top hits
        group_best_score: dict[str, float] = {}
        group_focus_bonus: dict[str, int] = {}

        for idx in global_top:
            d = self.documents[idx]
            gid = d.metadata.get(key)
            sc = float(sims[idx])
            group_best_score[gid] = max(group_best_score.get(gid, -1e9), sc)
            if self.prefer_focus_terms and focus_terms:
                # simple bonus: +1 for each focus term matched in this chunk
                bonus = sum(1 for t in focus_terms if _contains_all(d.page_content, t))
                group_focus_bonus[gid] = max(group_focus_bonus.get(gid, 0), bonus)

        if not group_best_score:
            return []

        def group_score(gid: str) -> float:
            return group_best_score.get(gid, -1e9) + 0.05 * group_focus_bonus.get(gid, 0)

        target_group = max(group_best_score.keys(), key=group_score)

        # 4) Seeds = top hits from target group; expand neighbors (if chunk_index exists)
        seeds = [i for i in global_top if self.documents[i].metadata.get(key) == target_group]

        expanded = self._neighbor_expand(seeds, self.neighbor_window)
        expanded = [i for i in expanded if self.documents[i].metadata.get(key) == target_group]

        # Sort by similarity within the group
        expanded_sorted = sorted(expanded, key=lambda i: sims[i], reverse=True)

        chosen = expanded_sorted[: self.k]

        # 5) If still short, add diverse extras from other groups (MMR-lite)
        if len(chosen) < self.k:
            used_groups = {self.documents[i].metadata.get(key) for i in chosen}
            extras = []
            for idx in global_top:
                gid = self.documents[idx].metadata.get(key)
                if gid in used_groups or idx in chosen:
                    continue
                extras.append(idx)
                used_groups.add(gid)
                if len(chosen) + len(extras) >= self.k:
                    break
            chosen += extras[: (self.k - len(chosen))]

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