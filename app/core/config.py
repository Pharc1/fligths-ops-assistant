from functools import lru_cache

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Application ──────────────────────────────────────────────────────────
    PROJECT_NAME: str = "Flight Ops AI"
    VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development | staging | production

    # ── Google / Gemini ───────────────────────────────────────────────────────
    GOOGLE_API_KEY: SecretStr

    # ── LLM ──────────────────────────────────────────────────────────────────
    LLM_MODEL: str = "gemini-2.0-flash"
    LLM_TEMPERATURE: float = 0.2  # float, pas int
    LLM_MAX_TOKENS: int = 8192
    LLM_MAX_ITERATIONS: int = 10  # max tool calls par agent run

    # ── RAG / Embeddings ─────────────────────────────────────────────────────
    EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    PERSIST_DIRECTORY: str = "./chroma_db"
    COLLECTION_NAME: str = "flight_ops_documents"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    RAG_TOP_K: int = 4  # nombre de chunks récupérés par défaut

    # ── Skills ────────────────────────────────────────────────────────────────
    SKILLS_DIRECTORY: str = "./skills"

    # ── Kafka ─────────────────────────────────────────────────────────────────
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_TOPIC_INCIDENT_CREATED: str = "incident.created"
    KAFKA_TOPIC_INCIDENT_PROCESSED: str = "incident.processed"
    KAFKA_CONSUMER_GROUP_ID: str = "flight-ops-ai-group"
    KAFKA_AUTO_OFFSET_RESET: str = "earliest"

    # ── API ───────────────────────────────────────────────────────────────────
    API_V1_PREFIX: str = "/api/v1"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    @field_validator("ENVIRONMENT")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        allowed = {"development", "staging", "production"}
        if v not in allowed:
            raise ValueError(f"ENVIRONMENT must be one of {allowed}")
        return v

    @field_validator("LLM_TEMPERATURE")
    @classmethod
    def validate_temperature(cls, v: float) -> float:
        if not 0.0 <= v <= 2.0:
            raise ValueError("LLM_TEMPERATURE must be between 0.0 and 2.0")
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        case_sensitive=True,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
