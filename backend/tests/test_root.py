"""Tests for the root endpoint and app configuration."""

from fastapi.testclient import TestClient


class TestRoot:
    def test_root_returns_app_info(self, client: TestClient):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["app"] == "Pulse"
        assert data["status"] == "running"
