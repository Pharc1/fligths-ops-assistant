import json

from langchain_core.documents import Document

from app.tools.rag_tools import build_rag_tools


class FakeRag:
    def similarity_search_with_scores(self, query_text: str, k: int):
        return [
            (
                Document(
                    page_content="Closing pressure must be 3000 PSI before valve removal.",
                    metadata={"source": "data/hydraulic_manual.txt", "start_index": 42},
                ),
                0.12,
            )
        ]


def test_rag_search_returns_structured_json_evidence():
    tool = build_rag_tools(FakeRag())[0]

    result = json.loads(tool.invoke({"query": "valve pressure", "k": 1}))

    assert result["query"] == "valve pressure"
    assert result["results"][0]["sourceId"] == "data/hydraulic_manual.txt"
    assert result["results"][0]["title"] == "hydraulic_manual.txt"
    assert result["results"][0]["snippet"] == "Closing pressure must be 3000 PSI before valve removal."
    assert result["results"][0]["score"] == 0.12
