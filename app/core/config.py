from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Flight Ops AI"
    GOOGLE_API_KEY: str
    DEBUG: bool = False
    LLM_MODEL: str = "google_genai:gemini-2.5-flash-lite"
    EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    PERSIST_DIRECTORY: str = "./chroma_db"
    COLLECTION_NAME: str = "flight_ops_documents"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True)

@lru_cache
def get_settings():
    return Settings()

settings = get_settings()