import json
from typing import Any, Dict, List
from pydantic import BaseModel, Field

from langchain.tools import StructuredTool
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain.tools.render import render_text_description

import logging
logger = logging.getLogger("virtual_ta")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)

SYSTEM = """
You are an educational assistant designed for a study chatbot that uses course material uploaded by professors as context. Students use this chatbot to deepen their understanding of academic topics by engaging with that material.

Engage warmly yet honestly with the user. Be direct; avoid ungrounded or sycophantic flattery. Respect the user’s personal boundaries, fostering interactions that encourage independence rather than emotional dependency on the chatbot. Maintain professionalism and grounded honesty that best represents OpenAI and its values.

STUDY MODE CONTEXT

The user is currently STUDYING. You MUST follow these strict rules during this chat:

STRICT RULES

You are an approachable-yet-dynamic teacher who helps the user learn by guiding them through their studies.

    • Use the uploaded course content as your primary reference when answering questions.

    • Guide the user through problems step-by-step. Don't give direct answers right away. Instead, ask guiding questions and help the user arrive at the answer themselves.

    • After each explanation or difficult concept, confirm understanding. Ask them to explain it back, summarize, or apply it.

    • Adapt your rhythm: Mix in short explanations, questions, and light interactive activities (like “explain it to me,” fill-in-the-blanks, or roleplay). This keeps the session active and conversational.

    • NEVER DO THE WORK FOR THE USER.
        - If the user presents a problem (math, code, logic, etc.), do NOT solve it immediately.
        - Break it down and solve it with them, one step at a time.
        - Always wait for the user’s response before moving on.

YOU CAN:

    • Teach course-aligned concepts clearly and interactively.
    • Help with assignments by guiding—not answering.
    • Run practice questions based on the context provided.
    • Ask questions to reinforce understanding.
    • Explain and correct mistakes with patience and kindness.

Contextual grounding: Prioritize the professor-uploaded course materials to answer questions. If you can't find anything relevant in the material, be honest and encourage the user to try rephrasing or asking a follow-up based on class content.

You are here to help the user learn, not just to respond.

Tool contract (internal):
- The tool returns a JSON object with a key 'snippets' (list of objects with keys: text, title, page (optional), id (optional)).
- Use it to pull accurate course-specific facts, then answer normally. Only include (Title, p. X) if the student asks for sources.
"""


def build_virtual_ta_agent(
    retriever,
    session_store,
    *,
    model: str = "gpt-4o-mini",
    temperature: float = 0.3,
    k_default: int = 4,
    snippet_char_limit: int = 1200,
    sys_style: str = "",
):
    class RetrieveArgs(BaseModel):
        query: str = Field(...,
                           description="Student's question or focused lookup")
        k: int = Field(
            k_default, description="How many snippets to fetch (top-k)")

    def retrieve_course_materials_impl(query: str, k: int = k_default) -> str:
        logger.info(">>> retrieve_course_materials_impl CALLED")
        logger.info(f"[Retriever Query] {query}")

        docs = retriever.get_relevant_documents(query)[:k]
        snippets: List[Dict[str, Any]] = []
        for d in docs:
            meta = getattr(d, "metadata", {}) or {}
            text = (getattr(d, "page_content", "") or "")[:snippet_char_limit]
            snippet = {
                "text": text,
                "title": meta.get("title") or meta.get("source") or "Course material",
                "page": meta.get("page"),
                "id": meta.get("doc_id") or meta.get("source"),
            }
            snippets.append(snippet)
            print(f"[Retrieved Snippet] {json.dumps(snippet, indent=2)}")
        return json.dumps({"snippets": snippets})

    retrieve_tool = StructuredTool.from_function(
        func=retrieve_course_materials_impl,
        name="retrieve_course_materials",
        description=("Fetch short, relevant snippets (syllabus, due dates, policies, lecture content, definitions unique to this class) from professor-uploaded materials "),
        args_schema=RetrieveArgs,
        return_direct=False,
    )

    # Prompt
    system_block = (sys_style.strip() +
                    "\n\n" if sys_style else "") + SYSTEM.strip()
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_block +
         "\n\nYou can use these tools if needed:\n{tools}"),
        MessagesPlaceholder("history"),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ]).partial(tools=render_text_description([retrieve_tool]))

    llm = ChatOpenAI(model=model, temperature=temperature)

    agent = create_tool_calling_agent(llm, [retrieve_tool], prompt)
    executor = AgentExecutor(
        agent=agent,
        tools=[retrieve_tool],
        verbose=False,
        max_iterations=3,
        handle_parsing_errors=True,
    )

    async def stream(question: str, session_id: str):
        history = session_store.get(session_id)

        hinted = question + \
            "\n\n(If course-specific or unsure, call `retrieve_course_materials` before answering.)"

        # Buffer to save the final assistant message to history later
        buf = []

        async for event in executor.astream_events(
            {"input": hinted, "history": history.messages},
            version="v1"
        ):
            et = event["event"]

            # Stream only LLM token chunks to the client
            if et == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                text = chunk.content
                if text:
                    buf.append(text)
                    yield text

        # Persist conversation after the full output is known
        final_text = "".join(buf)
        history.add_user_message(question)
        history.add_ai_message(final_text)

    def run(question: str, session_id: str) -> str:
        history = session_store.get(session_id)

        # Optional: tiny hint that increases tool usage without forcing
        hinted = question + \
            "\n\n(If course-specific or unsure, call `retrieve_course_materials` before answering.)"

        result = executor.invoke(
            {"input": hinted, "history": history.messages})
        text = result.get("output", "")

        history.add_user_message(question)
        history.add_ai_message(text)
        return text

    return run, stream
