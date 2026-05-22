from app.agents.intent import AgentIntent, IntentRouter
from app.skills.registry import SkillRegistry


def test_routes_historical_question_to_interactive_investigation():
    result = IntentRouter().route("Tu as vérifié si une panne antérieure a causé ça ?")

    assert result.intent == AgentIntent.INTERACTIVE_INVESTIGATION
    assert result.skill_names == ["interactive-investigation", "evidence-citation"]


def test_routes_procedure_request_to_procedure_execution():
    result = IntentRouter().route("Je vais changer la vanne, donne-moi la procédure.")

    assert result.intent == AgentIntent.PROCEDURE_EXECUTION
    assert "procedure-execution" in result.skill_names
    assert "evidence-citation" in result.skill_names


def test_forced_incident_preanalysis_uses_incident_skill():
    result = IntentRouter().route(
        "Low pressure reported after landing.",
        forced_intent=AgentIntent.INCIDENT_PREANALYSIS,
    )

    assert result.intent == AgentIntent.INCIDENT_PREANALYSIS
    assert result.skill_names == ["incident-analysis", "evidence-citation"]


def test_runtime_skills_are_registered():
    registry = SkillRegistry()
    registry.load_all("./skills")

    assert "interactive-investigation" in registry.list_names()
    assert "procedure-execution" in registry.list_names()
    assert "evidence-citation" in registry.list_names()
