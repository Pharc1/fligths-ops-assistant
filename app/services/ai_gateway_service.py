from __future__ import annotations

import asyncio
import json
from collections.abc import Sequence
from typing import Any

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage

from app.core.config import settings
from app.core.logger import get_logger
from app.services.ai_gateway_http import PostJson, join_url, post_json
from app.services.llm_interface import LLMInterface

logger = get_logger(__name__)


class AIGatewayChatModel:
    """Minimal OpenAI-compatible chat model used by the agent adapter."""

    def __init__(
        self,
        api_key: str,
        base_url: str,
        model: str,
        temperature: float,
        max_tokens: int,
        post_json: PostJson = post_json,
        tools: Sequence[Any] | None = None,
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url
        self._model = model
        self._temperature = temperature
        self._max_tokens = max_tokens
        self._post_json = post_json
        self._tools = list(tools or [])

    def bind_tools(self, tools: Sequence[Any]) -> AIGatewayChatModel:
        return AIGatewayChatModel(
            api_key=self._api_key,
            base_url=self._base_url,
            model=self._model,
            temperature=self._temperature,
            max_tokens=self._max_tokens,
            post_json=self._post_json,
            tools=tools,
        )

    def invoke(self, messages: str | Sequence[BaseMessage]) -> AIMessage:
        payload = self._build_payload(messages)
        data = self._post_json(join_url(self._base_url, "chat/completions"), self._api_key, payload)
        return _response_to_ai_message(data)

    async def ainvoke(self, messages: str | Sequence[BaseMessage]) -> AIMessage:
        payload = self._build_payload(messages)
        data = await asyncio.to_thread(
            self._post_json,
            join_url(self._base_url, "chat/completions"),
            self._api_key,
            payload,
        )
        return _response_to_ai_message(data)

    def _build_payload(self, messages: str | Sequence[BaseMessage]) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self._model,
            "messages": _serialize_messages(messages),
            "temperature": self._temperature,
            "max_tokens": self._max_tokens,
        }
        if self._tools:
            payload["tools"] = [_serialize_tool(tool) for tool in self._tools]
            payload["tool_choice"] = "auto"
        return payload


class AIGatewayService(LLMInterface):
    def __init__(self) -> None:
        if settings.AI_GATEWAY_API_KEY is None:
            raise RuntimeError("AI_GATEWAY_API_KEY is required for AIGatewayService")
        self.llm = AIGatewayChatModel(
            api_key=settings.AI_GATEWAY_API_KEY.get_secret_value(),
            base_url=settings.AI_GATEWAY_BASE_URL,
            model=settings.AI_GATEWAY_MODEL,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
        )

    def generate(self, prompt: str) -> str:
        logger.info("Sending prompt to AI Gateway model %s", settings.AI_GATEWAY_MODEL)
        return str(self.llm.invoke([HumanMessage(content=prompt)]).content)

    async def agenerate(self, prompt: str) -> str:
        logger.info("Sending async prompt to AI Gateway model %s", settings.AI_GATEWAY_MODEL)
        response = await self.llm.ainvoke([HumanMessage(content=prompt)])
        return str(response.content)


def _serialize_messages(messages: str | Sequence[BaseMessage]) -> list[dict[str, Any]]:
    if isinstance(messages, str):
        messages = [HumanMessage(content=messages)]

    serialized: list[dict[str, Any]] = []
    for message in messages:
        if isinstance(message, SystemMessage):
            serialized.append({"role": "system", "content": _string_content(message.content)})
        elif isinstance(message, HumanMessage):
            serialized.append({"role": "user", "content": _string_content(message.content)})
        elif isinstance(message, AIMessage):
            item: dict[str, Any] = {"role": "assistant", "content": _string_content(message.content)}
            tool_calls = getattr(message, "tool_calls", []) or []
            if tool_calls:
                item["tool_calls"] = [_serialize_ai_tool_call(call) for call in tool_calls]
            serialized.append(item)
        elif isinstance(message, ToolMessage):
            serialized.append(
                {
                    "role": "tool",
                    "content": _string_content(message.content),
                    "tool_call_id": str(message.tool_call_id),
                }
            )
        else:
            serialized.append({"role": "user", "content": _string_content(message.content)})
    return serialized


def _serialize_ai_tool_call(call: dict[str, Any]) -> dict[str, Any]:
    args = call.get("args") or {}
    return {
        "id": str(call.get("id") or call.get("name") or "tool_call"),
        "type": "function",
        "function": {
            "name": str(call.get("name")),
            "arguments": json.dumps(args),
        },
    }


def _serialize_tool(tool: Any) -> dict[str, Any]:
    schema = {}
    args_schema = getattr(tool, "args_schema", None)
    if args_schema is not None and hasattr(args_schema, "model_json_schema"):
        schema = args_schema.model_json_schema()
    elif hasattr(tool, "args"):
        schema = {"type": "object", "properties": dict(tool.args or {})}

    return {
        "type": "function",
        "function": {
            "name": str(getattr(tool, "name", "")),
            "description": str(getattr(tool, "description", "")),
            "parameters": schema or {"type": "object", "properties": {}},
        },
    }


def _response_to_ai_message(data: dict[str, Any]) -> AIMessage:
    choices = data.get("choices") or []
    message = (choices[0] if choices else {}).get("message", {})
    return AIMessage(
        content=_string_content(message.get("content", "")),
        tool_calls=[_parse_tool_call(call) for call in message.get("tool_calls", []) or []],
    )


def _parse_tool_call(call: dict[str, Any]) -> dict[str, Any]:
    function = call.get("function") or {}
    arguments = function.get("arguments") or "{}"
    try:
        args = json.loads(arguments)
    except json.JSONDecodeError:
        args = {}
    return {
        "id": str(call.get("id") or function.get("name") or "tool_call"),
        "name": str(function.get("name", "")),
        "args": args,
    }


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
