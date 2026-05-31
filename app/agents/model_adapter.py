from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

from langchain_core.messages import BaseMessage


@dataclass(frozen=True)
class ToolCall:
    id: str
    name: str
    args: dict[str, Any]


@dataclass(frozen=True)
class AgentModelResponse:
    content: str
    tool_calls: list[ToolCall]
    raw: Any | None = None


class ModelAdapter(Protocol):
    async def ainvoke(self, messages: list[BaseMessage], tools: list[Any]) -> AgentModelResponse:
        ...


class LangChainModelAdapter:
    """Adapter around LangChain chat models with bind_tools support."""

    def __init__(self, llm: Any) -> None:
        self._llm = llm

    async def ainvoke(self, messages: list[BaseMessage], tools: list[Any]) -> AgentModelResponse:
        model = self._llm.bind_tools(tools) if tools else self._llm
        raw = await model.ainvoke(messages)
        return AgentModelResponse(
            content=_string_content(getattr(raw, "content", "")),
            tool_calls=_extract_tool_calls(raw),
            raw=raw,
        )


class FakeModelAdapter:
    """Deterministic adapter used by engine tests."""

    def __init__(self, responses: list[AgentModelResponse]) -> None:
        self._responses = responses
        self.calls = 0

    async def ainvoke(self, messages: list[BaseMessage], tools: list[Any]) -> AgentModelResponse:
        if not self._responses:
            return AgentModelResponse(content="", tool_calls=[])
        index = min(self.calls, len(self._responses) - 1)
        self.calls += 1
        return self._responses[index]


def _extract_tool_calls(raw: Any) -> list[ToolCall]:
    calls: list[ToolCall] = []
    for call in getattr(raw, "tool_calls", []) or []:
        if not isinstance(call, dict) or "name" not in call:
            continue
        calls.append(
            ToolCall(
                id=str(call.get("id") or call["name"]),
                name=str(call["name"]),
                args=dict(call.get("args") or {}),
            )
        )
    return calls


def _string_content(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                parts.append(_string_content(item.get("text", "")))
            else:
                parts.append(_string_content(item))
        return "".join(parts)
    return str(content)
