"""Shared fixtures for backend tests."""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app import storage
from app import storage_digest


@pytest.fixture(autouse=True)
def _isolated_storage(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    """Redirect storage to a temp directory so tests don't touch real data."""
    data_dir = tmp_path / ".data"
    entries_file = data_dir / "entries.json"
    monkeypatch.setattr(storage, "DATA_DIR", data_dir)
    monkeypatch.setattr(storage, "ENTRIES_FILE", entries_file)
    # Isolate digest/share persistence too (separate files under the same temp).
    monkeypatch.setattr(storage_digest, "DATA_DIR", data_dir)
    monkeypatch.setattr(storage_digest, "DIGESTS_FILE", data_dir / "digests.json")
    monkeypatch.setattr(storage_digest, "SHARES_FILE", data_dir / "shares.json")


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def seed_entry(client: TestClient):
    """Helper: create one entry and return the response JSON."""
    payload = {"mood": 4, "energy": 7, "note": "Good day", "tags": ["exercise", "outdoors"]}
    resp = client.post("/api/entries", json=payload)
    assert resp.status_code == 201
    return resp.json()
