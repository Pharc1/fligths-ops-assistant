"""
Dépendances FastAPI — injectées dans les endpoints via Depends().

Centraliser ici évite de re-instancier les services à chaque requête.
Les services lourds (RAG, LLM) sont construits une fois et réutilisés.
"""

from functools import lru_cache

from fastapi import Depends

from app.services.agent_service import AgentService
from app.services.gemini_service import GeminiService
from app.services.rag_service import RagService
from app.skills.registry import skill_registry


@lru_cache
def get_gemini_service() -> GeminiService:
    return GeminiService()


@lru_cache
def get_rag_service() -> RagService:
    return RagService()


def get_agent_service(
    llm_service: GeminiService = Depends(get_gemini_service),
    rag_service: RagService = Depends(get_rag_service),
) -> AgentService:
    return AgentService(llm_service, rag_service, skill_registry)
