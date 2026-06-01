"""Weekly digest computation — pure functions (no I/O, no LLM).

Given a list of `Entry` objects scoped to a single Mon-Sun week, produce
the structured digest dict the frontend renders. Also contains the
retention helpers (week-over-week momentum, logging streak, adaptive
reflection prompt) layered on top per the Weekly Reflection brief.
"""

from collections import Counter
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from ..models.entry import Entry

# Words we refuse to emit in any narrative — applies to templates AND user text.
DENY_WORDS = {
    "burnout",
    "burnt out",
    "depression",
    "depressed",
    "anxiety",
    "anxious",
    "concerning",
    "concerned",
    "worst",
    "terrible",
    "awful",
    "should",
    "must",
    "ought to",
}

REFLECTION_PROMPT = "What would you do differently next week?"

WEEKDAY_NAMES = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]


# Tone-safe per-day comments keyed by mood band. Gentle for low moods, warm
# for high, no clinical words, no prescriptive advice. {wd} = weekday name.
_DAY_COMMENTS_BY_MOOD: dict[int, str] = {
    1: "{wd} asked a lot of you. You still showed up to log it — that matters.",
    2: "{wd} sat a little heavy. Be gentle with yourself.",
    3: "{wd} held a steady, even tone.",
    4: "{wd} carried a quiet warmth.",
    5: "{wd} felt bright and full.",
}
_NO_DATA_COMMENT = "Quiet on {wd} — no entry logged."

_ENERGY_RIDER_HIGH = " With a surprising spark of energy."
_ENERGY_RIDER_LOW = " On quieter footing energy-wise."


def _energy_rider(avg_mood: float, avg_energy: Optional[float]) -> str:
    if avg_energy is None:
        return ""
    if 2.5 <= avg_mood <= 4.0:
        if avg_energy >= 8:
            return _ENERGY_RIDER_HIGH
        if avg_energy <= 3:
            return _ENERGY_RIDER_LOW
    return ""


def _comment_for_day(
    weekday: str,
    avg_mood: Optional[float],
    avg_energy: Optional[float] = None,
) -> str:
    if avg_mood is None:
        return _NO_DATA_COMMENT.format(wd=weekday)
    band = max(1, min(5, round(avg_mood)))
    base = _DAY_COMMENTS_BY_MOOD[band].format(wd=weekday)
    return base + _energy_rider(avg_mood, avg_energy)


def monday_of(d: date) -> date:
    """Return the Monday of the ISO week containing `d`."""
    return d - timedelta(days=d.weekday())


def current_week_start() -> date:
    """Monday of the current UTC week."""
    return monday_of(datetime.now(timezone.utc).date())


def most_recent_completed_week_start() -> date:
    """Monday of the most recently *completed* Mon-Sun week."""
    return current_week_start() - timedelta(days=7)


def _bucket_for(count: int) -> str:
    if count == 0:
        return "empty"
    if count <= 2:
        return "sparse"
    if count <= 6:
        return "partial"
    return "full"


def _trend_slope(daily_moods: list[tuple[int, float]]) -> Optional[float]:
    """Simple least-squares slope of mood vs day-index. None if <3 points."""
    if len(daily_moods) < 3:
        return None
    n = len(daily_moods)
    sum_x = sum(x for x, _ in daily_moods)
    sum_y = sum(y for _, y in daily_moods)
    sum_xy = sum(x * y for x, y in daily_moods)
    sum_xx = sum(x * x for x, _ in daily_moods)
    denom = n * sum_xx - sum_x * sum_x
    if denom == 0:
        return None
    slope = (n * sum_xy - sum_x * sum_y) / denom
    return round(slope, 3)


def _trend_label(slope: Optional[float]) -> Optional[str]:
    if slope is None:
        return None
    if slope >= 0.15:
        return "improving"
    if slope <= -0.15:
        return "declining"
    return "flat"


def _classify_quality(avg_mood: Optional[float], trend: Optional[str]) -> str:
    if avg_mood is None:
        return "mixed"
    if avg_mood < 2.5 or (trend == "declining" and avg_mood < 3.0):
        return "rough"
    if avg_mood > 4.0 and trend != "declining":
        return "great"
    return "mixed"


def _contains_deny_word(text: str) -> bool:
    lower = (text or "").lower()
    return any(w in lower for w in DENY_WORDS)


def _scrub(text: str) -> str:
    """Remove any deny-word occurrence, conservatively."""
    for w in DENY_WORDS:
        text = text.replace(w, "").replace(w.capitalize(), "")
    return " ".join(text.split())


def _render_template_narrative(facts: dict) -> str:
    """Deterministic, tone-safe narrative. Always succeeds."""
    bucket = facts["bucket"]
    n = facts["entry_count"]

    if bucket == "empty":
        return (
            "No entries this week. When you're ready, log how you're feeling — "
            "even one quick check-in helps you start to notice patterns."
        )

    if bucket == "sparse":
        days = facts.get("day_breakdown", []) or []
        logged_days = [d for d in days if d.get("avg_mood") is not None]
        bright = (
            max(logged_days, key=lambda d: d["avg_mood"]) if logged_days else None
        )
        unit = "check-in" if n == 1 else "check-ins"
        window = "a small window" if n == 1 else "two small windows"
        parts = [f"{n} {unit} this week — {window} into how you're doing."]
        if bright:
            wd = bright["weekday"]
            m = bright["avg_mood"]
            if m >= 4:
                parts.append(f"{wd} carried a quiet warmth (mood {m}).")
            elif m >= 3:
                parts.append(f"{wd} held a steady, even tone (mood {m}).")
            else:
                parts.append(f"You still showed up to log it on {wd} — that matters.")
        parts.append("We'll have a richer picture next week.")
        return _scrub(" ".join(parts))

    quality = facts["week_quality"]
    best = facts["best_day"]
    trend = facts["stats"]["mood_trend"]
    top_tag = facts["top_tags"][0]["tag"] if facts["top_tags"] else None
    signal = facts.get("highlight_signal", "mood")

    parts: list[str] = []
    if quality == "great":
        parts.append(f"This week landed in a good place — {n} entries logged.")
        if best:
            if signal == "energy":
                parts.append(
                    f"{best['weekday']} carried the most energy "
                    f"(energy {best['avg_energy']}, mood {best['avg_mood']})."
                )
            else:
                parts.append(
                    f"{best['weekday']} was your brightest day "
                    f"(mood {best['avg_mood']}, energy {best['avg_energy']})."
                )
        if trend == "improving":
            parts.append("Your mood trended upward across the week.")
        elif trend == "flat":
            parts.append("Mood stayed steady throughout.")
        if top_tag:
            parts.append(f"`{top_tag}` came up most often.")
    elif quality == "rough":
        parts.append(
            "This week had its weight. You still showed up and logged "
            f"{n} times — that matters."
        )
        if best:
            if signal == "energy":
                parts.append(
                    f"{best['weekday']} brought a little more energy "
                    f"(energy {best['avg_energy']})."
                )
            else:
                parts.append(
                    f"{best['weekday']} was a brighter spot (mood {best['avg_mood']})."
                )
        if trend == "improving":
            parts.append("There's an upward shift toward the end of the week.")
        parts.append("A fresh week is just ahead.")
    else:  # mixed
        parts.append(f"A mixed week — {n} entries across the days.")
        if best:
            if signal == "energy":
                parts.append(
                    f"{best['weekday']} brought the most energy this week "
                    f"(energy {best['avg_energy']})."
                )
            else:
                parts.append(
                    f"{best['weekday']} stood out as your best day "
                    f"(mood {best['avg_mood']})."
                )
        if trend == "improving":
            parts.append("The overall direction is upward.")
        elif trend == "flat" and signal != "energy":
            parts.append("Mood held fairly steady.")
        if top_tag:
            parts.append(f"`{top_tag}` was your most frequent tag.")

    return _scrub(" ".join(parts))


# --------------------------------------------------------------------------
# Retention helpers (Weekly Reflection brief)
# --------------------------------------------------------------------------

def compute_week_over_week(
    this_week: list[Entry], last_week: list[Entry]
) -> Optional[dict]:
    """Compare this week's avg mood to last week's. Returns None if either week
    has < 2 entries (too sparse to compare fairly). Framed gently."""
    if len(this_week) < 2 or len(last_week) < 2:
        return None
    this_avg = sum(e.mood for e in this_week) / len(this_week)
    last_avg = sum(e.mood for e in last_week) / len(last_week)
    delta = this_avg - last_avg
    pct = round((delta / last_avg) * 100) if last_avg else 0
    if abs(delta) < 0.25:
        direction = "flat"
        phrase = "About the same as last week — steady is good."
    elif delta > 0:
        direction = "up"
        phrase = f"Up {pct}% from last week. Nice momentum."
    else:
        direction = "down"
        phrase = "A gentler week than last — that's okay."
    return {
        "direction": direction,
        "delta_pct": pct,
        "phrase": phrase,
        "this_avg": round(this_avg, 1),
        "last_avg": round(last_avg, 1),
    }


def compute_logging_streak(all_entries: list[Entry], today: date) -> int:
    """Count consecutive days (ending today, with a one-day grace for
    yesterday) on which the user logged at least once."""
    logged = {e.timestamp.date() for e in all_entries}
    cursor = today if today in logged else today - timedelta(days=1)
    streak = 0
    while cursor in logged:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def select_reflection_prompt(avg_mood: Optional[float], entry_count: int) -> str:
    """Pick a prompt matched to the week's quality. Never ask someone who had a
    hard week 'what would you do differently?'."""
    if entry_count < 2 or avg_mood is None:
        return (
            "Even a couple of check-ins is a win. "
            "What pulled your attention this week?"
        )
    if avg_mood >= 4.0:
        return (
            "This was a bright week. What's one thing you want to carry "
            "into next week?"
        )
    if avg_mood <= 2.3:
        return "This week asked a lot of you. What helped you get through it?"
    return "Looking back, what's one small thing that made a difference?"


def build_digest(entries: list[Entry], week_start: date) -> dict:
    """Build the full digest dict for one Mon-Sun week.

    `entries` should already be filtered to the week (the route does this).
    Always returns a complete, frontend-ready dict — even for empty weeks.
    """
    week_end = week_start + timedelta(days=6)
    n = len(entries)
    bucket = _bucket_for(n)

    # ----- Aggregate by day -----
    by_day: dict[date, list[Entry]] = {}
    for e in entries:
        by_day.setdefault(e.timestamp.date(), []).append(e)

    day_avg_mood: dict[date, float] = {
        d: round(sum(x.mood for x in es) / len(es), 1) for d, es in by_day.items()
    }
    day_avg_energy: dict[date, float] = {
        d: round(sum(x.energy for x in es) / len(es), 1) for d, es in by_day.items()
    }

    # ----- Stats -----
    avg_mood = round(sum(e.mood for e in entries) / n, 1) if n else None
    avg_energy = round(sum(e.energy for e in entries) / n, 1) if n else None

    if bucket in ("partial", "full"):
        sorted_days = sorted(day_avg_mood.items())
        slope = _trend_slope([(i, m) for i, (_, m) in enumerate(sorted_days)])
        trend = _trend_label(slope)
    else:
        slope = None
        trend = None

    # ----- Best / worst day -----
    best_day = None
    worst_day = None
    highlight_signal = "mood"
    if bucket in ("partial", "full") and day_avg_mood:
        mood_vals = list(day_avg_mood.values())
        energy_vals = list(day_avg_energy.values())
        mood_range = max(mood_vals) - min(mood_vals) if mood_vals else 0
        energy_range = max(energy_vals) - min(energy_vals) if energy_vals else 0
        if mood_range <= 1.0 and energy_range >= 3.0:
            highlight_signal = "energy"
            ranker = day_avg_energy
        else:
            ranker = day_avg_mood

        best_d = max(ranker, key=lambda d: ranker[d])
        worst_d = min(ranker, key=lambda d: ranker[d])
        if best_d != worst_d:
            best_day = {
                "date": str(best_d),
                "weekday": WEEKDAY_NAMES[best_d.weekday()],
                "avg_mood": day_avg_mood[best_d],
                "avg_energy": day_avg_energy[best_d],
            }
            worst_day = {
                "date": str(worst_d),
                "weekday": WEEKDAY_NAMES[worst_d.weekday()],
                "avg_mood": day_avg_mood[worst_d],
                "avg_energy": day_avg_energy[worst_d],
            }

    # ----- Top tags (max 3) -----
    tag_counts: Counter[str] = Counter()
    for e in entries:
        tag_counts.update(e.tags)
    top_tags = [{"tag": t, "count": c} for t, c in tag_counts.most_common(3)]

    # ----- Day-by-day breakdown (always 7 entries, Mon-Sun) -----
    day_breakdown: list[dict] = []
    for offset in range(7):
        d = week_start + timedelta(days=offset)
        weekday = WEEKDAY_NAMES[d.weekday()]
        avg_m = day_avg_mood.get(d)
        avg_e = day_avg_energy.get(d)
        day_tag_counts: Counter[str] = Counter()
        for ent in by_day.get(d, []):
            day_tag_counts.update(ent.tags)
        day_top_tags = [
            {"tag": t, "count": c} for t, c in day_tag_counts.most_common(2)
        ]
        day_breakdown.append(
            {
                "date": str(d),
                "weekday": weekday,
                "avg_mood": avg_m,
                "avg_energy": avg_e,
                "entry_count": len(by_day.get(d, [])),
                "top_tags": day_top_tags,
                "comment": _comment_for_day(weekday, avg_m, avg_e),
            }
        )

    week_quality = _classify_quality(avg_mood, trend)

    facts = {
        "week_start": str(week_start),
        "week_end": str(week_end),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "entry_count": n,
        "bucket": bucket,
        "week_quality": week_quality,
        "stats": {
            "avg_mood": avg_mood,
            "avg_energy": avg_energy,
            "mood_trend": trend,
            "trend_slope": slope,
        },
        "best_day": best_day,
        "worst_day": worst_day,
        "highlight_signal": highlight_signal,
        "top_tags": top_tags,
        "day_breakdown": day_breakdown,
        # Adaptive, sensitive prompt (handles sparse + rough + bright weeks).
        "reflection_prompt": select_reflection_prompt(avg_mood, n),
        "shareable": bucket in ("partial", "full"),
    }

    facts["narrative"] = _render_template_narrative(facts)
    facts["narrative_source"] = "template"
    return facts


def safe_narrative(text: str) -> bool:
    """True when text is non-empty and free of deny words."""
    return not _contains_deny_word(text) and len(text.strip()) > 0
