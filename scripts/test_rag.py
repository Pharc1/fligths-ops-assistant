import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.rag_service import RagService
from langchain_core.documents import Document

def main():
    print("Initialisation du service RAG...")
    rag = RagService()
    
    question = "Quels sont les symptômes de la panne sur la valve PT-42 ?"
    
    print(f"\nQuestion : {question}")
    print("-" * 50)
    
    results = rag.query(question, k=3)
    
    if not results:
        print("Aucun document trouvé !")
        return

    for i, doc in enumerate[Document](results, 1):
        source = doc.metadata.get('source', 'Inconnue')
        preview = doc.page_content[:200].replace('\n', ' ')
        
        print(f"Résultat #{i} (Source: {source})")
        print(f"   Contenu : {preview}...")
        print("-" * 50)

if __name__ == "__main__":
    main()