"""Pydantic models for the Regulatory Intelligence Compliance Agent."""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class UrgencyLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class StatusLevel(str, Enum):
    NEW = "new"
    IN_REVIEW = "in_review"
    ACTIONED = "actioned"
    CLOSED = "closed"


class PriorityLevel(str, Enum):
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"


class SuggestedOwner(str, Enum):
    LEGAL = "Legal"
    SECURITY = "Security"
    IT = "IT"
    HR = "HR"
    OPS = "Ops"


class AffectedControl(BaseModel):
    control_id: str
    control_name: str
    policy_name: str


class RecommendedAction(BaseModel):
    task_id: str = Field(default_factory=lambda: str(uuid4())[:8])
    task_description: str
    priority: PriorityLevel
    suggested_owner: SuggestedOwner
    suggested_deadline_days: int
    evidence_required: str


class RegulatoryItem(BaseModel):
    """Full schema for a processed regulatory update."""

    id: str = Field(default_factory=lambda: str(uuid4()))
    source: str = Field(..., description="RBI / SEC / GDPR / SEBI / MCA etc.")
    source_type: str = Field(..., description="rss or website")
    title: str
    url: str
    published_at: Optional[datetime] = None
    jurisdiction: str = Field(..., description="India / EU / USA / Global")
    regulatory_topic: str = Field(
        ..., description="Data Privacy / Cybersecurity / AML etc."
    )
    summary: str
    obligations: list[str] = Field(default_factory=list)
    urgency: UrgencyLevel = UrgencyLevel.MEDIUM
    relevance_score: float = Field(default=0.5, ge=0.0, le=1.0)
    affected_controls: list[AffectedControl] = Field(default_factory=list)
    control_gaps: list[str] = Field(default_factory=list)
    recommended_actions: list[RecommendedAction] = Field(default_factory=list)
    prediction_signals: list[str] = Field(default_factory=list)
    status: StatusLevel = StatusLevel.NEW
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None


class RawScrapedItem(BaseModel):
    """Schema for a raw scraped regulatory item before agent processing."""

    source: str
    source_type: str
    title: str
    url: str
    published_at: Optional[datetime] = None
    raw_content: str = ""
    jurisdiction: str = ""


class AnalystOutput(BaseModel):
    """Output from the Regulatory Analyst Agent."""

    title: str
    source: str
    url: str
    jurisdiction: str
    regulatory_topic: str
    published_at: Optional[datetime] = None
    summary: str
    obligations: list[str] = Field(default_factory=list)
    urgency: UrgencyLevel = UrgencyLevel.MEDIUM
    relevance_score: float = 0.5
    prediction_signals: list[str] = Field(default_factory=list)


class MappingOutput(BaseModel):
    """Output from the Compliance Mapping Agent."""

    affected_controls: list[AffectedControl] = Field(default_factory=list)
    control_gaps: list[str] = Field(default_factory=list)


class RemediationOutput(BaseModel):
    """Output from the Remediation Planner Agent."""

    recommended_actions: list[RecommendedAction] = Field(default_factory=list)


# ─── API Response Models ──────────────────────────────────────────────


class RegulatoryItemResponse(BaseModel):
    """API response wrapper for a single item."""

    success: bool = True
    data: RegulatoryItem


class RegulatoryItemListResponse(BaseModel):
    """API response wrapper for a list of items."""

    success: bool = True
    count: int
    data: list[RegulatoryItem]


class PipelineRunResponse(BaseModel):
    """Response after triggering the pipeline."""

    success: bool = True
    message: str
    items_processed: int
    items: list[RegulatoryItem] = Field(default_factory=list)


class ChatRequest(BaseModel):
    """Request body for the chat endpoint."""

    question: str


class ChatResponse(BaseModel):
    """Response from the chat endpoint."""

    success: bool = True
    question: str
    answer: str
    sources: list[str] = Field(default_factory=list)


class StatusUpdateRequest(BaseModel):
    """Request to update the status of a regulatory item."""

    status: StatusLevel


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "healthy"
    version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
