"""
Normalizer — converts raw scraped items + agent outputs into the
final RegulatoryItem schema and persists to the database.
"""

from datetime import datetime

from backend.models.schemas import (
    AnalystOutput,
    MappingOutput,
    RawScrapedItem,
    RegulatoryItem,
    RemediationOutput,
)


def build_regulatory_item(
    raw: RawScrapedItem,
    analyst: AnalystOutput,
    mapping: MappingOutput,
    remediation: RemediationOutput,
) -> RegulatoryItem:
    """
    Merge the outputs of all 3 agents with the raw scraped data
    into a single RegulatoryItem ready for DB storage and API response.
    """
    return RegulatoryItem(
        source=raw.source,
        source_type=raw.source_type,
        title=analyst.title or raw.title,
        url=raw.url,
        published_at=analyst.published_at or raw.published_at,
        jurisdiction=analyst.jurisdiction or raw.jurisdiction,
        regulatory_topic=analyst.regulatory_topic,
        summary=analyst.summary,
        obligations=analyst.obligations,
        urgency=analyst.urgency,
        relevance_score=analyst.relevance_score,
        affected_controls=mapping.affected_controls,
        control_gaps=mapping.control_gaps,
        recommended_actions=remediation.recommended_actions,
        prediction_signals=analyst.prediction_signals,
        status="new",
        created_at=datetime.utcnow(),
        processed_at=datetime.utcnow(),
    )
