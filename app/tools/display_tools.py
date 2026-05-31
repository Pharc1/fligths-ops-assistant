import json
from pathlib import Path
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
            "For document panels, pass rag_search results in payload.results and the exact value or "
            "phrase to emphasize in payload.value or payload.highlight. "
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
                "payload": _normalize_payload(mode, payload or {}),
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
                "For mode=document, include the rag_search result rows in payload.results so source "
                "metadata is preserved, and put the exact highlighted value in payload.value or payload.highlight. "
                "Do not add a generic recommendation when the user only asked for a value or source."
            ),
        )
    ]


def _normalize_payload(mode: PanelMode, payload: dict[str, Any]) -> dict[str, Any]:
    if mode != "document":
        return payload
    return _normalize_document_payload(payload)


def _normalize_document_payload(payload: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(payload)
    if normalized.get("entries") or normalized.get("citations") or normalized.get("sources"):
        return normalized

    evidence_items = _extract_evidence_items(normalized)
    if evidence_items:
        normalized["entries"] = [_evidence_to_entry(item, normalized) for item in evidence_items]
    return normalized


def _extract_evidence_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
    candidates = payload.get("results") or payload.get("evidence") or payload.get("ragResults")
    if isinstance(candidates, dict):
        candidates = candidates.get("results")
    if isinstance(candidates, list):
        return [item for item in candidates if isinstance(item, dict)]
    if "snippet" in payload or "metadata" in payload:
        return [payload]
    return []


def _evidence_to_entry(evidence: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    text = str(evidence.get("snippet") or evidence.get("text") or evidence.get("content") or "")
    value = _first_present(payload, "highlight", "value", "limit", "threshold")
    highlight = str(evidence.get("highlight") or evidence.get("excerpt") or value or "")
    return {
        "text": text,
        "highlight": highlight,
        "before": evidence.get("before") or "",
        "after": evidence.get("after") or "",
        "score": evidence.get("score"),
        "source": _source_from_evidence(evidence),
    }


def _source_from_evidence(evidence: dict[str, Any]) -> dict[str, Any]:
    if isinstance(evidence.get("source"), dict):
        return evidence["source"]

    metadata = dict(evidence.get("metadata") or {})
    source_id = str(evidence.get("sourceId") or metadata.get("source") or "unknown")
    title = str(evidence.get("title") or (Path(source_id).name if source_id != "unknown" else "unknown"))
    source = {
        "id": source_id,
        "label": title,
        "title": title,
    }
    optional_fields = {
        "page": metadata.get("page"),
        "date": metadata.get("date"),
        "section": metadata.get("section"),
        "ata": metadata.get("ata"),
        "url": metadata.get("url"),
        "startIndex": metadata.get("start_index"),
    }
    source.update({key: value for key, value in optional_fields.items() if value is not None})
    return source


def _first_present(data: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        value = data.get(key)
        if value not in (None, ""):
            return value
    return None
