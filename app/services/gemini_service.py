from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from app.core.config import settings
from app.core.logger import get_logger
from app.services.llm_service import LLMInterface 

logger = get_logger(__name__)

class GeminiService(LLMInterface):
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=settings.LLM_MODEL,
            google_api_key=settings.GOOGLE_API_KEY.get_secret_value(),
            temperature=settings.LLM_TEMPERATURE,
            max_output_tokens=settings.LLM_MAX_TOKENS
        )

    def generate(self, prompt: str) -> str:
        try:
            logger.info(f"Envoi du prompt au LLM ({settings.LLM_MODEL})...")
            response = self.llm.invoke(prompt)
            return response.content
        except Exception as e:
            logger.error(f"Erreur Gemini Service: {str(e)}")
            raise e

    async def agenerate(self, prompt: str) -> str:
        try:
            logger.info(f"Envoi du prompt asynchrone au LLM...")
            response = await self.llm.ainvoke(prompt)
            return response.content
        except Exception as e:
            logger.error(f"Erreur Gemini Service Async: {str(e)}")
            raise e