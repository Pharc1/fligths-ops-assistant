import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from langchain_community.document_loaders import DirectoryLoader, TextLoader
from app.services.rag_service import RagService
from app.core.config import settings

def main():
    print(f"Démarrage de l'ingestion vers {settings.PERSIST_DIRECTORY}...")
    
    rag_service = RagService()
    
    loader = DirectoryLoader('./data', glob="*.txt", loader_cls=TextLoader, loader_kwargs={'encoding': 'utf-8'} )
    raw_docs = loader.load()
    
    print(f"{len(raw_docs)} documents trouvés dans /data")

    rag_service.add_documents(raw_docs)
    
    print("Ingestion terminée avec succès !")

if __name__ == "__main__":
    main()