"""SQLite persistence layer for regulatory items."""

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional

from backend.models.schemas import (
    AffectedControl,
    RecommendedAction,
    RegulatoryItem,
    StatusLevel,
)

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "compliance.db"


def _get_conn() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def init_db() -> None:
    """Create the regulatory_items table if it doesn't exist."""
    conn = _get_conn()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS regulatory_items (
            id                TEXT PRIMARY KEY,
            source            TEXT NOT NULL,
            source_type       TEXT NOT NULL,
            title             TEXT NOT NULL,
            url               TEXT NOT NULL,
            published_at      TEXT,
            jurisdiction      TEXT NOT NULL,
            regulatory_topic  TEXT NOT NULL,
            summary           TEXT NOT NULL,
            obligations       TEXT NOT NULL DEFAULT '[]',
            urgency           TEXT NOT NULL DEFAULT 'medium',
            relevance_score   REAL NOT NULL DEFAULT 0.5,
            affected_controls TEXT NOT NULL DEFAULT '[]',
            control_gaps      TEXT NOT NULL DEFAULT '[]',
            recommended_actions TEXT NOT NULL DEFAULT '[]',
            prediction_signals TEXT NOT NULL DEFAULT '[]',
            status            TEXT NOT NULL DEFAULT 'new',
            created_at        TEXT NOT NULL,
            processed_at      TEXT
        );
        """
    )
    conn.commit()
    conn.close()


def _serialize_item(item: RegulatoryItem) -> dict:
    """Convert a RegulatoryItem to a dict suitable for SQLite insertion."""
    return {
        "id": item.id,
        "source": item.source,
        "source_type": item.source_type,
        "title": item.title,
        "url": item.url,
        "published_at": item.published_at.isoformat() if item.published_at else None,
        "jurisdiction": item.jurisdiction,
        "regulatory_topic": item.regulatory_topic,
        "summary": item.summary,
        "obligations": json.dumps(item.obligations),
        "urgency": item.urgency.value,
        "relevance_score": item.relevance_score,
        "affected_controls": json.dumps(
            [c.model_dump() for c in item.affected_controls]
        ),
        "control_gaps": json.dumps(item.control_gaps),
        "recommended_actions": json.dumps(
            [a.model_dump() for a in item.recommended_actions]
        ),
        "prediction_signals": json.dumps(item.prediction_signals),
        "status": item.status.value,
        "created_at": item.created_at.isoformat(),
        "processed_at": item.processed_at.isoformat() if item.processed_at else None,
    }


def _deserialize_row(row: sqlite3.Row) -> RegulatoryItem:
    """Convert a SQLite row back to a RegulatoryItem."""
    d = dict(row)
    return RegulatoryItem(
        id=d["id"],
        source=d["source"],
        source_type=d["source_type"],
        title=d["title"],
        url=d["url"],
        published_at=datetime.fromisoformat(d["published_at"])
        if d["published_at"]
        else None,
        jurisdiction=d["jurisdiction"],
        regulatory_topic=d["regulatory_topic"],
        summary=d["summary"],
        obligations=json.loads(d["obligations"]),
        urgency=d["urgency"],
        relevance_score=d["relevance_score"],
        affected_controls=[
            AffectedControl(**c) for c in json.loads(d["affected_controls"])
        ],
        control_gaps=json.loads(d["control_gaps"]),
        recommended_actions=[
            RecommendedAction(**a) for a in json.loads(d["recommended_actions"])
        ],
        prediction_signals=json.loads(d["prediction_signals"]),
        status=d["status"],
        created_at=datetime.fromisoformat(d["created_at"]),
        processed_at=datetime.fromisoformat(d["processed_at"])
        if d["processed_at"]
        else None,
    )


def save_item(item: RegulatoryItem) -> None:
    conn = _get_conn()
    data = _serialize_item(item)
    cols = ", ".join(data.keys())
    placeholders = ", ".join(["?"] * len(data))
    conn.execute(
        f"INSERT OR REPLACE INTO regulatory_items ({cols}) VALUES ({placeholders})",
        list(data.values()),
    )
    conn.commit()
    conn.close()


def get_all_items(
    status: Optional[str] = None,
    jurisdiction: Optional[str] = None,
    urgency: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> list[RegulatoryItem]:
    conn = _get_conn()
    query = "SELECT * FROM regulatory_items WHERE 1=1"
    params: list = []

    if status:
        query += " AND status = ?"
        params.append(status)
    if jurisdiction:
        query += " AND jurisdiction = ?"
        params.append(jurisdiction)
    if urgency:
        query += " AND urgency = ?"
        params.append(urgency)

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [_deserialize_row(r) for r in rows]


def get_item_by_id(item_id: str) -> Optional[RegulatoryItem]:
    conn = _get_conn()
    row = conn.execute(
        "SELECT * FROM regulatory_items WHERE id = ?", (item_id,)
    ).fetchone()
    conn.close()
    return _deserialize_row(row) if row else None


def update_item_status(item_id: str, status: StatusLevel) -> Optional[RegulatoryItem]:
    conn = _get_conn()
    conn.execute(
        "UPDATE regulatory_items SET status = ? WHERE id = ?",
        (status.value, item_id),
    )
    conn.commit()
    conn.close()
    return get_item_by_id(item_id)


def url_exists(url: str) -> bool:
    """Check if a URL is already in the database (dedup)."""
    conn = _get_conn()
    row = conn.execute(
        "SELECT 1 FROM regulatory_items WHERE url = ? LIMIT 1", (url,)
    ).fetchone()
    conn.close()
    return row is not None


def get_item_count() -> int:
    conn = _get_conn()
    row = conn.execute("SELECT COUNT(*) as cnt FROM regulatory_items").fetchone()
    conn.close()
    return row["cnt"] if row else 0
