import os
from typing import List

from dotenv import load_dotenv
from supabase import Client, create_client

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document
from langchain_core.runnables import RunnablePassthrough, RunnableParallel
from langchain_openai import ChatOpenAI

from retrievers.SupabaseRetriever import build_supabase_retriever

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Create the Supabase client wherever you need it
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def format_docs(docs: List[Document]) -> str:
    # keep it simple; you can get fancier (e.g., include titles, sources)
    return "\n\n---\n\n".join(d.page_content for d in docs)


def build_rag_chain(retriever) -> RunnableParallel:
    """
    Returns a chain that, given a user question (string),
    produces: {"answer": <str>, "docs": <List[Document]>}
    """
    # LLM (stateless, no chat memory)
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are a helpful assistant. Use the provided context to answer the user's question. "
         "If the answer is not in the context, say you don't know."),
        ("human",
         "Question:\n{question}\n\n"
         "Context:\n{context}")
    ])

    # Branch: (1) get docs; (2) build context & answer
    chain = RunnableParallel(
        # retriever is a Runnable that takes the question string and returns List[Document]
        docs=retriever,
        answer=(
            {
                "context": retriever | format_docs,
                "question": RunnablePassthrough()
            }
            | prompt
            | llm
            | StrOutputParser()
        ),
    )
    return chain


# ------------ Example usage ------------
if __name__ == "__main__":
    supabase_retriever = build_supabase_retriever(
        supabase, "3dd5aaf4-9d39-45ab-8cbb-c1e2f4977899")

    chain = build_rag_chain(supabase_retriever)

    result = chain.invoke("Where did sumit go to school?")

    sources = [
        {
            "chunk_id": d.metadata.get("chunk_id"),
            "file_id": d.metadata.get("file_id"),
            "snippet": d.page_content[:200],
        }
        for d in result["docs"]
    ]

    print(result)