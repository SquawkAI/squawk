import json
import ast
from typing import Any, List, Optional

import numpy as np
from supabase import Client
from pydantic import Field

from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_openai import OpenAIEmbeddings


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
    # Fallback for unexpected types
    return [float(x) for x in v]


class SupabaseRetriever(BaseRetriever):
    # Required inputs
    supabase: Client
    project_id: str
    k: int = 5

    # Internals with defaults
    embeddings_model: OpenAIEmbeddings = Field(
        default_factory=OpenAIEmbeddings)
    documents: List[Document] = Field(default_factory=list)
    embeddings: List[List[float]] = Field(default_factory=list)

    # Runs after pydantic constructs the instance
    def model_post_init(self, __context: Any) -> None:
        self._load_data()

    def _load_data(self) -> None:
        # 1) files for project (only completed)
        files_res = (
            self.supabase.table("files")
            .select("id")
            .eq("project_id", self.project_id)
            .eq("status", "completed")
            .execute()
        )
        file_ids = [r["id"] for r in (files_res.data or [])]
        if not file_ids:
            return

        # 2) chunks for those files
        chunks_res = (
            self.supabase.table("chunks")
            .select("id, content, file_id")
            .in_("file_id", file_ids)
            .execute()
        )
        chunks = chunks_res.data or []
        if not chunks:
            return
        chunk_ids = [c["id"] for c in chunks]

        # 3) embeddings (prefer pgvector column if present)
        embeds_res = (
            self.supabase.table("embeddings")
            .select("chunk_id, embedding")
            .in_("chunk_id", chunk_ids)
            .execute()
        )

        embed_map = {
            row["chunk_id"]: _to_float_list(row["embedding"])
            for row in (embeds_res.data or [])
        }

        # 4) build in-memory docs + vectors
        for row in chunks:
            vec = embed_map.get(row["id"])
            if vec:
                self.documents.append(
                    Document(
                        page_content=row["content"],
                        metadata={"chunk_id": row["id"],
                                  "file_id": row["file_id"]},
                    )
                )
                self.embeddings.append(vec)

    def _get_relevant_documents(
        self,
        query: str,
        *,
        run_manager: Optional[CallbackManagerForRetrieverRun] = None,
    ) -> List[Document]:
        if not self.embeddings:
            return []

        q = np.array(self.embeddings_model.embed_query(query), dtype=float)
        M = np.array(self.embeddings, dtype=float)  # (N, D)

        # cosine similarity
        denom = (np.linalg.norm(M, axis=1) * np.linalg.norm(q))
        denom[denom == 0] = 1e-12
        sims = (M @ q) / denom

        top_idx = np.argsort(sims)[-self.k:][::-1]
        return [self.documents[i] for i in top_idx]


def build_supabase_retriever(supabase: Client, project_id: str) -> SupabaseRetriever:
    return SupabaseRetriever(supabase=supabase, project_id=project_id)
