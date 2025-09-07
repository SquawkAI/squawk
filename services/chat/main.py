import os
from uuid import uuid4
from typing import Optional
from dotenv import load_dotenv
from pydantic import BaseModel
import asyncio

import sentry_sdk
from sentry_sdk.crons import monitor

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from supabase import Client, create_client

from langchain_openai import ChatOpenAI

from retrievers.SupabaseRetriever import build_supabase_retriever
from chains.contextual_history_with_memory import build_virtual_ta_agent
from utils.SessionStore import SessionStore

load_dotenv()

APP_ENV = os.getenv("APP_ENV")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

app = FastAPI()
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Enable sentry monitoring in production
if APP_ENV == "production":
    SENTRY_DSN = os.getenv("SENTRY_DSN")
    MONITOR_SLUG = os.getenv("SENTRY_MONITOR_SLUG")
    HEARTBEAT_SEC = int(os.getenv("SENTRY_MONITOR_INTERVAL_SEC", "3600"))

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        send_default_pii=True,
    )

    @app.on_event("startup")
    async def start_heartbeat():
        async def _beat():
            with monitor(monitor_slug=MONITOR_SLUG):
                pass
            while True:
                try:
                    await asyncio.sleep(HEARTBEAT_SEC)
                    with monitor(monitor_slug=MONITOR_SLUG):
                        pass
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    sentry_sdk.capture_exception(e)

        app.state.sentry_heartbeat_task = asyncio.create_task(_beat())

    @app.on_event("shutdown")
    async def stop_heartbeat():
        task = getattr(app.state, "sentry_heartbeat_task", None)
        if task and not task.done():
            task.cancel()
            try:
                await task
            except Exception:
                pass

# Optional; not required by the agent builder below
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# IMPORTANT: SessionStore must be LangChain-compatible (has .get(session_id) -> history with
# .messages (BaseMessage[]), .add_user_message(), .add_ai_message()).
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
    lines = text.split("\n")
    out = []
    for ln in lines:
        out.append(f"data: {ln}\n")
    out.append("\n")
    return "".join(out)


@app.get("/sentry-debug")
async def trigger_error():
    _ = 1 / 0


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
        .select("id, tone, complexity, authority, detail")
        .eq("id", str(project_id))
        .execute()
    )
    if not project.data:
        raise HTTPException(status_code=404, detail="project not found")

    tone = project.data[0].get("tone")
    complexity = project.data[0].get("complexity")
    authority = project.data[0].get("authority")
    detail = project.data[0].get("detail")

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

    agent_run, agent_stream = build_virtual_ta_agent(
        retriever=supabase_retriever,
        session_store=session_store,
        model="gpt-4o-mini",
        temperature=0.3,
        k_default=4,
        snippet_char_limit=1200,
        sys_style=sys_prompt,
    )

    async def sse_generator():
        try:
            # Stream token chunks as SSE lines
            async for chunk in agent_stream(query, conversation_id):
                # You can batch or throttle if you want; simplest is line-per-chunk:
                yield _sse_event_from_text(chunk)
                await asyncio.sleep(0)

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