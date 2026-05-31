from __future__ import annotations

import json
from collections.abc import AsyncGenerator, Sequence
from typing import Any

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage

from app.agents.events import AgentEvent
from app.agents.intent import AgentIntent, IntentRouter
from app.agents.model_adapter import AgentModelResponse, ModelAdapter, ToolCall
from app.agents.workflow import InMemoryWorkflowRepository
from app.core.logger import get_logger
from app.skills.registry import SkillRegistry

logger = get_logger(__name__)


class RimeAgentEngine:
    """Explicit RIME agent loop.

    The engine controls tool execution itself. This avoids provider auto-execution
    surprises and makes "one tool call = one tool execution" testable.
    """

    def __init__(
        self,
        model: ModelAdapter,
        tools: Sequence[Any],
        skill_registry: SkillRegistry,
        workflow_repo: InMemoryWorkflowRepository,
        intent_router: IntentRouter | None = None,
        max_turns: int = 8,
    ) -> None:
        self._model = model
        self._tools = list(tools)
        self._tool_map = {tool.name: tool for tool in self._tools}
        self._skill_registry = skill_registry
        self._workflow_repo = workflow_repo
        self._intent_router = intent_router or IntentRouter()
        self._max_turns = max_turns

    async def stream(
        self,
        query: str,
        *,
        session_id: str = "interactive",
        forced_intent: AgentIntent | None = None,
    ) -> AsyncGenerator[AgentEvent, None]:
        decision = self._intent_router.route(query, forced_intent=forced_intent)
        skill_instructions = self._load_skills(decision.skill_names)
        messages: list[BaseMessage] = [
            SystemMessage(content=self._build_system_prompt(decision.intent.value, skill_instructions)),
            HumanMessage(content=query),
        ]

        yield AgentEvent(
            type="system_init",
            data={
                "session_id": session_id,
                "intent": decision.intent.value,
                "skills": decision.skill_names,
                "tools": list(self._tool_map.keys()),
            },
        )

        last_content = ""
        for turn_index in range(self._max_turns):
            message_id = f"turn-{turn_index + 1}"
            yield AgentEvent(type="message_start", data={"message_id": message_id})

            response = await self._model.ainvoke(messages, self._tools)
            last_content = response.content
            if response.content:
                yield AgentEvent(
                    type="assistant_delta",
                    data={"message_id": message_id, "content": response.content},
                )

            yield AgentEvent(
                type="message_end",
                data={"message_id": message_id, "tool_call_count": len(response.tool_calls)},
            )

            messages.append(_assistant_message(response))

            if not response.tool_calls:
                yield AgentEvent(
                    type="result",
                    data={"reason": "completed", "content": response.content},
                )
                return

            for call in response.tool_calls:
                yield AgentEvent(
                    type="tool_use",
                    data={"toolName": call.name, "toolUseId": call.id, "input": call.args},
                )
                output, is_error = self._execute_tool(call)
                yield AgentEvent(
                    type="tool_result",
                    data={
                        "toolName": call.name,
                        "toolUseId": call.id,
                        "result": output,
                        "isError": is_error,
                    },
                )
                if not is_error:
                    async for event in self._semantic_events(call.name, output):
                        yield event
                messages.append(ToolMessage(content=_stringify_output(output), tool_call_id=call.id))

        yield AgentEvent(
            type="result",
            data={"reason": "max_turns", "content": last_content},
        )

    def _execute_tool(self, call: ToolCall) -> tuple[Any, bool]:
        tool = self._tool_map.get(call.name)
        if tool is None:
            return {"error": f"Unknown tool: {call.name}"}, True
        try:
            return tool.invoke(call.args), False
        except Exception as exc:
            logger.warning("Tool execution failed | tool=%s error=%s", call.name, exc)
            return {"error": str(exc)}, True

    async def _semantic_events(self, tool_name: str, output: Any) -> AsyncGenerator[AgentEvent, None]:
        parsed = _maybe_json(output)
        if tool_name == "display_panel":
            yield AgentEvent(type="panel", data={"panel": parsed})
        elif tool_name.startswith("workflow_"):
            yield AgentEvent(type="workflow", data={"workflow": parsed})

    def _load_skills(self, names: list[str]) -> str:
        loaded: list[str] = []
        for name in names:
            try:
                skill = self._skill_registry.activate(name)
                loaded.append(f"# Skill: {skill.name}\n{skill.instructions}")
            except Exception as exc:
                logger.warning("Skill '%s' unavailable: %s", name, exc)
        return "\n\n".join(loaded)

    @staticmethod
    def _build_system_prompt(intent: str, skill_instructions: str) -> str:
        return f"""Tu es RIME, Reasoning & Inference Maintenance Engine.
Tu assistes un technicien MRO sur un incident aéronautique déjà contextualisé.

Intent courant: {intent}

Règles permanentes:
- Réponds court, opérationnel, et vérifiable.
- Ne prétends pas décider à la place du MRO.
- Utilise les tools pour rechercher, planifier, afficher les preuves et piloter les procédures.
- Avant d'appeler un tool, écris une phrase courte pour dire ce que tu vérifies.
- Après un résultat tool, si tu dois appeler un autre tool, écris une phrase courte sur la suite.
- N'expose pas ton raisonnement interne détaillé; affiche seulement l'avancement utile au MRO.
- Quand une valeur, une limite ou une procédure est citée, fournis une preuve via display_panel si l'UI est disponible.
- En mode investigation, mets le titre d'écran dans payload.headline et ton commentaire opérateur dans payload.spoken ou payload.commentary.
- Pour un panel document, transmets les lignes rag_search dans payload.results et la valeur exacte à mettre en avant dans payload.value ou payload.highlight.
- N'ajoute pas de recommandation générique si le MRO demande seulement une valeur, une source ou une vérification.
- Si les preuves sont insuffisantes, dis-le clairement.

{skill_instructions}
"""


def _assistant_message(response: AgentModelResponse) -> AIMessage:
    return AIMessage(
        content=response.content,
        tool_calls=[
            {"id": call.id, "name": call.name, "args": call.args}
            for call in response.tool_calls
        ],
    )


def _maybe_json(output: Any) -> Any:
    if not isinstance(output, str):
        return output
    try:
        return json.loads(output)
    except json.JSONDecodeError:
        return output


def _stringify_output(output: Any) -> str:
    if isinstance(output, str):
        return output
    return json.dumps(output, ensure_ascii=False)
