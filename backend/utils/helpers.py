"""Utility helpers."""

import json
import re
from datetime import datetime
from typing import Any


def safe_json_parse(text: str) -> dict:
    """Try to extract and parse JSON from a string that may contain extra text."""
    text = text.strip()

    # Remove markdown code fences
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Find JSON object
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    return {}


def truncate(text: str, max_len: int = 200) -> str:
    """Truncate a string to max_len, adding ellipsis if needed."""
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."


def iso_now() -> str:
    """Return current UTC time as ISO string."""
    return datetime.utcnow().isoformat()
