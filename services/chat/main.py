import os
from uuid import uuid4
from typing import Optional
from dotenv import load_dotenv
from pydantic import BaseModel

from fastapi import FastAPI, HTTPException
from supabase import Client, create_client
from langchain_openai import ChatOpenAI

from retrievers.SupabaseRetriever import build_supabase_retriever
from chains.contextual_history_with_memory import build_contextual_rag_with_history
from utils.SessionStore import SessionStore

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

app = FastAPI()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
session_store = SessionStore(max_messages=50)

class Conversation(BaseModel):
    id: Optional[str] = None
    project_id: str
    query: str


@app.get('/status')
async def status_check():
    return {"status": "ok", "message": "Chat service is live"}


@app.post("/conversation")
async def handle_conversation(conversation_request: Conversation):
    conversation_request_dict = conversation_request.dict()

    conversation_id = conversation_request.id or str(uuid4())
    project_id = conversation_request_dict.get('project_id')
    query = conversation_request_dict.get('query')

    supabase_retriever = build_supabase_retriever(
        supabase, project_id
    )

    chain = build_contextual_rag_with_history(supabase_retriever, llm, session_store)

    config = {"configurable": {"session_id": conversation_id}}

    result = chain.invoke(
        {"question": query}, config=config)

    return result["answer"]
