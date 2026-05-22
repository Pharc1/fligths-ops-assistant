from app.core.logger import get_logger
from app.services.gemini_service import GeminiService

logger = get_logger(__name__)


class AnalysisService:
    """Legacy compatibility wrapper.

    New incident analysis flows should use AgentService. This class remains import-safe
    for old code paths while avoiding global RAG/model side effects at import time.
    """

    def __init__(self, llm_service: GeminiService):
        self._llm_service = llm_service

    def analyze_incident(self, query: str) -> str:
        logger.info("Legacy analysis service called")
        try:
            return self._llm_service.generate(query)
        except Exception as exc:
            logger.error("Legacy analysis service failed: %s", exc)
            return "Erreur lors de l'analyse"
