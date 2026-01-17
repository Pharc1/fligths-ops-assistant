from abc import ABC, abstractmethod

class LLMInterface(ABC):
    """
    Interface abstraite pour les services de génération de texte (LLM).
    Permet de changer de fournisseur (Gemini, OpenAI, Mistral).
    """

    @abstractmethod
    def generate(self, prompt: str) -> str:
        """
        Génère une réponse simple à partir d'un prompt.
        """
        pass

    @abstractmethod
    async def agenerate(self, prompt: str) -> str:
        """
        Version asynchrone pour FastPIA.
        """
        pass