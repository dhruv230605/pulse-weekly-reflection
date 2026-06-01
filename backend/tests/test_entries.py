"""Tests for entry CRUD endpoints."""

import pytest
from fastapi.testclient import TestClient


class TestCreateEntry:
    def test_create_valid_entry(self, client: TestClient):
        resp = client.post("/api/entries", json={"mood": 3, "energy": 5, "tags": []})
        assert resp.status_code == 201
        data = resp.json()
        assert data["mood"] == 3
        assert data["energy"] == 5
        assert data["tags"] == []
        assert "id" in data
        assert "timestamp" in data

    def test_create_entry_with_note_and_tags(self, client: TestClient):
        resp = client.post(
            "/api/entries",
            json={"mood": 5, "energy": 9, "note": "Feeling great!", "tags": ["exercise", "outdoors"]},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["note"] == "Feeling great!"
        assert data["tags"] == ["exercise", "outdoors"]

    def test_create_entry_mood_out_of_range(self, client: TestClient):
        resp = client.post("/api/entries", json={"mood": 0, "energy": 5, "tags": []})
        assert resp.status_code == 422

        resp = client.post("/api/entries", json={"mood": 6, "energy": 5, "tags": []})
        assert resp.status_code == 422

    def test_create_entry_energy_out_of_range(self, client: TestClient):
        resp = client.post("/api/entries", json={"mood": 3, "energy": 0, "tags": []})
        assert resp.status_code == 422

        resp = client.post("/api/entries", json={"mood": 3, "energy": 11, "tags": []})
        assert resp.status_code == 422

    def test_create_entry_note_too_long(self, client: TestClient):
        resp = client.post(
            "/api/entries",
            json={"mood": 3, "energy": 5, "note": "x" * 501, "tags": []},
        )
        assert resp.status_code == 422

    def test_create_entry_missing_required_fields(self, client: TestClient):
        resp = client.post("/api/entries", json={})
        assert resp.status_code == 422


class TestListEntries:
    def test_list_empty(self, client: TestClient):
        resp = client.get("/api/entries")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_returns_created_entries(self, client: TestClient, seed_entry: dict):
        resp = client.get("/api/entries")
        assert resp.status_code == 200
        entries = resp.json()
        assert len(entries) == 1
        assert entries[0]["id"] == seed_entry["id"]

    def test_list_sorted_descending_by_timestamp(self, client: TestClient):
        client.post("/api/entries", json={"mood": 1, "energy": 1, "tags": []})
        client.post("/api/entries", json={"mood": 5, "energy": 10, "tags": []})
        resp = client.get("/api/entries")
        entries = resp.json()
        assert len(entries) == 2
        # Most recent first
        assert entries[0]["timestamp"] >= entries[1]["timestamp"]

    def test_list_with_date_filter(self, client: TestClient, seed_entry: dict):
        today = seed_entry["timestamp"][:10]
        resp = client.get(f"/api/entries?start_date={today}&end_date={today}")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1


class TestGetEntry:
    def test_get_existing_entry(self, client: TestClient, seed_entry: dict):
        resp = client.get(f"/api/entries/{seed_entry['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == seed_entry["id"]
        assert resp.json()["mood"] == seed_entry["mood"]

    def test_get_nonexistent_entry(self, client: TestClient):
        resp = client.get("/api/entries/nonexistent-id")
        assert resp.status_code == 404


class TestDeleteEntry:
    def test_delete_existing_entry(self, client: TestClient, seed_entry: dict):
        resp = client.delete(f"/api/entries/{seed_entry['id']}")
        assert resp.status_code == 204

        # Verify it's gone
        resp = client.get(f"/api/entries/{seed_entry['id']}")
        assert resp.status_code == 404

    def test_delete_nonexistent_entry(self, client: TestClient):
        resp = client.delete("/api/entries/nonexistent-id")
        assert resp.status_code == 404
