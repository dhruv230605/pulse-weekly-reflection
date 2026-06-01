"""Tests for tags endpoint."""

from fastapi.testclient import TestClient

from app.models.entry import PREDEFINED_TAGS


class TestTags:
    def test_returns_predefined_tags(self, client: TestClient):
        resp = client.get("/api/tags")
        assert resp.status_code == 200
        data = resp.json()
        assert data["predefined"] == PREDEFINED_TAGS
        assert data["custom"] == []

    def test_returns_custom_tags_from_entries(self, client: TestClient):
        client.post(
            "/api/entries",
            json={"mood": 3, "energy": 5, "tags": ["exercise", "my-custom-tag"]},
        )
        resp = client.get("/api/tags")
        data = resp.json()
        assert "my-custom-tag" in data["custom"]
        assert "exercise" not in data["custom"]  # predefined, not custom

    def test_custom_tags_sorted(self, client: TestClient):
        client.post("/api/entries", json={"mood": 3, "energy": 5, "tags": ["zzz-tag"]})
        client.post("/api/entries", json={"mood": 3, "energy": 5, "tags": ["aaa-tag"]})
        resp = client.get("/api/tags")
        custom = resp.json()["custom"]
        assert custom == sorted(custom)
