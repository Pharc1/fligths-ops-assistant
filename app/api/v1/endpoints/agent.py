from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.api.deps import get_agent_service
from app.core.exceptions import AgentError
from app.core.logger import get_logger
from app.core.prompts import build_incident_input, build_interactive_input
from app.services.agent_service import AgentService

router = APIRouter()
logger = get_logger(__name__)


class InteractiveRequest(BaseModel):
    question: str = Field(min_length=5, max_length=2000)
    dossier_context: str | None = Field(default=None, max_length=5000)


class IncidentRequest(BaseModel):
    flight_id: str
    aircraft: str
    severity: str = Field(pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    description: str = Field(min_length=10, max_length=3000)


@router.post("/agent/ask", tags=["Agent"])
async def ask(
    body: InteractiveRequest,
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Mode 2 — question d'un technicien sur un dossier ouvert.
    Streame les événements SSE en temps réel : tool calls, tokens, réponse finale.

    Événements SSE :
      data: {"type": "tool_start", "tool": "rag_search", "input": {...}}
      data: {"type": "tool_end",   "tool": "rag_search", "output": "..."}
      data: {"type": "token",      "content": "..."}
      data: {"type": "done",       "content": "réponse finale"}
    """
    query = build_interactive_input(body.question, body.dossier_context)

    async def event_generator():
        try:
            async for chunk in agent_service.stream(query):
                yield chunk
        except AgentError as exc:
            import json
            yield f"data: {json.dumps({'type': 'error', 'message': exc.message})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/agent/analyze", tags=["Agent"])
async def analyze_incident(
    body: IncidentRequest,
    agent_service: AgentService = Depends(get_agent_service),
):
    """
    Mode 1 en HTTP — analyse d'un incident, même agent que Kafka mais via REST.
    Retourne la réponse complète une fois l'analyse terminée (pas de streaming).
    """
    query = build_incident_input(
        flight_id=body.flight_id,
        aircraft=body.aircraft,
        severity=body.severity,
        description=body.description,
    )
    result = await agent_service.run(query)
    return {"analysis": result}
