from typing import List

from langchain_core.documents import Document

def format_docs(docs: List[Document]) -> str:
    """
    Join retrieved documents into a single context string for the answer prompt.
    Keeps formatting simple; customize to include titles, scores, or sources.
    """

    return "\n\n---\n\n".join(d.page_content for d in docs)