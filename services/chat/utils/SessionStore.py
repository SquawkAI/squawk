import time, threading
from typing import Dict, Tuple, List
from langchain_core.chat_history import BaseChatMessageHistory, InMemoryChatMessageHistory
from langchain_core.messages import BaseMessage

TTL_SECONDS = 15 * 60      # 15 minutes
SWEEP_INTERVAL = 60        # sweep every 60s


class CappedHistory(BaseChatMessageHistory):
    """
    Wraps InMemoryChatMessageHistory and keeps only the last `max_messages`.
    Avoids subclassing Pydantic models (which reject new attributes).
    """

    def __init__(self, max_messages: int = 50):
        self._inner = InMemoryChatMessageHistory()
        self._max = int(max_messages)

    # --- BaseChatMessageHistory interface ---
    @property
    def messages(self) -> List[BaseMessage]:
        return self._inner.messages

    def add_message(self, message: BaseMessage) -> None:
        self._inner.add_message(message)
        # Trim to last N
        if self._max and len(self._inner.messages) > self._max:
            self._inner.messages[:] = self._inner.messages[-self._max:]

    def clear(self) -> None:
        self._inner.clear()
    # ---------------------------------------


class SessionStore:
    """In-process chat history keyed by conversation_id, with idle TTL eviction and capped history."""

    def __init__(self, max_messages: int = 50):
        self._max = max_messages
        self._lock = threading.Lock()
        self._sessions: Dict[str, Tuple[CappedHistory, float]] = {}
        threading.Thread(target=self._janitor, daemon=True).start()

    def _janitor(self):
        while True:
            time.sleep(SWEEP_INTERVAL)
            now = time.time()
            with self._lock:
                expired = [sid for sid, (_, last) in self._sessions.items()
                           if now - last > TTL_SECONDS]
                for sid in expired:
                    self._sessions.pop(sid, None)

    def get(self, session_id: str) -> CappedHistory:
        with self._lock:
            hist, _ = self._sessions.get(
                session_id, (CappedHistory(self._max), time.time())
            )
            self._sessions[session_id] = (hist, time.time())
            return hist

    def delete(self, session_id: str) -> None:
        with self._lock:
            self._sessions.pop(session_id, None)
