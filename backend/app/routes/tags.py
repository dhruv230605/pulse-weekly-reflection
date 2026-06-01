"""Tags route — returns available tags."""

from fastapi import APIRouter

from ..models.entry import PREDEFINED_TAGS
from ..storage import list_entries

router = APIRouter()


@router.get("/tags")
def get_tags():
    """Return predefined tags + any custom tags found in existing entries."""
    entries = list_entries()
    custom_tags = set()
    for e in entries:
        for tag in e.tags:
            if tag not in PREDEFINED_TAGS:
                custom_tags.add(tag)

    return {
        "predefined": PREDEFINED_TAGS,
        "custom": sorted(custom_tags),
    }
