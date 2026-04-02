"""
Skill tool — permet à l'agent d'activer un skill à la demande.
"""

from langchain.tools import StructuredTool
from pydantic import BaseModel, Field

from app.core.logger import get_logger
from app.skills.registry import SkillRegistry

logger = get_logger(__name__)


class ActivateSkillInput(BaseModel):
    skill_name: str = Field(description="Nom du skill à activer pour obtenir ses instructions complètes")


def build_skill_tools(skill_registry: SkillRegistry) -> list[StructuredTool]:

    def activate_skill(skill_name: str) -> str:
        logger.info("activate_skill: %s", skill_name)
        try:
            skill = skill_registry.activate(skill_name)
            return f"Skill '{skill.name}' activated.\n\n{skill.instructions}"
        except Exception as exc:
            return f"Skill '{skill_name}' not found. Available: {skill_registry.list_names()}. Error: {exc}"

    return [
        StructuredTool.from_function(
            func=activate_skill,
            name="activate_skill",
            args_schema=ActivateSkillInput,
            description=(
                "Charger les instructions complètes d'un skill pour savoir comment aborder "
                "un type de problème. Appeler en début de session dès que le type de question est identifié."
            ),
        ),
    ]
