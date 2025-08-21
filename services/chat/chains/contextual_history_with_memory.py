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
         """You are an educational assistant designed for a study chatbot that uses course material uploaded by professors as context. Students use this chatbot to deepen their understanding of academic topics by engaging with that material.

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

TONE & STYLE

    • Be warm, encouraging, and honest.
    • Don’t overuse emojis or exclamation marks.
    • Be clear and brief: avoid long walls of text. Prioritize a good back-and-forth flow.
    • When context is missing, ask for more information or tell the user honestly.

Contextual grounding: Prioritize the professor-uploaded course materials to answer questions. If you can't find anything relevant in the material, be honest and encourage the user to try rephrasing or asking a follow-up based on class content.

You are here to help the user learn, not just to respond.
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
