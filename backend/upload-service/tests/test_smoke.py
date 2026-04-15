import io
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.auth import require_teacher
from main import app


class _FakeMinioClient:
    def __init__(self):
        self.put_calls = []
        self.remove_calls = []

    def put_object(self, bucket, key, stream, length):
        self.put_calls.append((bucket, key, length, stream.read()))

    def remove_object(self, bucket, key):
        self.remove_calls.append((bucket, key))


class _FailingSession:
    def execute(self, *_args, **_kwargs):
        raise RuntimeError("cassandra unavailable")


class UploadServiceSmokeTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        app.dependency_overrides[require_teacher] = lambda: "teacher1"

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_health_endpoint(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"service": "upload-service", "status": "ok"})

    @patch("app.routes.get_session")
    @patch("app.routes.get_client")
    def test_upload_rolls_back_object_when_metadata_save_fails(self, mock_get_client, mock_get_session):
        fake_minio = _FakeMinioClient()
        mock_get_client.return_value = fake_minio
        mock_get_session.return_value = _FailingSession()

        response = self.client.post(
            "/api/upload/upload",
            data={"course_name": "Algorithmique S3"},
            files={"file": ("notes.pdf", io.BytesIO(b"pdf-bytes"), "application/pdf")},
        )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["detail"], "Failed to persist file metadata")
        self.assertEqual(len(fake_minio.put_calls), 1)
        self.assertEqual(len(fake_minio.remove_calls), 1)


if __name__ == "__main__":
    unittest.main()
