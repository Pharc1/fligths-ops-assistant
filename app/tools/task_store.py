"""
TaskStore — mémoire de travail de l'agent pour une session.

Chaque run d'agent reçoit sa propre instance. Les tâches ne sont pas persistées
en base — elles vivent le temps que l'agent résout le problème posé.
"""

import uuid
from dataclasses import dataclass, field
from enum import Enum


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    STOPPED = "stopped"


@dataclass
class Task:
    id: str
    title: str
    status: TaskStatus = TaskStatus.PENDING
    output: str = ""

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "status": self.status.value,
            "output": self.output,
        }


class TaskStore:
    def __init__(self) -> None:
        self._tasks: dict[str, Task] = {}

    def create(self, title: str) -> Task:
        task = Task(id=str(uuid.uuid4())[:8], title=title)
        self._tasks[task.id] = task
        return task

    def get(self, task_id: str) -> Task | None:
        return self._tasks.get(task_id)

    def list_all(self) -> list[Task]:
        return list(self._tasks.values())

    def update(self, task_id: str, status: TaskStatus) -> Task | None:
        task = self._tasks.get(task_id)
        if task:
            task.status = status
        return task

    def set_output(self, task_id: str, output: str) -> Task | None:
        task = self._tasks.get(task_id)
        if task:
            task.output = output
        return task

    def stop(self, task_id: str) -> Task | None:
        return self.update(task_id, TaskStatus.STOPPED)
