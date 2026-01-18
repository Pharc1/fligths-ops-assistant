from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from typing import List
from app.core.config import settings
from app.core.logger import get_logger
from langchain_google_genai import GoogleGenerativeAIEmbeddings

logger = get_logger(__name__)


class RagService:
    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            google_api_key=settings.GOOGLE_API_KEY 
        )
        
        self.vector_store = Chroma(
            collection_name=settings.COLLECTION_NAME,
            embedding_function=self.embeddings,
            persist_directory=settings.PERSIST_DIRECTORY,
        )

    def add_documents(self, documents: List[Document]) -> None:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            add_start_index=True,
            separators=["\n\n", "\n", " ", ""]
        )
        chunks = text_splitter.split_documents(documents)


        logger.info(f"Découpagede {len(documents)} documents en {len(chunks)} chunks")
        self.vector_store.add_documents(chunks)
        logger.info(f"Sauvegarde terminée dans {settings.PERSIST_DIRECTORY}")


    def similarity_search(self, query_text: str, k: int = 3) -> List[Document]:
        logger.info(f"Recherche de {k} documents similaires à la requête: {query_text}")
        results = self.vector_store.similarity_search(query_text, k=k)
        logger.info(f"Résultats trouvés: {len(results)}")
        return results

