import sys
import os
import pytest
sys.path.append(os.getcwd()) 

from app.services.gemini_service import GeminiService
from app.services.analysis_service import AnalysisService



@pytest.fixture
def agent_service():
    """
    Instancie le service d'analyse avec le vrai LLM Gemini.
    """

    llm = GeminiService()
    service = AnalysisService(llm_service=llm)
    return service


def test_analyze_incident_nominal(agent_service):
    """
    Test le cas nominal : Une question technique standard.
    Vérifie que l'agent répond quelque chose de cohérent.
    """
    query = "PROCEDURE FOR HYDRAULIC LEAK"
    

    response = agent_service.analyze_incident(query)
    print(response)
    

    assert response is not None
    assert isinstance(response, str)
    assert len(response) > 20 # La réponse doit être substantielle
    
    assert "Erreur lors de l'analyse" not in response

def test_analyze_incident_unknown(agent_service):
    """
    Test le cas limite : Une question hors contexte.
    L'agent doit dire qu'il ne sait pas ou qu'il n'a pas l'info.
    """
    query = "Quelle est la recette de la tarte aux pommes ?"
    
    response = agent_service.analyze_incident(query)
    print(response)

    assert len(response) > 0