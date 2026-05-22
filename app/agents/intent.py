from dataclasses import dataclass
from enum import StrEnum


class AgentIntent(StrEnum):
    INCIDENT_PREANALYSIS = "incident_preanalysis"
    INTERACTIVE_INVESTIGATION = "interactive_investigation"
    TROUBLESHOOTING = "troubleshooting"
    IMPACT_ASSESSMENT = "impact_assessment"
    PROCEDURE_EXECUTION = "procedure_execution"
    GENERAL_CONVERSATION = "general_conversation"


@dataclass(frozen=True)
class IntentDecision:
    intent: AgentIntent
    skill_names: list[str]


class IntentRouter:
    """Deterministic first-pass router.

    This keeps skill selection outside the LLM loop. If needed later, this class can
    be replaced by a model-backed classifier without changing the engine API.
    """

    def route(self, text: str, forced_intent: AgentIntent | None = None) -> IntentDecision:
        if forced_intent is not None:
            return self._decision(forced_intent)

        query = text.lower()
        if self._contains(query, ["procédure", "procedure", "étape", "step", "check", "done"]):
            return self._decision(AgentIntent.PROCEDURE_EXECUTION)
        if self._contains(query, ["historique", "antérieure", "anterieure", "avant", "déjà", "deja"]):
            return self._decision(AgentIntent.INTERACTIVE_INVESTIGATION)
        if self._contains(query, ["mel", "impact", "changer", "remplacer", "conséquence", "consequence"]):
            return self._decision(AgentIntent.IMPACT_ASSESSMENT)
        if self._contains(query, ["symptôme", "symptome", "diagnostic", "isoler", "tester"]):
            return self._decision(AgentIntent.TROUBLESHOOTING)
        return self._decision(AgentIntent.GENERAL_CONVERSATION)

    def _decision(self, intent: AgentIntent) -> IntentDecision:
        skill_map = {
            AgentIntent.INCIDENT_PREANALYSIS: ["incident-analysis", "evidence-citation"],
            AgentIntent.INTERACTIVE_INVESTIGATION: [
                "interactive-investigation",
                "evidence-citation",
            ],
            AgentIntent.TROUBLESHOOTING: ["troubleshooting", "evidence-citation"],
            AgentIntent.IMPACT_ASSESSMENT: ["impact-assessment", "evidence-citation"],
            AgentIntent.PROCEDURE_EXECUTION: ["procedure-execution", "evidence-citation"],
            AgentIntent.GENERAL_CONVERSATION: [
                "interactive-investigation",
                "evidence-citation",
            ],
        }
        return IntentDecision(intent=intent, skill_names=skill_map[intent])

    @staticmethod
    def _contains(text: str, needles: list[str]) -> bool:
        return any(needle in text for needle in needles)
