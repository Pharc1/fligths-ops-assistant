import json
from typing import Any, Literal

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

from app.agents.workflow import (
    InMemoryWorkflowRepository,
    WorkflowRunStatus,
    WorkflowTaskStatus,
)


class WorkflowTaskDraft(BaseModel):
    id: str | None = None
    kind: str
    title: str
    order_index: int | None = None
    visible: bool = True
    blocking: bool = False
    input: dict[str, Any] = Field(default_factory=dict)


class WorkflowGetInput(BaseModel):
    session_id: str
    mode: Literal["active", "by_id"] = "active"
    run_id: str | None = None


class WorkflowApplyInput(BaseModel):
    op: Literal["start_run", "add_tasks", "update_task", "set_status", "finish_run", "cancel_run"]
    session_id: str | None = None
    run_id: str | None = None
    goal_type: str | None = None
    title: str | None = None
    tasks: list[WorkflowTaskDraft] | None = None
    task_id: str | None = None
    task_status: WorkflowTaskStatus | None = None
    task_title: str | None = None
    task_output: dict[str, Any] | None = None
    error_message: str | None = None
    status: WorkflowRunStatus | None = None


def build_workflow_tools(repo: InMemoryWorkflowRepository) -> list[StructuredTool]:
    def workflow_get(session_id: str, mode: str = "active", run_id: str | None = None) -> str:
        run = repo.get(run_id) if mode == "by_id" and run_id else repo.get_active(session_id)
        return _json({"ok": True, "run": run.to_dict() if run else None})

    def workflow_apply(
        op: str,
        session_id: str | None = None,
        run_id: str | None = None,
        goal_type: str | None = None,
        title: str | None = None,
        tasks: list[dict[str, Any]] | None = None,
        task_id: str | None = None,
        task_status: WorkflowTaskStatus | None = None,
        task_title: str | None = None,
        task_output: dict[str, Any] | None = None,
        error_message: str | None = None,
        status: WorkflowRunStatus | None = None,
    ) -> str:
        if op == "start_run":
            if not session_id or not goal_type or not title or not tasks:
                raise ValueError("start_run requires session_id, goal_type, title and tasks")
            run = repo.start_run(
                session_id=session_id,
                goal_type=goal_type,
                title=title,
                tasks=_task_dicts(tasks),
            )
        elif op == "add_tasks":
            if not run_id or not tasks:
                raise ValueError("add_tasks requires run_id and tasks")
            run = repo.add_tasks(run_id, _task_dicts(tasks))
        elif op == "update_task":
            if not run_id or not task_id:
                raise ValueError("update_task requires run_id and task_id")
            run = repo.update_task(
                run_id=run_id,
                task_id=task_id,
                status=task_status,
                output=task_output,
                title=task_title,
                error_message=error_message,
            )
        elif op == "set_status":
            if not run_id or status is None:
                raise ValueError("set_status requires run_id and status")
            run = repo.set_status(run_id, status)
        elif op == "finish_run":
            if not run_id:
                raise ValueError("finish_run requires run_id")
            run = repo.set_status(run_id, WorkflowRunStatus.DONE)
        elif op == "cancel_run":
            if not run_id:
                raise ValueError("cancel_run requires run_id")
            run = repo.set_status(run_id, WorkflowRunStatus.CANCELED)
        else:
            raise ValueError(f"unsupported workflow operation '{op}'")

        return _json({"ok": True, "op": op, "run": run.to_dict()})

    return [
        StructuredTool.from_function(
            func=workflow_get,
            name="workflow_get",
            args_schema=WorkflowGetInput,
            description="Read the active RIME investigation/procedure workflow for this session.",
        ),
        StructuredTool.from_function(
            func=workflow_apply,
            name="workflow_apply",
            args_schema=WorkflowApplyInput,
            description=(
                "Create or update the current RIME workflow: start a run, add tasks, "
                "mark task progress, finish, cancel, or update status."
            ),
        ),
    ]


def _json(payload: dict[str, Any]) -> str:
    return json.dumps(payload, ensure_ascii=False)


def _task_dicts(tasks: list[dict[str, Any] | WorkflowTaskDraft]) -> list[dict[str, Any]]:
    return [
        task.model_dump(exclude_none=True) if isinstance(task, WorkflowTaskDraft) else task
        for task in tasks
    ]
