import os
from typing import Any, List

import numpy as np
from dotenv import load_dotenv
from pydantic import Field
from supabase import Client, create_client

from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from langchain_openai import OpenAIEmbeddings 

class SupabaseRetriever(BaseRetriever):
    supabase: Client
    project_id: str
    k: int = 5

    embeddings_model: OpenAIEmbeddings = Field(default_factory=OpenAIEmbeddings)
    documents: List[Document] = Field(default_factory=list)
    embeddings: List[List[float]] = Field(default_factory=list)

    # Runs after pydantic constructs the instance
    def model_post_init(self, __context: Any) -> None:
        self._load_data()

    # ---- Internal helpers ----
    def _load_data(self) -> None:
        # 1) files for project (completed only)
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

        # 3) embeddings for those chunks
        embeds_res = (
            self.supabase.table("embeddings")
            .select("chunk_id, embedding")
            .in_("chunk_id", chunk_ids)
            .execute()
        )
        embed_map = {row["chunk_id"]: row["embedding"]
                     for row in (embeds_res.data or [])}

        # 4) build in-memory arrays + Documents
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

    def _get_relevant_documents(self, query: str, *, run_manager: Any = None) -> List[Document]:
        if not self.embeddings:
            return []

        # Embed query
        q = np.array(self.embeddings_model.embed_query(query), dtype=float)

        # Cosine similarity with preloaded embeddings
        M = np.array(self.embeddings, dtype=float)  # shape: (N, D)
        denom = (np.linalg.norm(M, axis=1) * np.linalg.norm(q))
        # Avoid divide-by-zero
        denom[denom == 0] = 1e-12
        sims = (M @ q) / denom

        top_idx = np.argsort(sims)[-self.k:][::-1]
        return [self.documents[i] for i in top_idx]

def build_supabase_retriever(supbabase, project_id):
    retriever = SupabaseRetriever(supabase=supbabase, project_id=project_id)

    return retriever