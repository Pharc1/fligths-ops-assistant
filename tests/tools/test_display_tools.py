import json

from app.tools.display_tools import build_display_tools


def test_display_panel_returns_structured_payload():
    tool = build_display_tools()[0]

    result = tool.invoke({
        "mode": "document",
        "title": "AMM 29-11-42",
        "priority": "primary",
        "payload": {"highlight": "3000 PSI"},
    })

    payload = json.loads(result)
    assert payload["mode"] == "document"
    assert payload["title"] == "AMM 29-11-42"
    assert payload["payload"]["highlight"] == "3000 PSI"


def test_display_panel_rejects_unknown_mode():
    tool = build_display_tools()[0]

    try:
        tool.invoke({
            "mode": "unknown",
            "title": "Bad panel",
            "priority": "primary",
            "payload": {},
        })
    except Exception as exc:
        assert "unknown" in str(exc)
    else:
        raise AssertionError("display_panel accepted an unknown mode")


def test_display_panel_payload_schema_mentions_spoken_context():
    tool = build_display_tools()[0]
    schema = tool.args_schema.model_json_schema()

    description = schema["properties"]["payload"]["description"]
    assert "headline" in description
    assert "spoken" in description
    assert "results" in description
    assert "highlight" in description
    assert "history" in description
    assert "telemetry" in description
    assert "recommendation" in description


def test_display_panel_normalizes_rag_results_into_document_entries():
    tool = build_display_tools()[0]

    result = tool.invoke({
        "mode": "document",
        "title": "Valeur limite FS-01",
        "priority": "primary",
        "payload": {
            "value": "2 L/min",
            "results": [
                {
                    "snippet": "Flow Sensor FS-01 leak detection threshold is 2 L/min.",
                    "sourceId": "data/hydraulic_manual.txt",
                    "title": "hydraulic_manual.txt",
                    "metadata": {"source": "data/hydraulic_manual.txt", "start_index": 3189},
                    "score": 0.24,
                }
            ],
        },
    })

    payload = json.loads(result)["payload"]
    assert payload["entries"][0]["highlight"] == "2 L/min"
    assert payload["entries"][0]["text"] == "Flow Sensor FS-01 leak detection threshold is 2 L/min."
    assert payload["entries"][0]["source"]["label"] == "hydraulic_manual.txt"
    assert payload["entries"][0]["source"]["startIndex"] == 3189


def test_display_panel_normalizes_rag_results_into_history_rows():
    tool = build_display_tools()[0]

    result = tool.invoke({
        "mode": "history",
        "title": "Pannes recentes train atterrissage",
        "priority": "primary",
        "payload": {
            "results": [
                {
                    "snippet": "2026-05-14 - Train landing gear pressure high - valve inspected.",
                    "title": "incident_history.txt",
                    "metadata": {"source": "data/incident_history.txt", "date": "2026-05-14"},
                    "score": 0.18,
                }
            ],
        },
    })

    payload = json.loads(result)["payload"]
    assert payload["rows"] == [
        {
            "date": "2026-05-14",
            "label": "2026-05-14 - Train landing gear pressure high - valve inspected.",
            "source": "incident_history.txt",
            "score": 0.18,
        }
    ]


def test_display_panel_extracts_history_date_from_rag_snippet():
    tool = build_display_tools()[0]

    result = tool.invoke({
        "mode": "history",
        "title": "Pannes recentes train atterrissage",
        "priority": "primary",
        "payload": {
            "results": [
                {
                    "snippet": "2026/05/14 - Pression hydraulique train trop elevee avant inspection vanne.",
                    "title": "incident_history.txt",
                    "metadata": {"source": "data/incident_history.txt"},
                }
            ],
        },
    })

    payload = json.loads(result)["payload"]
    assert payload["rows"][0]["date"] == "2026-05-14"


def test_display_panel_extracts_numeric_pressure_history_series():
    tool = build_display_tools()[0]

    result = tool.invoke({
        "mode": "history",
        "title": "Historique pression train",
        "priority": "primary",
        "payload": {
            "results": [
                {
                    "snippet": "2023-03-03 - Pression hydraulique train relevee a 2840 PSI apres inspection.",
                    "title": "incident_history.txt",
                    "metadata": {"source": "data/incident_history.txt"},
                },
                {
                    "snippet": "2023-11-22 - Pression hydraulique train relevee a 3180 PSI, limite haute proche.",
                    "title": "incident_history.txt",
                    "metadata": {"source": "data/incident_history.txt"},
                },
            ],
        },
    })

    payload = json.loads(result)["payload"]
    assert payload["rows"][0]["value"] == 2840
    assert payload["rows"][0]["unit"] == "PSI"
    assert payload["rows"][1]["value"] == 3180
    assert payload["series"] == [
        {"date": "2023-03-03", "value": 2840, "unit": "PSI"},
        {"date": "2023-11-22", "value": 3180, "unit": "PSI"},
    ]


def test_display_panel_normalizes_telemetry_value_aliases():
    tool = build_display_tools()[0]

    result = tool.invoke({
        "mode": "telemetry",
        "title": "Pression hydraulique train",
        "priority": "primary",
        "payload": {
            "current_value": 3150,
            "unit": "PSI",
            "min_limit": 2800,
            "max_limit": 3200,
            "status": "nominal",
        },
    })

    payload = json.loads(result)["payload"]
    assert payload["value"] == 3150
    assert payload["limit"] == "2800-3200 PSI"
    assert payload["trend"] == "nominal"
