from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.deps import get_agent_service
from app.api.v1.endpoints.agent import router


class FakeAgentService:
    async def stream(self, _query: str):
        yield 'data: {"type":"result","content":"ok"}\n\n'


def test_agent_ask_accepts_short_follow_up_question():
    app = FastAPI()
    app.include_router(router, prefix="/api/v1")
    app.dependency_overrides[get_agent_service] = lambda: FakeAgentService()

    response = TestClient(app).post("/api/v1/agent/ask", json={"question": "ok ?"})

    assert response.status_code == 200
