from langchain_core.prompts import ChatPromptTemplate
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
        "You are a helpful assistant. Use the provided context and conversation history to answer. "
        "If the answer is not in the context, say you don't know."),
        ("placeholder", "{history}"),
        ("human", "Question:\n{standalone}\n\nContext:\n{context}"),
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
