import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.auth import get_current_user, get_token
from main import app


class AIAssistantServiceSmokeTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        app.dependency_overrides[get_current_user] = lambda: {
            "username": "student1",
            "role": "student",
            "email": "student1@example.com",
        }
        app.dependency_overrides[get_token] = lambda: "fake-token"

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_health_endpoint(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"service": "ai-assistant-service", "status": "ok"})

    @patch("app.routes.list_ollama_models", new_callable=AsyncMock)
    def test_assistant_health(self, mock_models):
        mock_models.return_value = ["llama3.2"]

        response = self.client.get("/api/ai/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["ollama_models"], ["llama3.2"])

    @patch("app.routes.fetch_profile", new_callable=AsyncMock)
    @patch("app.routes.fetch_files", new_callable=AsyncMock)
    @patch("app.routes.generate_with_ollama", new_callable=AsyncMock)
    def test_chat_uses_ollama_when_available(self, mock_generate, mock_fetch_files, mock_fetch_profile):
        mock_fetch_profile.return_value = {"username": "student1", "role": "student", "email": ""}
        mock_fetch_files.return_value = [{"id": "1", "filename": "cours.pdf", "course_name": "Algo", "uploaded_by": "teacher1"}]
        mock_generate.return_value = "Voici une reponse."

        response = self.client.post("/api/ai/chat", json={"message": "Resume le cours"})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["provider"], "ollama")
        self.assertIn("Voici une reponse.", payload["answer"])

    @patch("app.routes.fetch_profile", new_callable=AsyncMock)
    @patch("app.routes.fetch_files", new_callable=AsyncMock)
    @patch("app.routes.generate_with_ollama", new_callable=AsyncMock)
    def test_chat_falls_back_when_ollama_is_unavailable(self, mock_generate, mock_fetch_files, mock_fetch_profile):
        from fastapi import HTTPException

        mock_fetch_profile.return_value = {"username": "student1", "role": "student", "email": ""}
        mock_fetch_files.return_value = [{"id": "1", "filename": "cours.pdf", "course_name": "Algo", "uploaded_by": "teacher1"}]
        mock_generate.side_effect = HTTPException(status_code=503, detail="Ollama unavailable")

        response = self.client.post("/api/ai/chat", json={"message": "Quels cours existent ?"})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["provider"], "fallback")
        self.assertIn("mode MVP", payload["answer"])


if __name__ == "__main__":
    unittest.main()
