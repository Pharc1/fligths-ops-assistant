import json
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class AgentEvent:
    """Provider-agnostic stream event emitted by the RIME engine."""

    type: str
    data: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return {"type": self.type, **self.data}

    def to_sse(self) -> str:
        return f"data: {json.dumps(self.to_dict(), ensure_ascii=False)}\n\n"
