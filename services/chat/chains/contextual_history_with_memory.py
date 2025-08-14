from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableParallel
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.output_parsers import StrOutputParser

from utils.langchainUtils import format_docs

def build_contextual_rag_with_history(retriever, llm):
    """
    Build a conversational RAG chain with:
      1) Query contextualization: rewrite (history, question) -> standalone query.
      2) Retrieval: fetch top-k documents for the standalone query.
      3) Answering: prompt the LLM with {history} and {context}.
      4) Ephemeral session memory: RunnableWithMessageHistory using InMemoryChatMessageHistory.

    Returns:
      A Runnable that, when invoked with:
        - input: {"question": "<user text>"}
        - config: {"configurable": {"session_id": "<session id>"}}
      yields:
        {"answer": "<string>", "docs": List[Document]}
    """

    # 1) Turn (history, question) -> standalone question
    contextualize_q = (
        ChatPromptTemplate.from_messages([
            ("system", "Rewrite the latest user question into a standalone query using the chat history. "
                       "Do NOT answer it; return only the rewritten question."),
            ("placeholder", "{history}"),
            ("human", "{question}")
        ])
        | llm
        | StrOutputParser()
    )

    # 2) Build prompt that sees history + retrieved context
    answer_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful assistant. Use the provided context and conversation history to answer. "
                   "If the answer is not in the context, say you don't know."),
        ("placeholder", "{history}"),
        ("human", "Question:\n{standalone}\n\nContext:\n{context}")
    ])

    # 3) Wire it up
    # Select fields explicitly so we don't pass the whole dict
    standalone = {
        "history": lambda x: x["history"],
        "question": lambda x: x["question"],
    } | contextualize_q

    docs = standalone | retriever
    
    answer = (
        {"context": docs | format_docs, "standalone": standalone}
        | answer_prompt
        | llm
        | StrOutputParser()
    )
    base_chain = RunnableParallel(docs=docs, answer=answer)

    # 4) Ephemeral per-session history
    _HIST = {}

    def get_session_history(session_id: str):
        if session_id not in _HIST:
            _HIST[session_id] = InMemoryChatMessageHistory()
        return _HIST[session_id]

    return RunnableWithMessageHistory(
        base_chain,
        get_session_history,
        input_messages_key="question",
        history_messages_key="history",
        output_messages_key="answer",
    )