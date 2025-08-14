import os
from dotenv import load_dotenv

from supabase import Client, create_client

from langchain_openai import ChatOpenAI

from retrievers.SupabaseRetriever import build_supabase_retriever

from chains.contextual_history_with_memory import build_contextual_rag_with_history

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


if __name__ == "__main__":
    supabase_retriever = build_supabase_retriever(
        supabase, "3dd5aaf4-9d39-45ab-8cbb-c1e2f4977899"
    )

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    chain = build_contextual_rag_with_history(supabase_retriever, llm)

    session = {"configurable": {"session_id": "demo-1"}}

    result1 = chain.invoke(
        {"question": "Where did Sumit go to school?"}, config=session)
    print("Answer 1:", result1["answer"])
    print("Sources 1:", [
        {"chunk_id": d.metadata.get("chunk_id"),
         "file_id": d.metadata.get("file_id"),
         "snippet": d.page_content[:120]}
        for d in result1["docs"]
    ])

    # Turn 2 (tests history + contextualization)
    result2 = chain.invoke({"question": "where?"}, config=session)
    print("Answer 2:", result2["answer"])
