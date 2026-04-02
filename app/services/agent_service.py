"""
AgentService — moteur des deux modes de l'application.

Mode 2 (interactif) : stream() — yield des événements SSE pendant que l'agent travaille
Mode 1 (Kafka)      : run()    — exécute l'agent et retourne le résultat final

Les deux modes utilisent le même agent avec les mêmes tools.
La différence : stream() yield des SSE, run() retourne une string.
"""

import json
from collections.abc import AsyncGenerator
from typing import Any

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.core.config import settings
from app.core.exceptions import AgentError, AgentMaxIterationsError
from app.core.logger import get_logger
from app.core.prompts import build_agent_system_prompt
from app.services.gemini_service import GeminiService
from app.services.rag_service import RagService
from app.skills.registry import SkillRegistry
from app.tools.builder import build_all_tools
from app.tools.task_store import TaskStore
from app.tools.ui_tools import UI_TOOL_NAMES

logger = get_logger(__name__)


def _sse(event_type: str, data: dict[str, Any]) -> str:
    return f"data: {json.dumps({'type': event_type, **data})}\n\n"


class AgentService:
    def __init__(
        self,
        llm_service: GeminiService,
        rag_service: RagService,
        skill_registry: SkillRegistry,
    ) -> None:
        self._llm = llm_service.llm
        self._rag_service = rag_service
        self._skill_registry = skill_registry

    def _build_prompt(self) -> ChatPromptTemplate:
        system = build_agent_system_prompt(self._skill_registry.discovery_prompt())
        return ChatPromptTemplate.from_messages([
            ("system", system),
            MessagesPlaceholder("chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder("agent_scratchpad"),
        ])

    def _build_executor(self, include_ui: bool = True) -> tuple[AgentExecutor, TaskStore]:
        task_store = TaskStore()
        tools = build_all_tools(task_store, self._rag_service, self._skill_registry, include_ui=include_ui)
        agent = create_tool_calling_agent(self._llm, tools, self._build_prompt())
        executor = AgentExecutor(
            agent=agent,
            tools=tools,
            max_iterations=settings.LLM_MAX_ITERATIONS,
            handle_parsing_errors=True,
            verbose=settings.DEBUG,
        )
        return executor, task_store

    async def stream(self, query: str) -> AsyncGenerator[str, None]:
        """
        Mode 2 — stream les événements SSE pendant que l'agent travaille.

        Événements émis :
          {"type": "tool_start", "tool": "rag_search", "input": {...}}
          {"type": "tool_end",   "tool": "rag_search", "output": "..."}
          {"type": "token",      "content": "..."}
          {"type": "done",       "content": "réponse finale complète"}
        """
        executor, _ = self._build_executor()
        logger.info("Agent stream started | query='%s'", query[:80])
        full_response = ""

        try:
            async for event in executor.astream_events({"input": query}, version="v2"):
                kind = event["event"]

                if kind == "on_tool_start":
                    yield _sse("tool_start", {
                        "tool": event["name"],
                        "input": event.get("data", {}).get("input", {}),
                    })

                elif kind == "on_tool_end":
                    tool_name = event["name"]
                    output = event.get("data", {}).get("output", "")
                    if tool_name in UI_TOOL_NAMES:
                        # UI tool : on émet un événement "widget" avec les données JSON parsées
                        try:
                            widget_data = json.loads(output) if isinstance(output, str) else output
                        except json.JSONDecodeError:
                            widget_data = {"raw": str(output)}
                        yield _sse("widget", {"widget": tool_name, "data": widget_data})
                    else:
                        yield _sse("tool_end", {
                            "tool": tool_name,
                            "output": str(output)[:500],
                        })

                elif kind == "on_chat_model_stream":
                    chunk = event.get("data", {}).get("chunk")
                    if chunk and hasattr(chunk, "content") and chunk.content:
                        full_response += chunk.content
                        yield _sse("token", {"content": chunk.content})

                elif kind == "on_chain_end" and event.get("name") == "AgentExecutor":
                    final = event.get("data", {}).get("output", {}).get("output", full_response)
                    yield _sse("done", {"content": final})
                    logger.info("Agent stream completed")

        except Exception as exc:
            err = str(exc)
            if "max_iterations" in err.lower():
                raise AgentMaxIterationsError(
                    f"L'agent a dépassé {settings.LLM_MAX_ITERATIONS} itérations.",
                    details={"query": query},
                )
            logger.error("Agent stream error: %s", exc)
            raise AgentError("Erreur lors de l'exécution de l'agent.", details={"cause": err})

    async def run(self, query: str) -> str:
        """
        Mode 1 (Kafka) — même agent, mêmes tools, sans streaming ni UI tools.
        """
        executor, _ = self._build_executor(include_ui=False)
        logger.info("Agent run started | query='%s'", query[:80])
        try:
            result = await executor.ainvoke({"input": query})
            logger.info("Agent run completed")
            return result.get("output", "")
        except Exception as exc:
            logger.error("Agent run error: %s", exc)
            raise AgentError("Erreur lors de l'exécution de l'agent.", details={"cause": str(exc)})
