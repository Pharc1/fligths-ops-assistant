import json

from app.tools.completion_tools import build_completion_tools


def test_complete_response_returns_structured_stop_reason():
    tool = build_completion_tools()[0]

    result = json.loads(tool.invoke({
        "reason": "answered",
        "summary": "Pression historique affichee avec deux mesures exploitables.",
        "confidence": 0.84,
        "next_action": "Verifier la source constructeur si intervention requise.",
    }))

    assert result == {
        "ok": True,
        "reason": "answered",
        "summary": "Pression historique affichee avec deux mesures exploitables.",
        "confidence": 0.84,
        "next_action": "Verifier la source constructeur si intervention requise.",
    }
