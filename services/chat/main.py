import os
from uuid import uuid4
from typing import Optional
from dotenv import load_dotenv
from pydantic import BaseModel
import asyncio

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from supabase import Client, create_client
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

from utils.security import get_user_id_from_request, assert_project_owned

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


def _sse_event_from_text(text: str) -> str:
    """Encode text as one SSE event, preserving newlines per spec."""
    lines = text.split("\n")
    out = []
    for ln in lines:
        # empty line -> contributes '\n' when client joins
        out.append(f"data: {ln}\n")
    out.append("\n")  # end of event
    return "".join(out)


@app.get("/status")
async def status_check():
    return {"status": "ok", "message": "Chat service is live"}


@app.post("/")
async def conversation(request: Request, conversation_request: Conversation):
    data = conversation_request.dict()
    conversation_id = data.get("id") or str(uuid4())
    project_id = data.get("project_id")
    query = data.get("query")

    user_id = get_user_id_from_request(request)
    assert_project_owned(supabase, project_id, user_id)

    if not project_id or not query:
        raise HTTPException(
            status_code=400, detail="project_id and query are required")

    supabase_retriever = build_supabase_retriever(supabase, project_id)
    chain = build_contextual_rag_with_history(
        supabase_retriever, llm, session_store)
    config = {"configurable": {"session_id": conversation_id}}

    # IMPORTANT: project the chain output to ONLY the final answer,
    # so we don't stream 'standalone' rewrite or 'docs' events.
    answer_only = chain.pick("answer") | StrOutputParser()

    async def sse_generator():
        try:
            async for token in answer_only.astream({"question": query}, config=config):
                # token is a plain string chunk from the final answer only
                if token:
                    yield _sse_event_from_text(token)
                    await asyncio.sleep(0)
            # completion marker (optional)
            yield "data: [done]\n\n"
        except asyncio.CancelledError:
            return
        except Exception as e:
            yield f"event: error\ndata: {str(e)}\n\n"

    resp = StreamingResponse(sse_generator(), media_type="text/event-stream")
    resp.headers["Cache-Control"] = "no-cache"
    resp.headers["Connection"] = "keep-alive"
    resp.headers["X-Accel-Buffering"] = "no"
    return resp
