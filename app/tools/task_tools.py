"""
Task management tools — mémoire de travail de l'agent.

Ces tools sont créés via `build_task_tools(store)` pour injecter
le TaskStore de la session courante. Chaque run d'agent a son propre store.
"""

from langchain.tools import StructuredTool
from pydantic import BaseModel, Field

from app.tools.task_store import TaskStatus, TaskStore


# Schémas d'input pour chaque tool (LangChain les utilise pour valider les appels)

class CreateTaskListInput(BaseModel):
    titles: list[str] = Field(description="Liste ordonnée des tâches à créer pour planifier la session")

class CreateInput(BaseModel):
    title: str = Field(description="Description courte de la tâche à réaliser")

class GetInput(BaseModel):
    task_id: str = Field(description="ID de la tâche à récupérer")

class UpdateInput(BaseModel):
    task_id: str = Field(description="ID de la tâche à mettre à jour")
    status: str = Field(description="Nouveau statut : pending | in_progress | completed | stopped")

class OutputInput(BaseModel):
    task_id: str = Field(description="ID de la tâche")
    output: str = Field(description="Résultat ou notes associés à cette tâche")

class StopInput(BaseModel):
    task_id: str = Field(description="ID de la tâche à arrêter")


def build_task_tools(store: TaskStore) -> list[StructuredTool]:
    """
    Construit les 6 task tools liés au store de la session courante.
    Appelé une fois par run d'agent dans agent_service.py.
    """

    def create_task_list(titles: list[str]) -> str:
        """Crée toutes les tâches du plan d'un coup."""
        created = [store.create(t) for t in titles]
        lines = [f"Plan created ({len(created)} tasks):"]
        lines += [f"  [{t.id}] {t.title}" for t in created]
        return "\n".join(lines)

    def task_create(title: str) -> str:
        task = store.create(title)
        return f"Task created: id={task.id}, title='{task.title}', status={task.status.value}"

    def task_get(task_id: str) -> str:
        task = store.get(task_id)
        if not task:
            return f"No task found with id={task_id}"
        return str(task.to_dict())

    def task_list() -> str:
        tasks = store.list_all()
        if not tasks:
            return "No tasks in current session."
        return "\n".join(str(t.to_dict()) for t in tasks)

    def task_update(task_id: str, status: str) -> str:
        try:
            new_status = TaskStatus(status)
        except ValueError:
            return f"Invalid status '{status}'. Valid values: pending, in_progress, completed, stopped"
        task = store.update(task_id, new_status)
        if not task:
            return f"No task found with id={task_id}"
        return f"Task {task_id} updated to status={task.status.value}"

    def task_output(task_id: str, output: str) -> str:
        task = store.set_output(task_id, output)
        if not task:
            return f"No task found with id={task_id}"
        return f"Output saved for task {task_id}"

    def task_stop(task_id: str) -> str:
        task = store.stop(task_id)
        if not task:
            return f"No task found with id={task_id}"
        return f"Task {task_id} stopped."

    return [
        StructuredTool.from_function(func=create_task_list, name="create_task_list", args_schema=CreateTaskListInput,
            description="Créer le plan de travail complet en une fois — liste ordonnée de toutes les tâches à accomplir."),
        StructuredTool.from_function(func=task_create, name="task_create", args_schema=CreateInput,
            description="Créer une seule tâche supplémentaire si besoin en cours de session."),
        StructuredTool.from_function(func=task_get, name="task_get", args_schema=GetInput,
            description="Récupérer les détails d'une tâche par son ID."),
        StructuredTool.from_function(func=task_list, name="task_list",
            description="Lister toutes tes tâches en cours pour ne pas perdre le fil."),
        StructuredTool.from_function(func=task_update, name="task_update", args_schema=UpdateInput,
            description="Mettre à jour le statut d'une tâche (pending, in_progress, completed, stopped)."),
        StructuredTool.from_function(func=task_output, name="task_output", args_schema=OutputInput,
            description="Enregistrer le résultat ou les notes d'une tâche terminée."),
        StructuredTool.from_function(func=task_stop, name="task_stop", args_schema=StopInput,
            description="Arrêter une tâche qui ne peut pas être complétée."),
    ]
