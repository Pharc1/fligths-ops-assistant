from langchain_core.messages import HumanMessage

from app.agents.events import AgentEvent
from app.agents.model_adapter import AgentModelResponse, FakeModelAdapter, ToolCall, _string_content


def test_agent_event_serializes_to_sse_payload():
    event = AgentEvent(type="tool_use", data={"toolName": "rag_search"})

    assert event.to_sse() == 'data: {"type": "tool_use", "toolName": "rag_search"}\n\n'


async def test_fake_model_adapter_returns_scripted_responses():
    model = FakeModelAdapter([
        AgentModelResponse(
            content="Je vérifie.",
            tool_calls=[ToolCall(id="call_1", name="rag_search", args={"query": "PT-42"})],
        )
    ])

    response = await model.ainvoke([HumanMessage(content="question")], tools=[])

    assert response.content == "Je vérifie."
    assert response.tool_calls[0].name == "rag_search"
    assert response.tool_calls[0].args == {"query": "PT-42"}


def test_model_adapter_string_content_does_not_render_none():
    assert _string_content(None) == ""
