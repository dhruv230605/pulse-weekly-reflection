"""File-based JSON storage for entries.

All data is stored in `.data/entries.json` as a JSON array.
This is intentionally simple — no database, no ORM.
"""

import json
from pathlib import Path
from typing import Optional

from .models.entry import Entry

DATA_DIR = Path(__file__).parent.parent / ".data"
ENTRIES_FILE = DATA_DIR / "entries.json"


def _ensure_data_dir():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not ENTRIES_FILE.exists():
        ENTRIES_FILE.write_text("[]", encoding="utf-8")


def _read_all() -> list[dict]:
    _ensure_data_dir()
    raw = ENTRIES_FILE.read_text(encoding="utf-8")
    return json.loads(raw)


def _write_all(entries: list[dict]):
    _ensure_data_dir()
    ENTRIES_FILE.write_text(
        json.dumps(entries, indent=2, default=str), encoding="utf-8"
    )


def list_entries(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> list[Entry]:
    raw = _read_all()
    entries = [Entry(**e) for e in raw]
    entries.sort(key=lambda e: e.timestamp, reverse=True)

    if start_date:
        entries = [e for e in entries if str(e.timestamp.date()) >= start_date]
    if end_date:
        entries = [e for e in entries if str(e.timestamp.date()) <= end_date]

    return entries


def get_entry(entry_id: str) -> Optional[Entry]:
    raw = _read_all()
    for e in raw:
        if e["id"] == entry_id:
            return Entry(**e)
    return None


def create_entry(entry: Entry) -> Entry:
    raw = _read_all()
    raw.append(entry.model_dump(mode="json"))
    _write_all(raw)
    return entry


def delete_entry(entry_id: str) -> bool:
    raw = _read_all()
    updated = [e for e in raw if e["id"] != entry_id]
    if len(updated) == len(raw):
        return False
    _write_all(updated)
    return True
