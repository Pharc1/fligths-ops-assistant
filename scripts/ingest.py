import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from langchain_community.document_loaders import DirectoryLoader, TextLoader
from app.services.rag_service import RagService
from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)


def main():
    logger.info(f"Démarrage de l'ingestion vers {settings.PERSIST_DIRECTORY}...")
    
    try:
        rag_service = RagService()

        loader = DirectoryLoader(
            './data',
            glob="*.txt",
            loader_cls=TextLoader,
            loader_kwargs={'encoding': 'utf-8'}
        )

        raw_docs = loader.load()

        if not raw_docs:
            logger.warning("Aucun document trouvé dans le dossier data")
            return

        logger.info(f"{len(raw_docs)} documents trouvés dans /data")

        rag_service.add_documents(raw_docs)
        logger.info("Ingestion terminée avec succès !")

    except FileNotFoundError as e:
        logger.error(f"Dossier introuvable: {str(e)}")
        sys.exit(1)

    except Exception as e:
        logger.critical(f"Erreur critique inattendue: {str(e)}", exc_info=True)
        sys.exit(1)
        

if __name__ == "__main__":
    main()