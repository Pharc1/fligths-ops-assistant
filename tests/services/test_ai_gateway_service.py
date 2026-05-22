from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool

from app.services.ai_gateway_service import AIGatewayChatModel


@tool
def display_panel(mode: str, title: str) -> str:
    """Display a RIME investigation panel."""
    return f"{mode}:{title}"


async def test_ai_gateway_chat_model_sends_messages_and_tool_schemas() -> None:
    captured: dict[str, object] = {}

    def post_json(url: str, api_key: str, payload: dict[str, object]) -> dict[str, object]:
        captured["url"] = url
        captured["api_key"] = api_key
        captured["payload"] = payload
        return {
            "choices": [
                {
                    "message": {
                        "content": "Je vais ouvrir la preuve documentaire.",
                        "tool_calls": [
                            {
                                "id": "call_doc",
                                "type": "function",
                                "function": {
                                    "name": "display_panel",
                                    "arguments": '{"mode":"document","title":"BEA extrait"}',
                                },
                            }
                        ],
                    }
                }
            ]
        }

    model = AIGatewayChatModel(
        api_key="vgw_test",
        base_url="https://ai-gateway.vercel.sh/v1",
        model="openai/gpt-4.1-mini",
        temperature=0.2,
        max_tokens=1024,
        post_json=post_json,
    ).bind_tools([display_panel])

    response = await model.ainvoke(
        [
            SystemMessage(content="Tu es RIME."),
            HumanMessage(content="Montre la source."),
        ]
    )

    assert response.content == "Je vais ouvrir la preuve documentaire."
    assert response.tool_calls == [
        {"name": "display_panel", "args": {"mode": "document", "title": "BEA extrait"}, "id": "call_doc", "type": "tool_call"}
    ]
    assert captured["url"] == "https://ai-gateway.vercel.sh/v1/chat/completions"
    assert captured["api_key"] == "vgw_test"

    payload = captured["payload"]
    assert payload["model"] == "openai/gpt-4.1-mini"
    assert payload["messages"] == [
        {"role": "system", "content": "Tu es RIME."},
        {"role": "user", "content": "Montre la source."},
    ]
    assert payload["tools"][0]["function"]["name"] == "display_panel"
    assert payload["tool_choice"] == "auto"


async def test_ai_gateway_chat_model_serializes_tool_history() -> None:
    captured: dict[str, object] = {}

    def post_json(url: str, api_key: str, payload: dict[str, object]) -> dict[str, object]:
        captured["payload"] = payload
        return {"choices": [{"message": {"content": "Source ouverte."}}]}

    model = AIGatewayChatModel(
        api_key="vgw_test",
        base_url="https://ai-gateway.vercel.sh/v1/",
        model="anthropic/claude-3-5-sonnet",
        temperature=0.1,
        max_tokens=2048,
        post_json=post_json,
    )

    await model.ainvoke(
        [
            HumanMessage(content="Ouvre le document."),
            AIMessage(
                content="J'ouvre le document.",
                tool_calls=[
                    {
                        "id": "call_doc",
                        "name": "display_panel",
                        "args": {"mode": "document"},
                    }
                ],
            ),
            ToolMessage(content='{"ok":true}', tool_call_id="call_doc"),
        ]
    )

    assert captured["payload"]["messages"] == [
        {"role": "user", "content": "Ouvre le document."},
        {
            "role": "assistant",
            "content": "J'ouvre le document.",
            "tool_calls": [
                {
                    "id": "call_doc",
                    "type": "function",
                    "function": {
                        "name": "display_panel",
                        "arguments": '{"mode": "document"}',
                    },
                }
            ],
        },
        {"role": "tool", "content": '{"ok":true}', "tool_call_id": "call_doc"},
    ]
