import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_settings_accept_ai_gateway_without_google_key() -> None:
    config = Settings(
        _env_file=None,
        GOOGLE_API_KEY=None,
        LLM_PROVIDER="ai_gateway",
        EMBEDDING_PROVIDER="ai_gateway",
        AI_GATEWAY_API_KEY="vgw_test",
    )

    assert config.LLM_PROVIDER == "ai_gateway"
    assert config.EMBEDDING_PROVIDER == "ai_gateway"
    assert config.AI_GATEWAY_API_KEY is not None


def test_settings_auto_prefers_ai_gateway_when_gateway_key_exists() -> None:
    config = Settings(
        _env_file=None,
        GOOGLE_API_KEY=None,
        AI_GATEWAY_API_KEY="vgw_test",
    )

    assert config.resolved_llm_provider == "ai_gateway"
    assert config.resolved_embedding_provider == "ai_gateway"


def test_settings_auto_falls_back_to_gemini_when_only_google_key_exists() -> None:
    config = Settings(
        _env_file=None,
        GOOGLE_API_KEY="google_test",
        AI_GATEWAY_API_KEY=None,
    )

    assert config.resolved_llm_provider == "gemini"
    assert config.resolved_embedding_provider == "gemini"


def test_settings_require_ai_gateway_key_when_provider_enabled() -> None:
    with pytest.raises(ValidationError, match="AI_GATEWAY_API_KEY"):
        Settings(
            _env_file=None,
            GOOGLE_API_KEY=None,
            LLM_PROVIDER="ai_gateway",
            EMBEDDING_PROVIDER="ai_gateway",
            AI_GATEWAY_API_KEY=None,
        )


def test_settings_require_google_key_when_gemini_provider_enabled() -> None:
    with pytest.raises(ValidationError, match="GOOGLE_API_KEY"):
        Settings(
            _env_file=None,
            GOOGLE_API_KEY=None,
            LLM_PROVIDER="gemini",
            EMBEDDING_PROVIDER="gemini",
        )
