from app.services.ai_gateway_embeddings import AIGatewayEmbeddings


def test_ai_gateway_embeddings_use_openai_compatible_payload() -> None:
    captured: dict[str, object] = {}

    def post_json(url: str, api_key: str, payload: dict[str, object]) -> dict[str, object]:
        captured["url"] = url
        captured["api_key"] = api_key
        captured["payload"] = payload
        return {
            "data": [
                {"embedding": [0.1, 0.2]},
                {"embedding": [0.3, 0.4]},
            ]
        }

    embeddings = AIGatewayEmbeddings(
        api_key="vgw_test",
        base_url="https://ai-gateway.vercel.sh/v1",
        model="openai/text-embedding-3-small",
        post_json=post_json,
    )

    result = embeddings.embed_documents(["pitot fault", "pressure valve"])

    assert result == [[0.1, 0.2], [0.3, 0.4]]
    assert captured["url"] == "https://ai-gateway.vercel.sh/v1/embeddings"
    assert captured["api_key"] == "vgw_test"
    assert captured["payload"] == {
        "model": "openai/text-embedding-3-small",
        "input": ["pitot fault", "pressure valve"],
    }


def test_ai_gateway_embeddings_embed_query_returns_first_vector() -> None:
    def post_json(url: str, api_key: str, payload: dict[str, object]) -> dict[str, object]:
        return {"data": [{"embedding": [0.7, 0.8, 0.9]}]}

    embeddings = AIGatewayEmbeddings(
        api_key="vgw_test",
        base_url="https://ai-gateway.vercel.sh/v1/",
        model="openai/text-embedding-3-small",
        post_json=post_json,
    )

    assert embeddings.embed_query("A320 pitot") == [0.7, 0.8, 0.9]
