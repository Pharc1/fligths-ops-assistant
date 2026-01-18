from app.services.gemini_service import GeminiService
from langchain.agents import create_agent
from app.services.tools import retrieve_context
from app.core.prompts import MAINTENANCE_PROMPT_TEMPLATE
from app.core.logger import get_logger

logger = get_logger(__name__)

class AnalysisService:
    def __init__(self, llm_service: GeminiService):
        
        self.llm = llm_service.llm
        self.tools = [retrieve_context]


        self.analyser_agent = create_agent(self.llm, self.tools, system_prompt=MAINTENANCE_PROMPT_TEMPLATE)


    def analyze_incident(self, query: str) -> str:
        logger.info(f"Analyse agentique de : {query}")
        try:
            for event in self.analyser_agent.stream(
                {"messages": [{"role": "user", "content": query}]},
                stream_mode="values",
            ):
                event["messages"][-1].pretty_print()
            logger.info("la reponse est:",event["messages"][-1].content_blocks[0]['text'] )
            return event["messages"][-1].content_blocks[0]['text']
        except Exception as e:
            logger.error(f"Erreur Agent: {e}")
            return "Erreur lors de l'analyse"