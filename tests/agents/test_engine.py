import json

import pytest
from langchain_core.tools import StructuredTool

from app.agents.engine import RimeAgentEngine
from app.agents.model_adapter import AgentModelResponse, FakeModelAdapter, ToolCall
from app.agents.workflow import InMemoryWorkflowRepository
from app.skills.registry import SkillRegistry


def _registry() -> SkillRegistry:
    registry = SkillRegistry()
    registry.load_all("./skills")
    return registry


def test_engine_system_prompt_requires_brief_tool_progress_messages():
    prompt = RimeAgentEngine._build_system_prompt("interactive_investigation", "")

    assert "Avant d'appeler un tool" in prompt
    assert "phrase courte" in prompt
    assert "payload.headline" in prompt
    assert "payload.spoken" in prompt
    assert "payload.results" in prompt
    assert "payload.value" in prompt
    assert "display_panel affiche une preuve" in prompt
    assert "complete_response" in prompt
    assert "history pour les pannes datées" in prompt
    assert "telemetry pour une valeur" in prompt
    assert "historique de valeur mesurée" in prompt
    assert "value + unit" in prompt
    assert "panel checklist" in prompt


@pytest.mark.asyncio
async def test_engine_stops_when_model_has_no_tool_calls():
    engine = RimeAgentEngine(
        model=FakeModelAdapter([AgentModelResponse(content="Aucun élément critique.", tool_calls=[])]),
        tools=[],
        skill_registry=_registry(),
        workflow_repo=InMemoryWorkflowRepository(),
        max_turns=3,
    )

    events = [event async for event in engine.stream("Question simple")]

    assert events[-1].type == "result"
    assert events[-1].data["reason"] == "completed"
    assert events[-1].data["content"] == "Aucun élément critique."


@pytest.mark.asyncio
async def test_engine_executes_each_tool_call_once():
    counter = {"count": 0}

    def counting_tool(value: str) -> str:
        counter["count"] += 1
        return f"seen {value}"

    tool = StructuredTool.from_function(
        func=counting_tool,
        name="counting_tool",
        description="Count calls for test verification.",
    )
    engine = RimeAgentEngine(
        model=FakeModelAdapter([
            AgentModelResponse(
                content="Je vérifie.",
                tool_calls=[ToolCall(id="call_1", name="counting_tool", args={"value": "PT-42"})],
            ),
            AgentModelResponse(content="Vérification terminée.", tool_calls=[]),
        ]),
        tools=[tool],
        skill_registry=_registry(),
        workflow_repo=InMemoryWorkflowRepository(),
        max_turns=3,
    )

    events = [event async for event in engine.stream("Vérifie PT-42")]

    assert counter["count"] == 1
    assert [event.type for event in events].count("tool_result") == 1
    assert events[-1].data["reason"] == "completed"


@pytest.mark.asyncio
async def test_engine_emits_panel_event_for_display_panel_tool():
    def display_panel(mode: str, title: str, priority: str, payload: dict) -> str:
        return json.dumps({"mode": mode, "title": title, "priority": priority, "payload": payload})

    tool = StructuredTool.from_function(
        func=display_panel,
        name="display_panel",
        description="Display a panel.",
    )
    engine = RimeAgentEngine(
        model=FakeModelAdapter([
            AgentModelResponse(
                content="J'affiche la source.",
                tool_calls=[
                    ToolCall(
                        id="call_1",
                        name="display_panel",
                        args={
                            "mode": "document",
                            "title": "AMM",
                            "priority": "primary",
                            "payload": {"highlight": "3000 PSI"},
                        },
                    )
                ],
            ),
            AgentModelResponse(content="Source affichée.", tool_calls=[]),
        ]),
        tools=[tool],
        skill_registry=_registry(),
        workflow_repo=InMemoryWorkflowRepository(),
        max_turns=3,
    )

    events = [event async for event in engine.stream("Montre la source")]

    panel_events = [event for event in events if event.type == "panel"]
    assert panel_events[0].data["panel"]["mode"] == "document"


@pytest.mark.asyncio
async def test_engine_stops_on_explicit_completion_tool_after_display():
    def display_panel(mode: str, title: str, priority: str, payload: dict) -> str:
        return json.dumps({"mode": mode, "title": title, "priority": priority, "payload": payload})

    def complete_response(reason: str, summary: str) -> str:
        return json.dumps({"ok": True, "reason": reason, "summary": summary})

    engine = RimeAgentEngine(
        model=FakeModelAdapter([
            AgentModelResponse(
                content="J'affiche la courbe puis je clôture.",
                tool_calls=[
                    ToolCall(
                        id="call_panel",
                        name="display_panel",
                        args={
                            "mode": "history",
                            "title": "Pression train",
                            "priority": "primary",
                            "payload": {"series": [{"date": "2023-03-03", "value": 2840, "unit": "PSI"}]},
                        },
                    ),
                    ToolCall(
                        id="call_done",
                        name="complete_response",
                        args={
                            "reason": "answered",
                            "summary": "Historique pression affiché avec valeurs exploitables.",
                        },
                    ),
                ],
            ),
            AgentModelResponse(content="Ne doit pas être appelé.", tool_calls=[]),
        ]),
        tools=[
            StructuredTool.from_function(func=display_panel, name="display_panel", description="Display a panel."),
            StructuredTool.from_function(func=complete_response, name="complete_response", description="Complete."),
        ],
        skill_registry=_registry(),
        workflow_repo=InMemoryWorkflowRepository(),
        max_turns=3,
    )

    events = [event async for event in engine.stream("Historique pression")]

    assert [event.type for event in events].count("panel") == 1
    assert events[-1].type == "result"
    assert events[-1].data == {
        "reason": "answered",
        "content": "Historique pression affiché avec valeurs exploitables.",
        "confidence": None,
        "next_action": None,
    }


@pytest.mark.asyncio
async def test_engine_stops_at_max_turns():
    engine = RimeAgentEngine(
        model=FakeModelAdapter([
            AgentModelResponse(
                content="loop",
                tool_calls=[ToolCall(id="call_1", name="missing_tool", args={})],
            )
        ]),
        tools=[],
        skill_registry=_registry(),
        workflow_repo=InMemoryWorkflowRepository(),
        max_turns=2,
    )

    events = [event async for event in engine.stream("loop")]

    assert events[-1].type == "result"
    assert events[-1].data["reason"] == "max_turns"
