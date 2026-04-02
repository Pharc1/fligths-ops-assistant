"""
Skill loader — lit les SKILL.md depuis le disque.

Deux niveaux de chargement :
- discover() : lit uniquement le frontmatter YAML (name + description) — appelé au démarrage
- load_content() : charge le corps Markdown complet — appelé quand l'agent active un skill
"""

import re
from dataclasses import dataclass
from pathlib import Path

import yaml

from app.core.logger import get_logger

logger = get_logger(__name__)

FRONTMATTER_PATTERN = re.compile(r"^---\n(.*?)\n---\n?(.*)", re.DOTALL)


@dataclass
class SkillMetadata:
    name: str
    description: str
    path: Path


@dataclass
class Skill:
    name: str
    description: str
    instructions: str  # corps Markdown complet, chargé à la demande


def discover(skills_dir: str | Path) -> list[SkillMetadata]:
    """
    Parcourt skills_dir et retourne les métadonnées de chaque skill trouvé.
    Ne charge pas le corps des instructions — seulement le frontmatter.
    """
    root = Path(skills_dir)
    if not root.exists():
        logger.warning("Skills directory not found: %s", root)
        return []

    skills: list[SkillMetadata] = []
    for skill_file in sorted(root.glob("*/SKILL.md")):
        try:
            metadata = _parse_frontmatter(skill_file)
            skills.append(metadata)
            logger.debug("Discovered skill: %s", metadata.name)
        except Exception as exc:
            logger.warning("Failed to parse skill at %s: %s", skill_file, exc)

    return skills


def load_content(metadata: SkillMetadata) -> Skill:
    """Charge le corps complet des instructions d'un skill."""
    raw = metadata.path.read_text(encoding="utf-8")
    match = FRONTMATTER_PATTERN.match(raw)
    instructions = match.group(2).strip() if match else raw.strip()

    return Skill(
        name=metadata.name,
        description=metadata.description,
        instructions=instructions,
    )


def _parse_frontmatter(path: Path) -> SkillMetadata:
    raw = path.read_text(encoding="utf-8")
    match = FRONTMATTER_PATTERN.match(raw)
    if not match:
        raise ValueError(f"No YAML frontmatter found in {path}")

    meta = yaml.safe_load(match.group(1))
    if "name" not in meta or "description" not in meta:
        raise ValueError(f"SKILL.md at {path} must have 'name' and 'description' fields")

    return SkillMetadata(name=meta["name"], description=meta["description"], path=path)
