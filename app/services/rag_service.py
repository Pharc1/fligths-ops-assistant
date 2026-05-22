from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)


class RagService:
    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            google_api_key=settings.GOOGLE_API_KEY,
        )

        self.vector_store = Chroma(
            collection_name=settings.COLLECTION_NAME,
            embedding_function=self.embeddings,
            persist_directory=settings.PERSIST_DIRECTORY,
        )

    def add_documents(self, documents: list[Document]) -> None:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            add_start_index=True,
            separators=["\n\n", "\n", " ", ""],
        )
        chunks = text_splitter.split_documents(documents)

        logger.info("Split %d documents into %d chunks", len(documents), len(chunks))
        self.vector_store.add_documents(chunks)
        logger.info("RAG persistence completed in %s", settings.PERSIST_DIRECTORY)

    def similarity_search(self, query_text: str, k: int = 3) -> list[Document]:
        logger.info("RAG search: query='%s', k=%d", query_text, k)
        results = self.vector_store.similarity_search(query_text, k=k)
        logger.info("RAG results found: %d", len(results))
        return results

    def similarity_search_with_scores(self, query_text: str, k: int = 3) -> list[tuple[Document, float]]:
        logger.info("RAG scored search: query='%s', k=%d", query_text, k)
        results = self.vector_store.similarity_search_with_score(query_text, k=k)
        logger.info("RAG scored results found: %d", len(results))
        return results
