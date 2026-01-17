import pytest
from app.services.rag_service import RagService
from langchain_core.documents import Document


@pytest.fixture
def rag_service():
    return RagService()


def test_add_and_retrieve_document(rag_service):
    """
    Test complet : Onajoute un faux document et on vérifie qu'on le retrouve.
    """

    test_content =  "Le code secret de la vave PT-42 est 'BANANA-SPLIT'."
    doc = Document(page_content=test_content, metadata={"source": "test"})

    rag_service.add_documents([doc])

    results = rag_service.query("code secret valve PT-42", k=1)

    assert len(results) > 0, "Aucun document trouvé"

    found_content = results[0].page_content

    assert "BANANA-SPLIT" in found_content, f"Attendu 'BANANA-SPLIT' dans le contenu trouvé, mais obtenu: {found_content}"