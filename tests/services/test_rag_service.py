from app.core.config import Settings
from app.services.rag_service import resolve_collection_name


def test_resolve_collection_name_is_embedding_specific_for_ai_gateway() -> None:
    config = Settings(
        _env_file=None,
        GOOGLE_API_KEY=None,
        AI_GATEWAY_API_KEY="vgw_test",
        COLLECTION_NAME="flight_ops_documents",
        AI_GATEWAY_EMBEDDING_MODEL="openai/text-embedding-3-small",
    )

    assert (
        resolve_collection_name(config)
        == "flight_ops_documents__ai_gateway__openai_text_embedding_3_small"
    )


def test_resolve_collection_name_is_embedding_specific_for_gemini() -> None:
    config = Settings(
        _env_file=None,
        GOOGLE_API_KEY="google_test",
        AI_GATEWAY_API_KEY=None,
        COLLECTION_NAME="flight_ops_documents",
        EMBEDDING_MODEL="models/gemini-embedding-001",
    )

    assert (
        resolve_collection_name(config)
        == "flight_ops_documents__gemini__models_gemini_embedding_001"
    )


def test_resolve_collection_name_can_use_fixed_collection_name() -> None:
    config = Settings(
        _env_file=None,
        GOOGLE_API_KEY=None,
        AI_GATEWAY_API_KEY="vgw_test",
        COLLECTION_NAME="flight_ops_documents",
        COLLECTION_BY_EMBEDDING=False,
    )

    assert resolve_collection_name(config) == "flight_ops_documents"
