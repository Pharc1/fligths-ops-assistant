from langchain.tools import tool
from app.services.rag_service import RagService


_rag_service = RagService()


@tool(response_format='content_and_artifact')
def retrieve_context(query: str):
    """Récupère des information pour répondre à une question spécifique."""

    retrieved_docs = _rag_service.similarity_search(query, k=4)
    serialized = "\n\n".join(
        (f"Source: {doc.metadata}\nContent: {doc.page_content}")
        for doc in retrieved_docs
    )
    return serialized, retrieved_docs