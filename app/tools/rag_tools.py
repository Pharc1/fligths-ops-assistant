"""RAG tool: search technical documentation and return structured evidence."""

import json
from pathlib import Path
from typing import Any

from langchain_core.documents import Document
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

from app.core.logger import get_logger
from app.services.rag_service import RagService

logger = get_logger(__name__)


class RagSearchInput(BaseModel):
    query: str = Field(description="Question or topic to search in technical documentation")
    k: int = Field(default=4, description="Number of passages to retrieve")


def build_rag_tools(rag_service: RagService) -> list[StructuredTool]:
    def rag_search(query: str, k: int = 4) -> str:
        logger.info("rag_search: query='%s', k=%d", query, k)
        results = rag_service.similarity_search_with_scores(query, k=k)
        return json.dumps(
            {
                "query": query,
                "results": [_document_to_evidence(doc, score) for doc, score in results],
            },
            ensure_ascii=False,
        )

    return [
        StructuredTool.from_function(
            func=rag_search,
            name="rag_search",
            args_schema=RagSearchInput,
            description=(
                "Search certified aeronautical documentation, MEL, service bulletins, "
                "maintenance history and technical manuals. Use before any technical conclusion."
            ),
        ),
    ]


def _document_to_evidence(doc: Document, score: float | None) -> dict[str, Any]:
    metadata = dict(doc.metadata or {})
    source = str(metadata.get("source") or "unknown")
    title = Path(source).name if source != "unknown" else "unknown"
    return {
        "sourceId": source,
        "title": title,
        "snippet": doc.page_content,
        "metadata": metadata,
        "source": _source_metadata(source, title, metadata),
        "score": score,
    }


def _source_metadata(source: str, title: str, metadata: dict[str, Any]) -> dict[str, Any]:
    result: dict[str, Any] = {
        "id": source,
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
    result.update({key: value for key, value in optional_fields.items() if value is not None})
    return result
