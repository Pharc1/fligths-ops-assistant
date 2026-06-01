import json
import re
from pathlib import Path
from typing import Any, Literal

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

PanelMode = Literal["document", "history", "telemetry", "part", "notice", "checklist"]
PanelPriority = Literal["primary", "secondary", "inline"]


class DisplayPanelInput(BaseModel):
    mode: PanelMode = Field(
        description=(
            "Panel type to render: document for cited text, history for dated maintenance failures, "
            "telemetry for numeric values/limits, part for component identity, checklist for procedure steps."
        )
    )
    title: str = Field(description="Short panel title")
    priority: PanelPriority = Field(default="secondary", description="Panel layout priority")
    payload: dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "Mode-specific panel data. Optional UI keys: headline sets the investigation screen title; "
            "spoken/commentary is the short sentence RIME says to the MRO outside the panel. "
            "For document panels, pass rag_search results in payload.results and the exact value or "
            "phrase to emphasize in payload.value or payload.highlight. "
            "For history panels, pass dated rows in payload.rows or raw rag_search rows in payload.results. "
            "For measured history, pass value/unit on each row or payload.series for chart rendering. "
            "For telemetry panels, pass payload.value/unit/limit or current_value/min_limit/max_limit. "
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
                "Use mode=history with payload.rows for dated failures; use mode=telemetry for measured values, "
                "limits, pressure/temperature/current readings, measured history curves or compact numeric blocks. "
                "Do not add a generic recommendation when the user only asked for a value or source."
            ),
        )
    ]


def _normalize_payload(mode: PanelMode, payload: dict[str, Any]) -> dict[str, Any]:
    if mode == "document":
        return _normalize_document_payload(payload)
    if mode == "history":
        return _normalize_history_payload(payload)
    if mode == "telemetry":
        return _normalize_telemetry_payload(payload)
    return payload


def _normalize_document_payload(payload: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(payload)
    if normalized.get("entries") or normalized.get("citations") or normalized.get("sources"):
        return normalized

    evidence_items = _extract_evidence_items(normalized)
    if evidence_items:
        normalized["entries"] = [_evidence_to_entry(item, normalized) for item in evidence_items]
    return normalized


def _normalize_history_payload(payload: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(payload)
    source_rows = normalized.get("rows") or normalized.get("events")
    if source_rows:
        rows = [_normalize_history_row(row) for row in source_rows if isinstance(row, dict)]
    else:
        evidence_items = _extract_evidence_items(normalized)
        rows = [_evidence_to_history_row(item) for item in evidence_items]

    if rows:
        normalized["rows"] = rows
        series = _series_from_rows(rows)
        if series:
            normalized["series"] = series
            normalized.setdefault("samples", [point["value"] for point in series])
            normalized.setdefault("unit", series[-1].get("unit") or "")
            normalized.setdefault("value", series[-1]["value"])
    return normalized


def _normalize_telemetry_payload(payload: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(payload)
    if "value" not in normalized and "current_value" in normalized:
        normalized["value"] = normalized["current_value"]

    unit = str(normalized.get("unit") or "")
    min_limit = normalized.get("min_limit")
    max_limit = normalized.get("max_limit")
    if "limit" not in normalized and (min_limit is not None or max_limit is not None):
        normalized["limit"] = f"{min_limit if min_limit is not None else '--'}-{max_limit if max_limit is not None else '--'} {unit}".strip()
    if "nominal" not in normalized and "limit" in normalized:
        normalized["nominal"] = normalized["limit"]
    if "trend" not in normalized and "status" in normalized:
        normalized["trend"] = normalized["status"]
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


def _evidence_to_history_row(evidence: dict[str, Any]) -> dict[str, Any]:
    metadata = dict(evidence.get("metadata") or {})
    title = str(evidence.get("title") or "")
    label = str(evidence.get("label") or evidence.get("snippet") or evidence.get("text") or "")
    row = {
        "date": evidence.get("date") or metadata.get("date") or metadata.get("timestamp") or _extract_date(label) or "--",
        "label": label,
        "source": title or Path(str(metadata.get("source") or "")).name,
        "score": evidence.get("score"),
    }
    severity = evidence.get("severity") or evidence.get("status") or metadata.get("severity") or metadata.get("status")
    if severity:
        row["severity"] = str(severity)
    measurement = _extract_measurement(label)
    if measurement:
        row.update(measurement)
    return row


def _normalize_history_row(row: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(row)
    label = str(normalized.get("label") or normalized.get("description") or normalized.get("text") or "")
    normalized.setdefault("label", label)
    normalized["date"] = normalized.get("date") or normalized.get("timestamp") or _extract_date(label) or "--"
    if "value" not in normalized:
        measurement = _extract_measurement(label)
        if measurement:
            normalized.update(measurement)
    return normalized


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


def _extract_date(text: str) -> str | None:
    match = re.search(r"\b(20\d{2}[-/]\d{2}[-/]\d{2})\b", text)
    return match.group(1).replace("/", "-") if match else None


def _extract_measurement(text: str) -> dict[str, Any] | None:
    match = re.search(
        r"\b(?P<value>\d+(?:[ .]\d{3})*(?:[,.]\d+)?)\s*(?P<unit>psi|bar|kpa|mpa|pa|l/min|lpm|°c|degc|c|v|a|%)\b",
        text,
        flags=re.IGNORECASE,
    )
    if not match:
        return None
    return {
        "value": _parse_measurement_value(match.group("value")),
        "unit": _normalize_unit(match.group("unit")),
    }


def _series_from_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    series: list[dict[str, Any]] = []
    for row in rows:
        value = row.get("value")
        if value in (None, ""):
            continue
        try:
            numeric_value = float(str(value).replace(",", "."))
        except ValueError:
            continue
        series.append(
            {
                "date": str(row.get("date") or row.get("timestamp") or "--"),
                "value": int(numeric_value) if numeric_value.is_integer() else numeric_value,
                "unit": str(row.get("unit") or ""),
            }
        )
    return series


def _parse_measurement_value(raw: str) -> int | float:
    compact = raw.replace(" ", "")
    if "," in compact:
        compact = compact.replace(".", "").replace(",", ".")
    elif re.fullmatch(r"\d{1,3}(?:\.\d{3})+", compact):
        compact = compact.replace(".", "")
    value = float(compact)
    return int(value) if value.is_integer() else value


def _normalize_unit(raw: str) -> str:
    unit = raw.lower()
    if unit == "lpm":
        return "L/min"
    if unit in {"degc", "c"}:
        return "°C"
    if unit == "l/min":
        return "L/min"
    return unit.upper()
