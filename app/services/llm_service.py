from langchain.chat_models import init_chat_model
from app.core.config import settings




class LlmService:
    def __init__(self):
        self.model = init_chat_model(settings.LLM_MODEL)