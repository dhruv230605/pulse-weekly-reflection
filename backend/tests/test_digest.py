"""Behavior tests for the Weekly Reflection retention features.

Covers the pure digest helpers (week-over-week momentum, adaptive reflection
prompt) and the share-with-reflection opt-in flow through the public API.
"""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.models.entry import Entry
from app.services.digest import (
    compute_week_over_week,
    select_reflection_prompt,
)
from app.services.digest import most_recent_completed_week_start


def _entry(day_offset: int, mood: int, energy: int) -> Entry:
    """Build an Entry `day_offset` days before now, with given mood/energy."""
    ts = datetime.now(timezone.utc) - timedelta(days=day_offset)
    return Entry(
        id=f"e{day_offset}-{mood}-{energy}",
        mood=mood,
        energy=energy,
        tags=[],
        timestamp=ts,
    )


class TestRetentionFeatures:
    def test_wow_none_when_sparse(self):
        assert compute_week_over_week([_entry(0, 3, 6)], [_entry(0, 3, 6)]) is None

    def test_wow_reports_up(self):
        r = compute_week_over_week(
            [_entry(0, 5, 8), _entry(1, 5, 8)],
            [_entry(0, 3, 6), _entry(1, 3, 6)],
        )
        assert r is not None
        assert r["direction"] == "up" and r["delta_pct"] > 0

    def test_wow_frames_down_gently(self):
        r = compute_week_over_week(
            [_entry(0, 2, 4), _entry(1, 2, 4)],
            [_entry(0, 5, 8), _entry(1, 5, 8)],
        )
        assert r is not None
        assert r["direction"] == "down"
        assert "burnout" not in r["phrase"].lower()
        assert "worst" not in r["phrase"].lower()

    def test_prompt_supportive_for_rough_week(self):
        assert "get through" in select_reflection_prompt(2.0, 5).lower()

    def test_prompt_celebrates_bright_week(self):
        assert "carry" in select_reflection_prompt(4.5, 5).lower()

    def test_prompt_sparse_is_encouraging(self):
        assert "win" in select_reflection_prompt(3.0, 1).lower()


def _seed_full_week(client: TestClient) -> str:
    """Seed a full Mon-Sun week of entries in the most recent completed week.

    Returns the week_start (YYYY-MM-DD). Timestamps are patched directly in
    storage so they land inside the target week.
    """
    from app import storage

    week_start = most_recent_completed_week_start()
    for i in range(7):
        resp = client.post(
            "/api/entries", json={"mood": 4, "energy": 7, "tags": ["social"]}
        )
        entry_id = resp.json()["id"]
        day = datetime.combine(
            week_start + timedelta(days=i),
            datetime.min.time(),
            tzinfo=timezone.utc,
        ).replace(hour=12)
        raw = storage._read_all()
        for e in raw:
            if e["id"] == entry_id:
                e["timestamp"] = day.isoformat()
        storage._write_all(raw)
    return str(week_start)


class TestShareReflection:
    def test_share_with_include_reflection_surfaces_it(self, client: TestClient):
        ws = _seed_full_week(client)
        token = client.post(
            f"/api/digest/weekly/share?week_start={ws}",
            json={
                "include_reflection": True,
                "reflection_text": "Short walks helped me.",
            },
        ).json()["token"]
        shared = client.get(f"/api/digest/shared/{token}").json()
        assert "Short walks" in shared["reflection"]

    def test_share_without_opt_in_omits_reflection(self, client: TestClient):
        ws = _seed_full_week(client)
        token = client.post(
            f"/api/digest/weekly/share?week_start={ws}",
            json={"reflection_text": "Not opted in."},
        ).json()["token"]
        shared = client.get(f"/api/digest/shared/{token}").json()
        assert shared.get("reflection") in (None, "")

    def test_share_rejects_deny_word_reflection(self, client: TestClient):
        ws = _seed_full_week(client)
        resp = client.post(
            f"/api/digest/weekly/share?week_start={ws}",
            json={
                "include_reflection": True,
                "reflection_text": "I hit total burnout.",
            },
        )
        assert resp.status_code in (400, 422)

    def test_weekly_digest_includes_streak_and_prompt(self, client: TestClient):
        ws = _seed_full_week(client)
        digest = client.get(f"/api/digest/weekly?week_start={ws}").json()
        assert "streak" in digest
        assert digest["reflection_prompt"]
        assert digest["week_over_week"] is None  # no prior week seeded
