"""Stats routes — daily averages, weekly averages, heatmap data."""

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter

from ..storage import list_entries

router = APIRouter()


@router.get("/stats/daily")
def daily_stats():
    """Daily mood & energy averages for the last 14 days."""
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=13)
    entries = list_entries(start_date=str(start))

    by_day: dict[str, list] = defaultdict(list)
    for e in entries:
        day = str(e.timestamp.date())
        by_day[day].append(e)

    result = []
    for i in range(14):
        day = str(start + timedelta(days=i))
        day_entries = by_day.get(day, [])
        result.append(
            {
                "date": day,
                "avg_mood": (
                    round(sum(e.mood for e in day_entries) / len(day_entries), 1)
                    if day_entries
                    else None
                ),
                "avg_energy": (
                    round(sum(e.energy for e in day_entries) / len(day_entries), 1)
                    if day_entries
                    else None
                ),
                "count": len(day_entries),
            }
        )
    return result


@router.get("/stats/weekly")
def weekly_stats():
    """Weekly mood & energy averages for the last 8 weeks."""
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(weeks=8)
    entries = list_entries(start_date=str(start))

    by_week: dict[str, list] = defaultdict(list)
    for e in entries:
        week_start = e.timestamp.date() - timedelta(days=e.timestamp.weekday())
        by_week[str(week_start)].append(e)

    result = []
    for i in range(8):
        week_start = start + timedelta(weeks=i) - timedelta(
            days=(start + timedelta(weeks=i)).weekday()
        )
        key = str(week_start)
        week_entries = by_week.get(key, [])
        result.append(
            {
                "week_start": key,
                "avg_mood": (
                    round(sum(e.mood for e in week_entries) / len(week_entries), 1)
                    if week_entries
                    else None
                ),
                "avg_energy": (
                    round(sum(e.energy for e in week_entries) / len(week_entries), 1)
                    if week_entries
                    else None
                ),
                "count": len(week_entries),
            }
        )
    return result


@router.get("/stats/heatmap")
def heatmap_data():
    """Calendar heatmap data — average mood per day for the last 90 days."""
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=89)
    entries = list_entries(start_date=str(start))

    by_day: dict[str, list] = defaultdict(list)
    for e in entries:
        day = str(e.timestamp.date())
        by_day[day].append(e)

    result = []
    for i in range(90):
        day = str(start + timedelta(days=i))
        day_entries = by_day.get(day, [])
        avg_mood = (
            round(sum(e.mood for e in day_entries) / len(day_entries), 1)
            if day_entries
            else None
        )
        result.append({"date": day, "avg_mood": avg_mood, "count": len(day_entries)})
    return result
