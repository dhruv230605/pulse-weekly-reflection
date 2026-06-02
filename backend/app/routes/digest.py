"""Weekly digest + sharing routes.

- GET    /api/digest/weekly            → the weekly reflection digest
- POST   /api/digest/weekly/share      → mint a read-only share link
- GET    /api/digest/shared/{token}    → public, read-only snapshot
- DELETE /api/digest/share/{token}     → revoke a share
"""

from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel

from .. import storage_digest
from ..services.digest import (
    build_digest,
    compute_logging_streak,
    compute_week_over_week,
    most_recent_completed_week_start,
)
from ..services.digest import contains_unsafe_shared_text  # noqa: E402
from ..storage import list_entries

router = APIRouter()


def _week_entries(week_start: date):
    week_end = week_start + timedelta(days=6)
    return list_entries(start_date=str(week_start), end_date=str(week_end))


def _parse_week_start(week_start: Optional[str]) -> date:
    if not week_start:
        return most_recent_completed_week_start()
    try:
        return date.fromisoformat(week_start)
    except ValueError:
        raise HTTPException(status_code=400, detail="week_start must be YYYY-MM-DD")


@router.get("/digest/weekly")
def weekly_digest(week_start: Optional[str] = Query(None, description="YYYY-MM-DD")):
    """Build the digest for a week (defaults to the most recent completed week),
    enriched with the logging streak and week-over-week momentum."""
    ws = _parse_week_start(week_start)
    week_entries = _week_entries(ws)
    digest = build_digest(week_entries, ws)

    # Retention enrichments.
    last_week_start = ws - timedelta(days=7)
    last_week_entries = _week_entries(last_week_start)
    all_entries = list_entries()

    digest["week_over_week"] = compute_week_over_week(week_entries, last_week_entries)
    digest["streak"] = compute_logging_streak(
        all_entries, datetime.now(timezone.utc).date()
    )
    return digest


class ShareRequest(BaseModel):
    sender_name: Optional[str] = None
    sender_note: Optional[str] = None
    include_reflection: bool = False
    reflection_text: Optional[str] = None


@router.post("/digest/weekly/share")
def create_weekly_share(
    week_start: Optional[str] = Query(None, description="YYYY-MM-DD"),
    include_days: Optional[str] = Query(
        None, description="Comma-separated YYYY-MM-DD days to include"
    ),
    body: Optional[ShareRequest] = None,
):
    body = body or ShareRequest()
    ws = _parse_week_start(week_start)
    week_entries = _week_entries(ws)

    full = build_digest(week_entries, ws)
    if not full["shareable"]:
        raise HTTPException(
            status_code=400,
            detail="This week doesn't have enough entries to share yet.",
        )

    # Optional partial share: restrict to specific days within the week.
    shared_days: Optional[list[str]] = None
    snapshot = full
    if include_days:
        valid_days = {str(ws + timedelta(days=i)) for i in range(7)}
        requested = [d.strip() for d in include_days.split(",") if d.strip()]
        unknown = [d for d in requested if d not in valid_days]
        if unknown:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown days for this week: {', '.join(unknown)}",
            )
        shared_days = sorted(requested)
        filtered = [e for e in week_entries if str(e.timestamp.date()) in shared_days]
        snapshot = build_digest(filtered, ws)

    # Screen any sender note for abusive language (recipient safety guardrail).
    if body.sender_note and contains_unsafe_shared_text(body.sender_note):
        raise HTTPException(
            status_code=400,
            detail="That note has wording we can't include — try rephrasing.",
        )

    # Private reflection is shared ONLY when explicitly opted in, and screened
    # for abusive language (the user's own feelings are otherwise theirs to share).
    reflection_to_store: Optional[str] = None
    if body.include_reflection and (body.reflection_text or "").strip():
        if contains_unsafe_shared_text(body.reflection_text or ""):
            raise HTTPException(
                status_code=400,
                detail="That reflection has wording we can't include — try rephrasing.",
            )
        reflection_to_store = (body.reflection_text or "").strip()

    # Shared digests carry only affirming highlights — never the lowest day.
    snapshot = {**snapshot, "worst_day": None}

    record = storage_digest.create_share(
        snapshot,
        sender_name=body.sender_name,
        sender_note=body.sender_note,
        reflection_text=reflection_to_store,
        shared_days=shared_days,
    )
    return {"token": record["token"], "url": f"/shared/{record['token']}"}


@router.get("/digest/shared/{token}")
def get_shared_digest(token: str, response: Response):
    record = storage_digest.get_share(token)
    if not record:
        raise HTTPException(status_code=404, detail="Share not found or expired.")

    response.headers["x-robots-tag"] = "noindex, nofollow"

    snapshot = dict(record["snapshot"])
    snapshot.pop("narrative_source", None)
    snapshot.pop("generated_at", None)
    # Defense in depth: never surface a lowest day in a shared view, even for
    # snapshots minted before worst_day was stripped at share time.
    snapshot["worst_day"] = None
    snapshot.update(
        {
            "sender_name": record.get("sender_name"),
            "sender_note": record.get("sender_note"),
            "reflection": record.get("reflection"),
            "shared_days": record.get("shared_days"),
            "shared_at": record.get("created_at"),
            "expires_at": record.get("expires_at"),
        }
    )
    return snapshot


@router.delete("/digest/share/{token}", status_code=204)
def revoke_weekly_share(token: str):
    if not storage_digest.revoke_share(token):
        raise HTTPException(status_code=404, detail="Share not found.")
