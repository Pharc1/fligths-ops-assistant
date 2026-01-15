from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Setting(BaseSettings):
    PROJECT_NAME: str = "Flight Ops AI"
    GOOGLE_API_KEY: str
    DEBUG: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True)

@lru_cache
def get_settings():
    return Setting()

settings = get_settings()