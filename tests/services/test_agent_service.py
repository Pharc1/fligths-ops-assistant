import json

import pytest

from app.agents.model_adapter import AgentModelResponse, FakeModelAdapter
from app.agents.workflow import InMemoryWorkflowRepository
from app.services.agent_service import AgentService
from app.skills.registry import SkillRegistry


class FakeRag:
    def similarity_search_with_scores(self, query_text: str, k: int):
        return []


def _registry() -> SkillRegistry:
    registry = SkillRegistry()
    registry.load_all("./skills")
    return registry


@pytest.mark.asyncio
async def test_agent_service_stream_yields_sse_events():
    service = AgentService(
        llm_service=None,
        rag_service=FakeRag(),
        skill_registry=_registry(),
        workflow_repo=InMemoryWorkflowRepository(),
        model_adapter=FakeModelAdapter([AgentModelResponse(content="Réponse courte.", tool_calls=[])]),
    )

    chunks = [chunk async for chunk in service.stream("Question simple")]

    assert chunks[0].startswith("data: ")
    assert json.loads(chunks[-1].removeprefix("data: "))["type"] == "result"


@pytest.mark.asyncio
async def test_agent_service_run_returns_final_content():
    service = AgentService(
        llm_service=None,
        rag_service=FakeRag(),
        skill_registry=_registry(),
        workflow_repo=InMemoryWorkflowRepository(),
        model_adapter=FakeModelAdapter([AgentModelResponse(content="Diagnostic initial.", tool_calls=[])]),
    )

    result = await service.run("Incident reçu")

    assert result == "Diagnostic initial."


@pytest.mark.asyncio
async def test_agent_service_run_builds_tools_without_ui(monkeypatch):
    captured = {}

    def fake_build_all_tools(workflow_repo, rag_service, include_ui=True):
        captured["include_ui"] = include_ui
        return []

    monkeypatch.setattr("app.services.agent_service.build_all_tools", fake_build_all_tools)
    service = AgentService(
        llm_service=None,
        rag_service=FakeRag(),
        skill_registry=_registry(),
        workflow_repo=InMemoryWorkflowRepository(),
        model_adapter=FakeModelAdapter([AgentModelResponse(content="Diagnostic initial.", tool_calls=[])]),
    )

    await service.run("Incident reçu")

    assert captured["include_ui"] is False
