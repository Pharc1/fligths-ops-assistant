"""
Dépendances FastAPI — injectées dans les endpoints via Depends().

Centraliser ici évite de re-instancier les services à chaque requête.
Les services lourds (RAG, LLM) sont construits une fois et réutilisés.
"""

from functools import lru_cache
from typing import Annotated

from fastapi import Depends

from app.agents.workflow import InMemoryWorkflowRepository
from app.core.config import settings
from app.services.agent_service import AgentService
from app.services.ai_gateway_service import AIGatewayService
from app.services.gemini_service import GeminiService
from app.services.llm_interface import LLMInterface
from app.services.rag_service import RagService
from app.skills.registry import skill_registry


@lru_cache
def get_llm_service() -> LLMInterface:
    if settings.resolved_llm_provider == "ai_gateway":
        return AIGatewayService()
    return GeminiService()


@lru_cache
def get_gemini_service() -> GeminiService:
    return GeminiService()


@lru_cache
def get_rag_service() -> RagService:
    return RagService()


@lru_cache
def get_workflow_repository() -> InMemoryWorkflowRepository:
    return InMemoryWorkflowRepository()


def get_agent_service(
    llm_service: Annotated[LLMInterface, Depends(get_llm_service)],
    rag_service: Annotated[RagService, Depends(get_rag_service)],
    workflow_repo: Annotated[InMemoryWorkflowRepository, Depends(get_workflow_repository)],
) -> AgentService:
    return AgentService(llm_service, rag_service, skill_registry, workflow_repo)
