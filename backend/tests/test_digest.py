"""Behavior tests for the Weekly Reflection retention features.

Covers the pure digest helpers (week-over-week momentum, adaptive reflection
prompt) and the share-with-reflection opt-in flow through the public API.
"""

from datetime import date, datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.models.entry import Entry
from app.services.digest import (
    DENY_WORDS,
    build_digest,
    compute_logging_streak,
    compute_week_over_week,
    contains_unsafe_shared_text,
    most_recent_completed_week_start,
    select_reflection_prompt,
)


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


class TestSensitivityGuardrails:
    """The app stays gentle in its OWN words; the user's own words are theirs."""

    def _rough_week(self) -> dict:
        ws = date(2026, 1, 5)  # a Monday
        entries = []
        for i in range(7):
            ts = datetime.combine(
                ws + timedelta(days=i), datetime.min.time(), tzinfo=timezone.utc
            ).replace(hour=12)
            entries.append(
                Entry(id=f"r{i}", mood=1, energy=2, tags=["work"], timestamp=ts)
            )
        return build_digest(entries, ws)

    def test_rough_week_app_narrative_has_no_deny_word(self):
        digest = self._rough_week()
        assert digest["week_quality"] == "rough"
        narrative = digest["narrative"].lower()
        for word in DENY_WORDS:
            assert word not in narrative, f"app narrative leaked deny-word: {word}"

    def test_user_text_allows_ordinary_emotional_words(self):
        # Words the APP won't say are still fine for a user to say about herself.
        assert contains_unsafe_shared_text("I felt anxious but I should rest") is False
        assert contains_unsafe_shared_text("an honest, rough, burnout-y week") is False

    def test_user_text_word_boundary_not_substring(self):
        # 'skill' must not trip a 'kill'-style match; 'classic' isn't an insult.
        assert contains_unsafe_shared_text("I leveled up a skill this week") is False

    def test_user_text_blocks_abuse(self):
        assert contains_unsafe_shared_text("you are a moron") is True


class TestStreakTimezone:
    def test_streak_counts_against_utc_today(self):
        today = datetime.now(timezone.utc).date()
        entries = [
            Entry(
                id=str(i),
                mood=3,
                energy=5,
                tags=[],
                timestamp=datetime.combine(
                    today - timedelta(days=i),
                    datetime.min.time(),
                    tzinfo=timezone.utc,
                ).replace(hour=12),
            )
            for i in range(3)
        ]
        assert compute_logging_streak(entries, today) == 3


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


def _seed_varied_week(client: TestClient) -> str:
    """Seed a full week whose moods vary, so best_day != worst_day and the
    digest produces a non-null worst_day. Returns the week_start (YYYY-MM-DD)."""
    from app import storage

    week_start = most_recent_completed_week_start()
    moods = [5, 4, 3, 2, 1, 4, 5]
    for i, mood in enumerate(moods):
        entry_id = client.post(
            "/api/entries", json={"mood": mood, "energy": 6, "tags": ["work"]}
        ).json()["id"]
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

    def test_share_allows_ordinary_emotional_reflection(self, client: TestClient):
        """Words the app won't say are still the user's to share about herself."""
        ws = _seed_full_week(client)
        resp = client.post(
            f"/api/digest/weekly/share?week_start={ws}",
            json={
                "include_reflection": True,
                "reflection_text": "I felt anxious but I should rest more next week.",
            },
        )
        assert resp.status_code == 200
        shared = client.get(f"/api/digest/shared/{resp.json()['token']}").json()
        assert "anxious" in shared["reflection"]

    def test_share_rejects_abusive_reflection(self, client: TestClient):
        ws = _seed_full_week(client)
        resp = client.post(
            f"/api/digest/weekly/share?week_start={ws}",
            json={
                "include_reflection": True,
                "reflection_text": "you are a moron",
            },
        )
        assert resp.status_code in (400, 422)

    def test_shared_snapshot_omits_worst_day(self, client: TestClient):
        """Private digest keeps the lowest day; the shared one never does."""
        ws = _seed_varied_week(client)
        private = client.get(f"/api/digest/weekly?week_start={ws}").json()
        assert private["worst_day"] is not None  # author still sees it

        token = client.post(
            f"/api/digest/weekly/share?week_start={ws}", json={}
        ).json()["token"]
        shared = client.get(f"/api/digest/shared/{token}").json()
        assert shared["worst_day"] is None  # recipient never does
        assert shared["best_day"] is not None  # highlights still shared

    def test_weekly_digest_includes_streak_and_prompt(self, client: TestClient):
        ws = _seed_full_week(client)
        digest = client.get(f"/api/digest/weekly?week_start={ws}").json()
        assert "streak" in digest
        assert digest["reflection_prompt"]
        assert digest["week_over_week"] is None  # no prior week seeded
