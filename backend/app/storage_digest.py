"""JSON persistence for cached weekly digests and share tokens.

Two files under `backend/.data/`:
  - `digests.json` : {week_start: digest_dict}
  - `shares.json`  : {token: {snapshot, sender_*, reflection, shared_days, ...}}
"""

from __future__ import annotations

import json
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

DATA_DIR = Path(__file__).parent.parent / ".data"
DIGESTS_FILE = DATA_DIR / "digests.json"
SHARES_FILE = DATA_DIR / "shares.json"

SHARE_TTL_DAYS = 30


def _ensure() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not DIGESTS_FILE.exists():
        DIGESTS_FILE.write_text("{}", encoding="utf-8")
    if not SHARES_FILE.exists():
        SHARES_FILE.write_text("{}", encoding="utf-8")


def _read(path: Path) -> dict:
    _ensure()
    return json.loads(path.read_text(encoding="utf-8") or "{}")


def _write(path: Path, data: dict) -> None:
    _ensure()
    path.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")


# ---------- digests ----------

def get_cached_digest(week_start: str) -> Optional[dict]:
    return _read(DIGESTS_FILE).get(week_start)


def save_digest(digest: dict) -> None:
    data = _read(DIGESTS_FILE)
    data[digest["week_start"]] = digest
    _write(DIGESTS_FILE, data)


def invalidate_digest(week_start: str) -> None:
    data = _read(DIGESTS_FILE)
    if week_start in data:
        del data[week_start]
        _write(DIGESTS_FILE, data)


# ---------- shares ----------

def create_share(
    snapshot: dict,
    sender_name: Optional[str] = None,
    sender_note: Optional[str] = None,
    reflection_text: Optional[str] = None,
    shared_days: Optional[list[str]] = None,
) -> dict:
    """Mint a new share token for an immutable snapshot of the digest.

    `reflection_text` is the user's private reflection, included ONLY when the
    caller opted in (and after deny-word screening upstream).
    """
    token = secrets.token_urlsafe(16)
    now = datetime.now(timezone.utc)
    record = {
        "token": token,
        "week_start": snapshot["week_start"],
        "snapshot": snapshot,
        "sender_name": (sender_name or "").strip()[:40] or None,
        "sender_note": (sender_note or "").strip()[:240] or None,
        "reflection": (reflection_text or "").strip()[:1000] or None,
        "shared_days": shared_days,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(days=SHARE_TTL_DAYS)).isoformat(),
        "revoked": False,
    }
    data = _read(SHARES_FILE)
    data[token] = record
    _write(SHARES_FILE, data)
    return record


def get_share(token: str) -> Optional[dict]:
    record = _read(SHARES_FILE).get(token)
    if not record or record.get("revoked"):
        return None
    try:
        expires_at = datetime.fromisoformat(record["expires_at"])
    except Exception:
        return None
    if datetime.now(timezone.utc) > expires_at:
        return None
    return record


def revoke_share(token: str) -> bool:
    data = _read(SHARES_FILE)
    if token not in data:
        return False
    data[token]["revoked"] = True
    _write(SHARES_FILE, data)
    return True
