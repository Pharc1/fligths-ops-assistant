from app.agents.workflow import InMemoryWorkflowRepository
from app.tools.builder import build_all_tools


class FakeRag:
    def similarity_search_with_scores(self, query_text: str, k: int):
        return []


def test_build_all_tools_includes_workflow_rag_and_display_panel():
    tools = build_all_tools(
        workflow_repo=InMemoryWorkflowRepository(),
        rag_service=FakeRag(),
        include_ui=True,
    )

    names = {tool.name for tool in tools}
    assert {"workflow_get", "workflow_apply", "rag_search", "display_panel"}.issubset(names)
    assert "activate_skill" not in names
    assert "create_task_list" not in names


def test_build_all_tools_excludes_display_panel_when_ui_disabled():
    tools = build_all_tools(
        workflow_repo=InMemoryWorkflowRepository(),
        rag_service=FakeRag(),
        include_ui=False,
    )

    names = {tool.name for tool in tools}
    assert "display_panel" not in names
    assert "rag_search" in names
