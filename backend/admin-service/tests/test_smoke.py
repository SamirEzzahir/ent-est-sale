import unittest

from fastapi.testclient import TestClient

from app.auth import require_admin
from main import app


class AdminServiceSmokeTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        app.dependency_overrides[require_admin] = lambda: {
            "username": "admin",
            "role": "admin",
        }

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_health_endpoint(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"service": "admin-service", "status": "ok"})

    def test_list_roles_endpoint(self):
        response = self.client.get("/api/admin/roles")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"roles": ["admin", "teacher", "student"]},
        )


if __name__ == "__main__":
    unittest.main()
