import json
from typing import Literal

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

CompletionReason = Literal[
    "answered",
    "insufficient_evidence",
    "procedure_paused",
    "procedure_complete",
    "escalation_required",
    "canceled",
]


class CompleteResponseInput(BaseModel):
    reason: CompletionReason = Field(description="Concrete reason why the current agent turn is complete")
    summary: str = Field(description="Final short sentence RIME says to the MRO")
    confidence: float | None = Field(default=None, description="Optional confidence between 0.0 and 1.0")
    next_action: str | None = Field(default=None, description="Optional next action proposed to the MRO")


def build_completion_tools() -> list[StructuredTool]:
    def complete_response(
        reason: CompletionReason,
        summary: str,
        confidence: float | None = None,
        next_action: str | None = None,
    ) -> str:
        return json.dumps(
            {
                "ok": True,
                "reason": reason,
                "summary": summary,
                "confidence": confidence,
                "next_action": next_action,
            },
            ensure_ascii=False,
        )

    return [
        StructuredTool.from_function(
            func=complete_response,
            name="complete_response",
            args_schema=CompleteResponseInput,
            description=(
                "Finish the current RIME turn with a concrete stop reason. Call this only after all useful "
                "searches, workflow updates and display panels are done. Never use display_panel as a final stop."
            ),
        )
    ]
