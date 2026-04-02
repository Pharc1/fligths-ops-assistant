"""
RAG tool — recherche dans la documentation technique via ChromaDB.
"""

from langchain.tools import StructuredTool
from pydantic import BaseModel, Field

from app.core.logger import get_logger
from app.services.rag_service import RagService

logger = get_logger(__name__)


class RagSearchInput(BaseModel):
    query: str = Field(description="Question ou sujet à rechercher dans la documentation technique")
    k: int = Field(default=4, description="Nombre de passages à récupérer (défaut: 4)")


def build_rag_tools(rag_service: RagService) -> list[StructuredTool]:

    def rag_search(query: str, k: int = 4) -> str:
        logger.info("rag_search: query='%s', k=%d", query, k)
        docs = rag_service.similarity_search(query, k=k)
        if not docs:
            return "Aucun document pertinent trouvé pour cette recherche."
        return "\n\n".join(
            f"[Source: {doc.metadata.get('source', 'unknown')}]\n{doc.page_content}"
            for doc in docs
        )

    return [
        StructuredTool.from_function(
            func=rag_search,
            name="rag_search",
            args_schema=RagSearchInput,
            description=(
                "Rechercher dans la documentation technique aéronautique : manuels, MEL, "
                "bulletins de service, historique incidents. Utiliser avant toute conclusion."
            ),
        ),
    ]
