import os
from typing import Any, List

import numpy as np
from dotenv import load_dotenv
from supabase import Client, create_client

from retrievers.SupabaseRetriever import build_supabase_retriever

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Create the Supabase client wherever you need it
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

supabase_retriever = build_supabase_retriever(supabase, "3dd5aaf4-9d39-45ab-8cbb-c1e2f4977899")


# ------------ Example usage ------------
if __name__ == "__main__":
    docs = supabase_retriever.get_relevant_documents("Where did Sumit go to school?")

    print(docs)
