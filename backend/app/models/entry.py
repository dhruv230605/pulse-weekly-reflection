"""Pydantic models for mood/energy entries."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


PREDEFINED_TAGS = [
    "sleep",
    "exercise",
    "caffeine",
    "meetings",
    "commute",
    "social",
    "outdoors",
    "deep-work",
    "lunch",
    "stress",
]

MOOD_EMOJIS = {1: "😢", 2: "😕", 3: "😐", 4: "🙂", 5: "😄"}


class EntryCreate(BaseModel):
    mood: int = Field(..., ge=1, le=5, description="Mood level 1-5 (emoji scale)")
    energy: int = Field(..., ge=1, le=10, description="Energy level 1-10")
    note: Optional[str] = Field(None, max_length=500, description="Optional free-text note")
    tags: list[str] = Field(default_factory=list, description="Tags for this entry")


class Entry(BaseModel):
    id: str
    mood: int
    energy: int
    note: Optional[str] = None
    tags: list[str] = []
    timestamp: datetime

    @property
    def mood_emoji(self) -> str:
        return MOOD_EMOJIS.get(self.mood, "😐")
