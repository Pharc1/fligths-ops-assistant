import pytest

from app.agents.workflow import (
    InMemoryWorkflowRepository,
    WorkflowRunStatus,
    WorkflowTaskStatus,
)


def test_workflow_start_and_update_task_by_raw_id():
    repo = InMemoryWorkflowRepository()
    run = repo.start_run(
        session_id="incident-1",
        goal_type="interactive_investigation",
        title="Verify previous failures",
        tasks=[{"id": "search_history", "kind": "research", "title": "Search aircraft history"}],
    )

    updated = repo.update_task(
        run_id=run.id,
        task_id="search_history",
        status=WorkflowTaskStatus.DONE,
        output={"matches": 2},
    )

    assert updated.tasks[0].status == WorkflowTaskStatus.DONE
    assert updated.tasks[0].output == {"matches": 2}
    assert updated.status == WorkflowRunStatus.DONE


def test_workflow_add_tasks_keeps_order_and_active_run():
    repo = InMemoryWorkflowRepository()
    run = repo.start_run(
        session_id="incident-1",
        goal_type="interactive_investigation",
        title="Verify previous failures",
        tasks=[{"id": "search_docs", "kind": "research", "title": "Search documents"}],
    )

    updated = repo.add_tasks(
        run.id,
        [{"id": "compare", "kind": "analysis", "title": "Compare evidence"}],
    )

    assert [task.raw_id for task in updated.tasks] == ["search_docs", "compare"]
    assert repo.get_active("incident-1").id == run.id


def test_workflow_update_unknown_task_raises_clear_error():
    repo = InMemoryWorkflowRepository()
    run = repo.start_run(
        session_id="incident-1",
        goal_type="interactive_investigation",
        title="Verify previous failures",
        tasks=[{"id": "search_docs", "kind": "research", "title": "Search documents"}],
    )

    with pytest.raises(ValueError, match="unknown task"):
        repo.update_task(run.id, "missing", WorkflowTaskStatus.DONE)
