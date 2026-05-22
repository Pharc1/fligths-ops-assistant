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
