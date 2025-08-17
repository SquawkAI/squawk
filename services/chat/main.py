import sys
import os
from uuid import uuid4
from typing import Optional
from dotenv import load_dotenv
from pydantic import BaseModel

from fastapi import FastAPI, HTTPException
from supabase import Client, create_client
from langchain_openai import ChatOpenAI

from fastapi.responses import StreamingResponse
import asyncio

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


def extract_text(chunk):
    # token strings
    if isinstance(chunk, str):
        return chunk
    # LangChain message chunk (e.g., AIMessageChunk)
    content = getattr(chunk, "content", None)
    if isinstance(content, str) and content:
        return content
    # dict payloads
    if isinstance(chunk, dict):
        # prefer model output keys; ignore "standalone", "docs", etc.
        for k in ("answer", "output_text", "output", "text"):
            if isinstance(chunk.get(k), str) and chunk[k]:
                return chunk[k]
    return ""


@app.get('/status')
async def status_check():
    return {"status": "ok", "message": "Chat service is live"}


@app.post("/conversation")
async def conversation(conversation_request: Conversation):
    data = conversation_request.dict()
    conversation_id = data.get("id") or str(uuid4())
    project_id = data.get("project_id")
    query = data.get("query")

    if not project_id or not query:
        raise HTTPException(
            status_code=400, detail="project_id and query are required")

    supabase_retriever = build_supabase_retriever(supabase, project_id)
    chain = build_contextual_rag_with_history(
        supabase_retriever, llm, session_store)
    config = {"configurable": {"session_id": conversation_id}}

    async def sse():
        try:
            async for chunk in chain.astream({"question": query}, config=config):
                text = extract_text(chunk)
                if text:
                    # SSE frame
                    yield f"data: {text}\n\n"
                    # give event loop a tick so proxies flush promptly
                    await asyncio.sleep(0)
            # optional completion signal
            yield "event: end\ndata: [done]\n\n"
        except Exception as e:
            yield f"event: error\ndata: {str(e)}\n\n"

    resp = StreamingResponse(sse(), media_type="text/event-stream")
    # helpful anti-buffering headers for Nginx/Cloudflare
    resp.headers["Cache-Control"] = "no-cache"
    resp.headers["Connection"] = "keep-alive"
    resp.headers["X-Accel-Buffering"] = "no"
    return resp
