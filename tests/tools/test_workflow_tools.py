import json

from app.agents.workflow import InMemoryWorkflowRepository
from app.tools.workflow_tools import build_workflow_tools


def test_workflow_apply_start_run_returns_snapshot():
    repo = InMemoryWorkflowRepository()
    tools = {tool.name: tool for tool in build_workflow_tools(repo)}

    result = tools["workflow_apply"].invoke({
        "op": "start_run",
        "session_id": "s1",
        "goal_type": "interactive_investigation",
        "title": "Check history",
        "tasks": [{"id": "search", "kind": "research", "title": "Search logs"}],
    })

    payload = json.loads(result)
    assert payload["ok"] is True
    assert payload["run"]["tasks"][0]["title"] == "Search logs"


def test_workflow_get_returns_active_run():
    repo = InMemoryWorkflowRepository()
    tools = {tool.name: tool for tool in build_workflow_tools(repo)}
    tools["workflow_apply"].invoke({
        "op": "start_run",
        "session_id": "s1",
        "goal_type": "interactive_investigation",
        "title": "Check history",
        "tasks": [{"id": "search", "kind": "research", "title": "Search logs"}],
    })

    result = tools["workflow_get"].invoke({"session_id": "s1", "mode": "active"})

    payload = json.loads(result)
    assert payload["ok"] is True
    assert payload["run"]["title"] == "Check history"


def test_workflow_apply_update_task_marks_done():
    repo = InMemoryWorkflowRepository()
    tools = {tool.name: tool for tool in build_workflow_tools(repo)}
    started = json.loads(tools["workflow_apply"].invoke({
        "op": "start_run",
        "session_id": "s1",
        "goal_type": "interactive_investigation",
        "title": "Check history",
        "tasks": [{"id": "search", "kind": "research", "title": "Search logs"}],
    }))

    result = tools["workflow_apply"].invoke({
        "op": "update_task",
        "run_id": started["run"]["id"],
        "task_id": "search",
        "task_status": "DONE",
        "task_output": {"matches": 2},
    })

    payload = json.loads(result)
    assert payload["run"]["tasks"][0]["status"] == "DONE"
    assert payload["run"]["status"] == "DONE"
