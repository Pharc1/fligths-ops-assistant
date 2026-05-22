from langchain_core.tools import tool


@tool(response_format="content_and_artifact")
def retrieve_context(query: str):
    """Legacy retrieval tool kept for compatibility with older analysis flows."""
    from app.services.rag_service import RagService

    retrieved_docs = RagService().similarity_search(query, k=4)
    serialized = "\n\n".join(
        f"Source: {doc.metadata}\nContent: {doc.page_content}"
        for doc in retrieved_docs
    )
    return serialized, retrieved_docs
