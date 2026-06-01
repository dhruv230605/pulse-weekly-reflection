"""CRUD routes for mood/energy entries."""

from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query

from ..models.entry import Entry, EntryCreate
from ..storage import create_entry, delete_entry, get_entry, list_entries

router = APIRouter()


@router.post("/entries", response_model=Entry, status_code=201)
def create(body: EntryCreate):
    entry = Entry(
        id=str(uuid4()),
        mood=body.mood,
        energy=body.energy,
        note=body.note,
        tags=body.tags,
        timestamp=datetime.now(timezone.utc),
    )
    return create_entry(entry)


@router.get("/entries", response_model=list[Entry])
def list_all(
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
):
    return list_entries(start_date=start_date, end_date=end_date)


@router.get("/entries/{entry_id}", response_model=Entry)
def get_one(entry_id: str):
    entry = get_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@router.delete("/entries/{entry_id}", status_code=204)
def delete_one(entry_id: str):
    if not delete_entry(entry_id):
        raise HTTPException(status_code=404, detail="Entry not found")
