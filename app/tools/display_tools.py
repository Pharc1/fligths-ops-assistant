import json
from typing import Any, Literal

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

PanelMode = Literal["document", "history", "telemetry", "part", "notice", "checklist"]
PanelPriority = Literal["primary", "secondary", "inline"]


class DisplayPanelInput(BaseModel):
    mode: PanelMode = Field(description="Panel type to render in the frontend")
    title: str = Field(description="Short panel title")
    priority: PanelPriority = Field(default="secondary", description="Panel layout priority")
    payload: dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "Mode-specific panel data. Optional UI keys: headline sets the investigation screen title; "
            "spoken/commentary is the short sentence RIME says to the MRO outside the panel. "
            "Use recommendation only when the MRO explicitly asks for a recommendation or decision support."
        ),
    )


def build_display_tools() -> list[StructuredTool]:
    def display_panel(
        mode: PanelMode,
        title: str,
        priority: PanelPriority = "secondary",
        payload: dict[str, Any] | None = None,
    ) -> str:
        return json.dumps(
            {
                "mode": mode,
                "title": title,
                "priority": priority,
                "payload": payload or {},
            },
            ensure_ascii=False,
        )

    return [
        StructuredTool.from_function(
            func=display_panel,
            name="display_panel",
            args_schema=DisplayPanelInput,
            description=(
                "Display a structured UI panel for the MRO. Use mode=document for source excerpts, "
                "history for maintenance logs, telemetry for values and limits, part for component "
                "identity, notice for warnings, and checklist for non-stateful lists. Put RIME's spoken "
                "comment in payload.spoken or payload.commentary, not in the document description. "
                "Do not add a generic recommendation when the user only asked for a value or source."
            ),
        )
    ]
