"""
Skill registry — singleton chargé au démarrage de l'app.

Le registry tient en mémoire les métadonnées de tous les skills disponibles.
L'agent l'interroge pour savoir ce qui existe, puis active un skill quand il en a besoin.
"""

from app.core.exceptions import SkillNotFoundError
from app.core.logger import get_logger
from app.skills.loader import Skill, SkillMetadata, discover, load_content

logger = get_logger(__name__)


class SkillRegistry:
    def __init__(self) -> None:
        self._skills: dict[str, SkillMetadata] = {}

    def load_all(self, skills_dir: str) -> None:
        """Découverte initiale — lit uniquement les métadonnées de chaque SKILL.md."""
        found = discover(skills_dir)
        self._skills = {s.name: s for s in found}
        logger.info("Registered %d skill(s): %s", len(self._skills), list(self._skills.keys()))

    def list_names(self) -> list[str]:
        return list(self._skills.keys())

    def discovery_prompt(self) -> str:
        """
        Résumé compact injecté dans le system prompt de l'agent au démarrage.
        L'agent sait ce qui existe sans que le contenu complet soit chargé.
        """
        if not self._skills:
            return "No skills available."

        lines = ["Available skills (use the activate_skill tool to load full instructions):"]
        for meta in self._skills.values():
            lines.append(f"- {meta.name}: {meta.description}")
        return "\n".join(lines)

    def activate(self, name: str) -> Skill:
        """
        Charge le contenu complet d'un skill à la demande.
        Appelé par l'agent quand il décide qu'un skill est pertinent pour la question posée.
        """
        if name not in self._skills:
            raise SkillNotFoundError(
                f"Skill '{name}' not found.",
                details={"available": self.list_names()},
            )
        skill = load_content(self._skills[name])
        logger.info("Skill activated: %s", name)
        return skill


# Singleton global — partagé par toute l'app, initialisé dans le lifespan
skill_registry = SkillRegistry()
