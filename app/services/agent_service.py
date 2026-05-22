from collections.abc import AsyncGenerator

from app.agents.engine import RimeAgentEngine
from app.agents.intent import AgentIntent
from app.agents.model_adapter import LangChainModelAdapter, ModelAdapter
from app.agents.workflow import InMemoryWorkflowRepository
from app.core.config import settings
from app.core.exceptions import AgentError, AgentMaxIterationsError
from app.core.logger import get_logger
from app.services.llm_interface import LLMInterface
from app.services.rag_service import RagService
from app.skills.registry import SkillRegistry
from app.tools.builder import build_all_tools

logger = get_logger(__name__)


class AgentService:
    """Facade used by FastAPI and Kafka.

    Interactive mode streams SSE events and includes UI tools.
    Kafka pre-analysis mode returns final text and excludes UI tools.
    """

    def __init__(
        self,
        llm_service: LLMInterface | None,
        rag_service: RagService,
        skill_registry: SkillRegistry,
        workflow_repo: InMemoryWorkflowRepository,
        model_adapter: ModelAdapter | None = None,
    ) -> None:
        self._llm = getattr(llm_service, "llm", llm_service)
        self._rag_service = rag_service
        self._skill_registry = skill_registry
        self._workflow_repo = workflow_repo
        self._model_adapter = model_adapter

    async def stream(self, query: str, session_id: str = "interactive") -> AsyncGenerator[str, None]:
        logger.info("Agent stream started | query='%s'", query[:80])
        try:
            engine = self._build_engine(include_ui=True)
            async for event in engine.stream(query, session_id=session_id):
                yield event.to_sse()
            logger.info("Agent stream completed")
        except Exception as exc:
            logger.error("Agent stream error: %s", exc)
            raise AgentError("Erreur lors de l'exécution de l'agent.", details={"cause": str(exc)}) from exc

    async def run(self, query: str, session_id: str = "kafka") -> str:
        logger.info("Agent run started | query='%s'", query[:80])
        try:
            engine = self._build_engine(include_ui=False)
            final_content = ""
            async for event in engine.stream(
                query,
                session_id=session_id,
                forced_intent=AgentIntent.INCIDENT_PREANALYSIS,
            ):
                if event.type == "result":
                    reason = event.data.get("reason")
                    if reason == "max_turns":
                        raise AgentMaxIterationsError(
                            f"L'agent a dépassé {settings.LLM_MAX_ITERATIONS} itérations.",
                            details={"query": query},
                        )
                    final_content = str(event.data.get("content", ""))
            logger.info("Agent run completed")
            return final_content
        except AgentMaxIterationsError:
            raise
        except Exception as exc:
            logger.error("Agent run error: %s", exc)
            raise AgentError("Erreur lors de l'exécution de l'agent.", details={"cause": str(exc)}) from exc

    def _build_engine(self, include_ui: bool) -> RimeAgentEngine:
        tools = build_all_tools(
            workflow_repo=self._workflow_repo,
            rag_service=self._rag_service,
            include_ui=include_ui,
        )
        model = self._model_adapter or LangChainModelAdapter(self._llm)
        return RimeAgentEngine(
            model=model,
            tools=tools,
            skill_registry=self._skill_registry,
            workflow_repo=self._workflow_repo,
            max_turns=settings.LLM_MAX_ITERATIONS,
        )
