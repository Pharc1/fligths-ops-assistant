from functools import lru_cache
from typing import Literal

from pydantic import SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ProviderName = Literal["gemini", "ai_gateway"]
ProviderSetting = Literal["auto", "gemini", "ai_gateway"]


class Settings(BaseSettings):
    # Application
    PROJECT_NAME: str = "Flight Ops AI"
    VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development | staging | production

    # Provider routing
    LLM_PROVIDER: ProviderSetting = "auto"
    EMBEDDING_PROVIDER: ProviderSetting = "auto"

    # Google / Gemini
    GOOGLE_API_KEY: SecretStr | None = None

    # Vercel AI Gateway (OpenAI-compatible)
    AI_GATEWAY_API_KEY: SecretStr | None = None
    AI_GATEWAY_BASE_URL: str = "https://ai-gateway.vercel.sh/v1"
    AI_GATEWAY_MODEL: str = "openai/gpt-4.1-mini"
    AI_GATEWAY_EMBEDDING_MODEL: str = "openai/text-embedding-3-small"

    # LLM
    LLM_MODEL: str = "gemini-2.0-flash"
    LLM_TEMPERATURE: float = 0.2
    LLM_MAX_TOKENS: int = 8192
    LLM_MAX_ITERATIONS: int = 10

    # RAG / Embeddings
    EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    PERSIST_DIRECTORY: str = "./chroma_db"
    COLLECTION_NAME: str = "flight_ops_documents"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    RAG_TOP_K: int = 4

    # Skills
    SKILLS_DIRECTORY: str = "./skills"

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_TOPIC_INCIDENT_CREATED: str = "incident.created"
    KAFKA_TOPIC_INCIDENT_PROCESSED: str = "incident.processed"
    KAFKA_CONSUMER_GROUP_ID: str = "flight-ops-ai-group"
    KAFKA_AUTO_OFFSET_RESET: str = "earliest"

    # API
    API_V1_PREFIX: str = "/api/v1"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    @property
    def resolved_llm_provider(self) -> ProviderName:
        return self._resolve_provider(self.LLM_PROVIDER)

    @property
    def resolved_embedding_provider(self) -> ProviderName:
        return self._resolve_provider(self.EMBEDDING_PROVIDER)

    def _resolve_provider(self, provider: ProviderSetting) -> ProviderName:
        if provider != "auto":
            return provider
        if self.AI_GATEWAY_API_KEY is not None:
            return "ai_gateway"
        return "gemini"

    @field_validator("ENVIRONMENT")
    @classmethod
    def validate_environment(cls, value: str) -> str:
        allowed = {"development", "staging", "production"}
        if value not in allowed:
            raise ValueError(f"ENVIRONMENT must be one of {allowed}")
        return value

    @field_validator("LLM_TEMPERATURE")
    @classmethod
    def validate_temperature(cls, value: float) -> float:
        if not 0.0 <= value <= 2.0:
            raise ValueError("LLM_TEMPERATURE must be between 0.0 and 2.0")
        return value

    @model_validator(mode="after")
    def validate_provider_keys(self) -> "Settings":
        if self.resolved_llm_provider == "gemini" and self.GOOGLE_API_KEY is None:
            raise ValueError("GOOGLE_API_KEY is required when LLM_PROVIDER is gemini")
        if self.resolved_embedding_provider == "gemini" and self.GOOGLE_API_KEY is None:
            raise ValueError("GOOGLE_API_KEY is required when EMBEDDING_PROVIDER is gemini")
        if self.resolved_llm_provider == "ai_gateway" and self.AI_GATEWAY_API_KEY is None:
            raise ValueError("AI_GATEWAY_API_KEY is required when LLM_PROVIDER is ai_gateway")
        if self.resolved_embedding_provider == "ai_gateway" and self.AI_GATEWAY_API_KEY is None:
            raise ValueError("AI_GATEWAY_API_KEY is required when EMBEDDING_PROVIDER is ai_gateway")
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        case_sensitive=True,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
