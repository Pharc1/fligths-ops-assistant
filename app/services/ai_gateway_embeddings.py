from __future__ import annotations

from typing import Any

from langchain_core.embeddings import Embeddings

from app.services.ai_gateway_http import PostJson, join_url, post_json


class AIGatewayEmbeddings(Embeddings):
    def __init__(
        self,
        api_key: str,
        base_url: str,
        model: str,
        post_json: PostJson = post_json,
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url
        self._model = model
        self._post_json = post_json

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._embed(texts)

    def embed_query(self, text: str) -> list[float]:
        return self._embed([text])[0]

    def _embed(self, inputs: list[str]) -> list[list[float]]:
        payload: dict[str, Any] = {"model": self._model, "input": inputs}
        data = self._post_json(join_url(self._base_url, "embeddings"), self._api_key, payload)
        return [list(item["embedding"]) for item in data.get("data", [])]
