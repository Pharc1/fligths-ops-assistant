"""Single entrypoint for assembling RIME tools for an agent run."""

from typing import Any

from langchain_core.tools import BaseTool

from app.agents.workflow import InMemoryWorkflowRepository
from app.services.rag_service import RagService
from app.tools.display_tools import build_display_tools
from app.tools.rag_tools import build_rag_tools
from app.tools.report_tools import build_report_tools
from app.tools.workflow_tools import build_workflow_tools


def build_all_tools(
    workflow_repo: InMemoryWorkflowRepository,
    rag_service: RagService | Any,
    include_ui: bool = True,
) -> list[BaseTool]:
    tools: list[BaseTool] = [
        *build_workflow_tools(workflow_repo),
        *build_rag_tools(rag_service),
        *build_report_tools(),
    ]
    if include_ui:
        tools.extend(build_display_tools())
    return tools
