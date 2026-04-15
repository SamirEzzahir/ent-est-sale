import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from main import app


class CoreAuthSmokeTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"service": "core-auth", "status": "ok"})

    @patch("app.routes.validate_keycloak_token")
    def test_validate_token_endpoint(self, mock_validate):
        mock_validate.return_value = {
            "username": "teacher1",
            "role": "teacher",
            "email": "teacher1@est-sale.ma",
        }

        response = self.client.post(
            "/api/auth/token/validate",
            headers={"Authorization": "Bearer sample-token"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "valid": True,
                "username": "teacher1",
                "role": "teacher",
                "email": "teacher1@est-sale.ma",
            },
        )


if __name__ == "__main__":
    unittest.main()
