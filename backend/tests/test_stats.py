"""Tests for stats endpoints."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient


def _create_entry_on_date(client: TestClient, mood: int, energy: int, date: datetime):
    """Create an entry and patch its timestamp in storage to a specific date."""
    from app import storage

    resp = client.post("/api/entries", json={"mood": mood, "energy": energy, "tags": []})
    entry_id = resp.json()["id"]
    # Patch the timestamp in the stored data
    raw = storage._read_all()
    for e in raw:
        if e["id"] == entry_id:
            e["timestamp"] = date.isoformat()
    storage._write_all(raw)


class TestDailyStats:
    def test_daily_returns_14_days(self, client: TestClient):
        resp = client.get("/api/stats/daily")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 14

    def test_daily_empty_days_have_null_averages(self, client: TestClient):
        resp = client.get("/api/stats/daily")
        data = resp.json()
        for day in data:
            assert day["avg_mood"] is None
            assert day["avg_energy"] is None
            assert day["count"] == 0

    def test_daily_with_entry_today(self, client: TestClient):
        client.post("/api/entries", json={"mood": 4, "energy": 8, "tags": []})
        resp = client.get("/api/stats/daily")
        data = resp.json()
        today_str = str(datetime.now(timezone.utc).date())
        today_stat = next(d for d in data if d["date"] == today_str)
        assert today_stat["avg_mood"] == 4.0
        assert today_stat["avg_energy"] == 8.0
        assert today_stat["count"] == 1

    def test_daily_averages_multiple_entries_same_day(self, client: TestClient):
        client.post("/api/entries", json={"mood": 2, "energy": 4, "tags": []})
        client.post("/api/entries", json={"mood": 4, "energy": 8, "tags": []})
        resp = client.get("/api/stats/daily")
        data = resp.json()
        today_str = str(datetime.now(timezone.utc).date())
        today_stat = next(d for d in data if d["date"] == today_str)
        assert today_stat["avg_mood"] == 3.0
        assert today_stat["avg_energy"] == 6.0
        assert today_stat["count"] == 2


class TestWeeklyStats:
    def test_weekly_returns_8_weeks(self, client: TestClient):
        resp = client.get("/api/stats/weekly")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 8

    def test_weekly_empty_weeks_have_null_averages(self, client: TestClient):
        resp = client.get("/api/stats/weekly")
        data = resp.json()
        for week in data:
            assert week["avg_mood"] is None
            assert week["avg_energy"] is None
            assert week["count"] == 0


class TestHeatmap:
    def test_heatmap_returns_90_days(self, client: TestClient):
        resp = client.get("/api/stats/heatmap")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 90

    def test_heatmap_with_entry_today(self, client: TestClient):
        client.post("/api/entries", json={"mood": 5, "energy": 9, "tags": []})
        resp = client.get("/api/stats/heatmap")
        data = resp.json()
        today_str = str(datetime.now(timezone.utc).date())
        today_data = next(d for d in data if d["date"] == today_str)
        assert today_data["avg_mood"] == 5.0
        assert today_data["count"] == 1
