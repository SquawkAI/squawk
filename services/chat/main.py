import os
from uuid import uuid4
from typing import Optional
from dotenv import load_dotenv
from pydantic import BaseModel
import asyncio

import sentry_sdk

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from supabase import Client, create_client
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

from retrievers.SupabaseRetriever import build_supabase_retriever
from chains.contextual_history_with_memory import build_contextual_rag_with_history
from utils.SessionStore import SessionStore

load_dotenv()

APP_ENV = os.getenv("APP_ENV")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Enable sentry monitoring in production
if APP_ENV == "production":
    SENTRY_DSN = os.getenv("SENTRY_DSN")

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        # Add data like request headers and IP for users,
        # see https://docs.sentry.io/platforms/python/data-management/data-collected/ for more info
        send_default_pii=True,
    )

app = FastAPI()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
session_store = SessionStore(max_messages=50)

TONE_RULES = {
    "formal": "Use precise, professional, and structured language. Avoid contractions and colloquialisms.",
    "neutral": "Use clear, plain language. Stay objective and free of emotional or casual phrasing.",
    "informal": "Use relaxed, conversational language with light warmth. Contractions are fine; keep it approachable.",
}

COMPLEXITY_RULES = {
    "introductory": "Assume no prior knowledge. Avoid jargon; define terms briefly and use simple examples.",
    "intermediate": "Provide moderate technical detail. Use some domain terms and brief explanations.",
    "advanced": "Assume subject familiarity. Use precise domain terminology and rigorous explanations.",
}

DETAIL_RULES = {
    "direct": "Answer concisely with only essential facts. Minimize explanation and qualifiers.",
    "default": "Provide a balanced answer with brief supporting context and rationale.",
    "explanatory": "Provide thorough explanation with reasoning, context, background, and—when helpful—short examples.",
}

AUTHORITY_RULES = {
    "supportive": "Adopt an encouraging, coaching tone. Affirm progress and offer gentle guidance and next steps.",
    "authoritative": "Adopt a confident, directive tone. State conclusions decisively and minimize hedging.",
    "default": "Maintain a neutral, matter-of-fact tone. Present information without emphasis or hedging.",
}


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


@app.get("/sentry-debug")
async def trigger_error():
    division_by_zero = 1 / 0


@app.get("/status")
async def status_check():
    return {"status": "ok", "message": "Chat service is live"}


@app.post("/")
async def conversation(request: Request, conversation_request: Conversation):
    data = conversation_request.dict()
    conversation_id = data.get("id") or str(uuid4())
    project_id = data.get("project_id")
    query = data.get("query")

    if not project_id or not query:
        raise HTTPException(
            status_code=400, detail="project_id and query are required")

    project = (
        supabase.table("project")
        .select("id, tone", "complexity", "authority", "detail")
        .eq("id", str(project_id))
        .execute()
    )

    tone = project.data[0]["tone"]
    complexity = project.data[0]["complexity"]
    authority = project.data[0]["authority"]
    detail = project.data[0]["detail"]

    if tone not in TONE_RULES:
        tone = "neutral"
    if complexity not in COMPLEXITY_RULES:
        complexity = "intermediate"
    if detail not in DETAIL_RULES:
        detail = "default"
    if authority not in AUTHORITY_RULES:
        authority = "default"

    sys_prompt = "\n".join([
        "Follow these style requirements:",
        f"- Tone: {TONE_RULES[tone]}",
        f"- Complexity: {COMPLEXITY_RULES[complexity]}",
        f"- Detail depth: {DETAIL_RULES[detail]}",
        f"- Authority: {AUTHORITY_RULES[authority]}",
    ])

    supabase_retriever = build_supabase_retriever(supabase, project_id)
    chain = build_contextual_rag_with_history(
        supabase_retriever, llm, session_store, sys_prompt)
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
