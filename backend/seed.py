"""Generate sample entries so the app has meaningful data to display."""

import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

DATA_DIR = Path(__file__).parent / ".data"
ENTRIES_FILE = DATA_DIR / "entries.json"

TAGS = ["sleep", "exercise", "caffeine", "meetings", "commute", "social",
        "outdoors", "deep-work", "lunch", "stress"]

NOTES = [
    "Good start to the day",
    "Long meeting drained me",
    "Morning run helped a lot",
    "Didn't sleep well last night",
    "Great lunch with the team",
    "Feeling focused after coffee",
    "Commute was exhausting today",
    "Productive deep work session",
    "Weekend vibes, feeling relaxed",
    "Stressed about the deadline",
    "Nice walk outside during break",
    "Too many back-to-back meetings",
    "Slept a full 8 hours, feeling great",
    "Skipped exercise, feeling sluggish",
    None,
    None,
    None,
]


def generate_entries(days: int = 30, entries_per_day: tuple = (1, 4)) -> list[dict]:
    entries = []
    now = datetime.now(timezone.utc)

    for day_offset in range(days, 0, -1):
        day = now - timedelta(days=day_offset)
        n_entries = random.randint(*entries_per_day)

        for i in range(n_entries):
            hour = random.choice([8, 9, 10, 12, 13, 14, 15, 17, 18, 20, 21])
            minute = random.randint(0, 59)
            timestamp = day.replace(hour=hour, minute=minute, second=0, microsecond=0)

            # Mood/energy correlations to make data interesting
            base_mood = random.randint(2, 5)
            base_energy = random.randint(3, 9)
            tags = random.sample(TAGS, k=random.randint(1, 4))

            if "exercise" in tags:
                base_mood = min(5, base_mood + 1)
                base_energy = min(10, base_energy + 2)
            if "stress" in tags:
                base_mood = max(1, base_mood - 1)
            if "sleep" in tags and hour < 11:
                base_energy = min(10, base_energy + 1)
            if "meetings" in tags and len([t for t in tags if t == "meetings"]) > 0:
                base_energy = max(1, base_energy - 1)

            entries.append({
                "id": str(uuid4()),
                "mood": base_mood,
                "energy": base_energy,
                "note": random.choice(NOTES),
                "tags": tags,
                "timestamp": timestamp.isoformat(),
            })

    entries.sort(key=lambda e: e["timestamp"])
    return entries


if __name__ == "__main__":
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    entries = generate_entries(days=45, entries_per_day=(1, 3))
    ENTRIES_FILE.write_text(json.dumps(entries, indent=2), encoding="utf-8")
    print(f"Seeded {len(entries)} entries into {ENTRIES_FILE}")
