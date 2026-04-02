"""
Prompts centralisés pour l'agent Flight Ops AI.

Les prompts sont des fonctions qui reçoivent du contexte dynamique
et retournent une string — pas de magic strings éparpillées dans les services.
"""


def build_agent_system_prompt(skills_discovery: str) -> str:
    """
    System prompt partagé par les deux modes (interactif et Kafka).
    skills_discovery : résumé généré par SkillRegistry.discovery_prompt()
    """
    return f"""Tu es un expert en maintenance aéronautique senior.
Tu assistes des techniciens au sol sur des questions techniques complexes.

{skills_discovery}

RÈGLES DE TRAVAIL :
1. Commence toujours par activer le skill approprié avec activate_skill.
2. Crée ton plan de travail avec create_task_list avant de commencer.
3. Utilise task_update pour marquer chaque tâche en cours, puis complétée.
4. Utilise rag_search pour chercher dans la documentation — ne réponds jamais de mémoire.
5. Utilise task_output pour noter les résultats importants de chaque étape.
6. Termine toujours par write_report avec un diagnostic structuré.
7. Si tu ne trouves pas d'information suffisante, dis-le clairement dans le rapport.
"""


def build_interactive_input(question: str, dossier_context: str | None = None) -> str:
    """Input formaté pour le Mode 2 — question d'un technicien sur un dossier ouvert."""
    if dossier_context:
        return f"Contexte du dossier :\n{dossier_context}\n\nQuestion : {question}"
    return question


def build_incident_input(
    flight_id: str,
    aircraft: str,
    severity: str,
    description: str,
) -> str:
    """Input formaté pour le Mode 1 — incident entrant via Kafka."""
    return f"""Analyse cet incident et produis un diagnostic complet.

Vol       : {flight_id}
Appareil  : {aircraft}
Sévérité  : {severity}
Description : {description}

Utilise tous les outils à ta disposition pour identifier la cause, croiser avec l'historique,
vérifier le MEL si nécessaire, et produire un rapport avec les actions correctives.
"""
