"""
Point d'entrée unique pour assembler tous les tools d'une session agent.

agent_service.py ne connaît que cette fonction.
Pour ajouter un tool : créer le fichier dans app/tools/ et l'importer ici.
"""

from langchain.tools import BaseTool

from app.services.rag_service import RagService
from app.skills.registry import SkillRegistry
from app.tools.rag_tools import build_rag_tools
from app.tools.report_tools import build_report_tools
from app.tools.skill_tools import build_skill_tools
from app.tools.task_store import TaskStore
from app.tools.task_tools import build_task_tools
from app.tools.ui_tools import build_ui_tools


def build_all_tools(
    task_store: TaskStore,
    rag_service: RagService,
    skill_registry: SkillRegistry,
    include_ui: bool = True,
) -> list[BaseTool]:
    tools = [
        *build_task_tools(task_store),
        *build_rag_tools(rag_service),
        *build_skill_tools(skill_registry),
        *build_report_tools(),
    ]
    if include_ui:
        tools.extend(build_ui_tools())
    return tools
