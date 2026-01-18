from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr
class Settings(BaseSettings):
    PROJECT_NAME: str = "Flight Ops AI"

    GOOGLE_API_KEY: SecretStr

    DEBUG: bool = False

    # Config LLM
    LLM_MODEL: str = "gemini-3-pro-preview"
    LLM_TEMPERATURE: int = 1
    LLM_MAX_TOKENS: int = 10000

    # Config RAG
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