from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any
from uuid import uuid4


class WorkflowRunStatus(StrEnum):
    RUNNING_RESEARCH = "RUNNING_RESEARCH"
    RUNNING_PROCEDURE = "RUNNING_PROCEDURE"
    WAITING_USER = "WAITING_USER"
    DONE = "DONE"
    FAILED = "FAILED"
    CANCELED = "CANCELED"


class WorkflowTaskStatus(StrEnum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"
    BLOCKED = "BLOCKED"
    FAILED = "FAILED"


TERMINAL_RUN_STATUSES = {
    WorkflowRunStatus.DONE,
    WorkflowRunStatus.FAILED,
    WorkflowRunStatus.CANCELED,
}


@dataclass
class WorkflowTask:
    id: str
    raw_id: str
    kind: str
    title: str
    order_index: int
    status: WorkflowTaskStatus = WorkflowTaskStatus.PENDING
    visible: bool = True
    blocking: bool = False
    input: dict[str, Any] = field(default_factory=dict)
    output: dict[str, Any] | None = None
    error_message: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "raw_id": self.raw_id,
            "kind": self.kind,
            "title": self.title,
            "order_index": self.order_index,
            "status": self.status.value,
            "visible": self.visible,
            "blocking": self.blocking,
            "input": self.input,
            "output": self.output,
            "error_message": self.error_message,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


@dataclass
class WorkflowRun:
    id: str
    session_id: str
    goal_type: str
    title: str
    status: WorkflowRunStatus
    tasks: list[WorkflowTask]
    current_task_id: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "session_id": self.session_id,
            "goal_type": self.goal_type,
            "title": self.title,
            "status": self.status.value,
            "current_task_id": self.current_task_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "tasks": [task.to_dict() for task in self.tasks],
        }


class InMemoryWorkflowRepository:
    """Small workflow repository for v1.

    The repository is intentionally isolated behind this class so persistence can
    move to PostgreSQL without changing the agent engine or tools.
    """

    def __init__(self) -> None:
        self._runs: dict[str, WorkflowRun] = {}
        self._active_by_session: dict[str, str] = {}

    def start_run(
        self,
        session_id: str,
        goal_type: str,
        title: str,
        tasks: list[dict[str, Any]],
        status: WorkflowRunStatus = WorkflowRunStatus.RUNNING_RESEARCH,
    ) -> WorkflowRun:
        if not tasks:
            raise ValueError("workflow run requires at least one task")

        run_id = str(uuid4())
        run = WorkflowRun(
            id=run_id,
            session_id=session_id,
            goal_type=goal_type,
            title=title,
            status=status,
            tasks=[self._build_task(run_id, task, index) for index, task in enumerate(tasks)],
        )
        self._runs[run.id] = run
        self._active_by_session[session_id] = run.id
        return run

    def get(self, run_id: str) -> WorkflowRun | None:
        return self._runs.get(run_id)

    def get_active(self, session_id: str) -> WorkflowRun | None:
        run_id = self._active_by_session.get(session_id)
        if not run_id:
            return None
        run = self._runs.get(run_id)
        if run and run.status in TERMINAL_RUN_STATUSES:
            return None
        return run

    def add_tasks(self, run_id: str, tasks: list[dict[str, Any]]) -> WorkflowRun:
        run = self._require_run(run_id)
        self._ensure_not_terminal(run)
        next_index = len(run.tasks)
        run.tasks.extend(
            self._build_task(run.id, task, next_index + index)
            for index, task in enumerate(tasks)
        )
        self._touch(run)
        return run

    def update_task(
        self,
        run_id: str,
        task_id: str,
        status: WorkflowTaskStatus | None = None,
        output: dict[str, Any] | None = None,
        title: str | None = None,
        error_message: str | None = None,
    ) -> WorkflowRun:
        run = self._require_run(run_id)
        self._ensure_not_terminal(run)
        task = self._find_task(run, task_id)
        if task is None:
            raise ValueError(f"unknown task '{task_id}' in workflow run '{run_id}'")

        if title is not None:
            task.title = title
        if output is not None:
            task.output = output
        if error_message is not None:
            task.error_message = error_message
        if status is not None:
            task.status = status
            now = datetime.now(UTC)
            if status == WorkflowTaskStatus.IN_PROGRESS:
                task.started_at = task.started_at or now
                run.current_task_id = task.id
            if status in {WorkflowTaskStatus.DONE, WorkflowTaskStatus.FAILED}:
                task.completed_at = now
                if run.current_task_id == task.id:
                    run.current_task_id = None

        self._finish_if_all_visible_done(run)
        self._touch(run)
        return run

    def set_status(self, run_id: str, status: WorkflowRunStatus) -> WorkflowRun:
        run = self._require_run(run_id)
        run.status = status
        if status in TERMINAL_RUN_STATUSES:
            run.current_task_id = None
            if self._active_by_session.get(run.session_id) == run.id:
                self._active_by_session.pop(run.session_id, None)
        self._touch(run)
        return run

    def _build_task(self, run_id: str, task: dict[str, Any], index: int) -> WorkflowTask:
        raw_id = str(task.get("id") or uuid4())
        return WorkflowTask(
            id=f"{run_id}:{raw_id}",
            raw_id=raw_id,
            kind=str(task["kind"]),
            title=str(task["title"]),
            order_index=int(task.get("order_index", index)),
            visible=bool(task.get("visible", True)),
            blocking=bool(task.get("blocking", False)),
            input=dict(task.get("input") or {}),
        )

    def _require_run(self, run_id: str) -> WorkflowRun:
        run = self._runs.get(run_id)
        if run is None:
            raise ValueError(f"unknown workflow run '{run_id}'")
        return run

    def _ensure_not_terminal(self, run: WorkflowRun) -> None:
        if run.status in TERMINAL_RUN_STATUSES:
            raise ValueError(f"workflow run '{run.id}' is already terminal")

    @staticmethod
    def _find_task(run: WorkflowRun, task_id: str) -> WorkflowTask | None:
        return next(
            (
                task
                for task in run.tasks
                if task.id == task_id or task.raw_id == task_id or task.id.endswith(f":{task_id}")
            ),
            None,
        )

    def _finish_if_all_visible_done(self, run: WorkflowRun) -> None:
        visible = [task for task in run.tasks if task.visible]
        if visible and all(task.status == WorkflowTaskStatus.DONE for task in visible):
            self.set_status(run.id, WorkflowRunStatus.DONE)

    @staticmethod
    def _touch(run: WorkflowRun) -> None:
        run.updated_at = datetime.now(UTC)
