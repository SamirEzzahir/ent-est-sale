import unittest
from datetime import datetime
from uuid import uuid4
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.auth import get_current_user
from main import app


class _Row:
    def __init__(self):
        self.id = uuid4()
        self.filename = "cours.pdf"
        self.course_name = "Architecture"
        self.uploaded_by = "teacher1"
        self.upload_date = datetime(2026, 4, 15, 10, 0, 0)
        self.minio_path = "course-files/teacher1/cours.pdf"


class _Session:
    def execute(self, *_args, **_kwargs):
        return [_Row()]


class DownloadServiceSmokeTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        app.dependency_overrides[get_current_user] = lambda: {
            "username": "student1",
            "role": "student",
        }

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_health_endpoint(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"service": "download-service", "status": "ok"})

    @patch("app.routes.get_session")
    def test_list_files_returns_metadata(self, mock_get_session):
        mock_get_session.return_value = _Session()

        response = self.client.get("/api/download/files")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["filename"], "cours.pdf")
        self.assertEqual(payload[0]["course_name"], "Architecture")


if __name__ == "__main__":
    unittest.main()
