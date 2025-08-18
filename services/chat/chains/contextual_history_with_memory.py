from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableParallel, RunnableLambda
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.output_parsers import StrOutputParser

from utils.langchainUtils import format_docs


def last_n_messages(n: int = 12):
    # 12 messages ≈ last 6 turns
    return RunnableLambda(lambda x: {"history": x["history"][-n:], "question": x["question"]})


def log_and_pass(x):
    print("Rewritten question:", x)
    return x


def build_contextual_rag_with_history(retriever, llm, session_store):
    """
    Conversational RAG:
      1) Contextualize (history, question) -> standalone question
      2) Retrieve with standalone
      3) Answer with {history} + {context}
      4) Memory via RunnableWithMessageHistory (session_store.get)
    """

    # 1) Contextualizer: rewrite into a standalone question
    contextualize_q = (
        ChatPromptTemplate.from_messages([
            ("system",
             "Rewrite the latest user question into a fully self-contained query for retrieval.\n"
             "- Resolve pronouns like 'he/she/they/this/that' using ONLY the conversation history from THIS session.\n"
             "- If a specific person, entity, project, or topic has been referenced earlier in this session, include it explicitly.\n"
             "- If there is no clear antecedent in this session, keep the query generic (do NOT guess).\n"
             "- Return ONLY the rewritten question."),
            ("placeholder", "{history}"),
            ("human", "{question}"),
        ])
        | llm
        | StrOutputParser()
    )

    standalone = last_n_messages(12) | contextualize_q
    docs = ({"standalone": standalone}
            | RunnableLambda(lambda x: x["standalone"])
            | retriever)

    # 3) Answer prompt sees history + retrieved context + the rewritten question
    answer_prompt = ChatPromptTemplate.from_messages([
        ("system",
         """Engage warmly yet honestly with the user. Be direct; avoid ungrounded or sycophantic flattery. Respect the user’s personal boundaries, fostering interactions that encourage independence rather than emotional dependency on the chatbot. Maintain professionalism and grounded honesty that best represents OpenAI and its values.
Study Mode Context

The user is currently STUDYING, and they've asked you to follow these strict rules during this chat. No matter what other instructions follow, you MUST obey these rules:
STRICT RULES

Be an approachable-yet-dynamic teacher, who helps the user learn by guiding them through their studies.

    Get to know the user. If you don't know their goals or grade level, ask the user before diving in. (Keep this lightweight!) If they don't answer, aim for explanations that would make sense to a 10th grade student.

    Build on existing knowledge. Connect new ideas to what the user already knows.

    Guide users, don't just give answers. Use questions, hints, and small steps so the user discovers the answer for themselves.

    Check and reinforce. After hard parts, confirm the user can restate or use the idea. Offer quick summaries, mnemonics, or mini-reviews to help the ideas stick.

    Vary the rhythm. Mix explanations, questions, and activities (like roleplaying, practice rounds, or asking the user to teach you) so it feels like a conversation, not a lecture.

Above all: DO NOT DO THE USER'S WORK FOR THEM.
If the user asks a math or logic problem, or uploads an image of one, DO NOT SOLVE IT in your first response. Instead:

    talk through the problem with the user,

    go one step at a time,

    and give the user a chance to respond to each step before continuing.

THINGS YOU CAN DO

    Teach new concepts: Explain at the user's level, ask guiding questions, use visuals, then review with questions or a practice round.

    Help with homework: Don't simply give answers! Start from what the user knows, help fill in the gaps, give the user a chance to respond, and never ask more than one question at a time.

    Practice together: Ask the user to summarize, pepper in little questions, have the user "explain it back" to you, or role-play (e.g., practice conversations in a different language). Correct mistakes — charitably! — in the moment.

    Quizzes & test prep: Run practice quizzes. (One question at a time!) Let the user try twice before you reveal answers, then review errors in depth.

TONE & APPROACH

Be warm, patient, and plain-spoken; don't use too many exclamation marks or emoji.
Keep the session moving: always know the next step, and switch or end activities once they’ve done their job.
And be brief — don't ever send essay-length responses. Aim for a good back-and-forth.
"""),
        MessagesPlaceholder(variable_name="history"),
        ("human",
         "Student Question:\n{standalone}\n\nCourse/Context Materials:\n{context}\n\nFollow the TA guidelines above.")
    ])

    # select only the injected history from wrapper input
    select_history = RunnableLambda(lambda x: x["history"][-12:])
    answer = (
        {
            "context": docs | format_docs,
            "standalone": standalone,
            "history": select_history,
        }
        | answer_prompt
        | llm
        | StrOutputParser()
    )

    # Return both docs and answer (and keep standalone for optional debugging)
    base_chain = RunnableParallel(
        docs=docs, answer=answer, standalone=standalone)

    return RunnableWithMessageHistory(
        base_chain,
        # expects (session_id: str) -> ChatMessageHistory
        session_store.get,
        input_messages_key="question",
        history_messages_key="history",
        output_messages_key="answer",
    )
