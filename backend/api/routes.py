"""API routes for the Regulatory Intelligence Compliance Agent."""

import threading
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from backend.crew import run_pipeline
from backend.database import (
    get_all_items,
    get_item_by_id,
    get_item_count,
    update_item_status,
)
from backend.models.schemas import (
    ChatRequest,
    ChatResponse,
    HealthResponse,
    PipelineRunResponse,
    RegulatoryItem,
    RegulatoryItemListResponse,
    RegulatoryItemResponse,
    StatusLevel,
    StatusUpdateRequest,
)
from backend.services.chat_service import ask

router = APIRouter(tags=["regulatory-intelligence"])


# ─── Health ───────────────────────────────────────────────────────────


@router.get("/health", response_model=HealthResponse)
def health_check():
    """Health check endpoint."""
    return HealthResponse(timestamp=datetime.utcnow())


# ─── Pipeline ─────────────────────────────────────────────────────────

# Track pipeline status
_pipeline_status = {"running": False, "last_run": None, "last_result": None}


@router.post("/pipeline/run", response_model=PipelineRunResponse)
def trigger_pipeline(
    max_items: int = Query(default=5, ge=1, le=20, description="Max items to process"),
):
    """
    Trigger the full regulatory intelligence pipeline:
    scrape → analyze → map → plan.

    This runs synchronously and may take several minutes depending on
    the number of items and LLM response times.
    """
    if _pipeline_status["running"]:
        raise HTTPException(
            status_code=409, detail="Pipeline is already running."
        )

    _pipeline_status["running"] = True
    try:
        results = run_pipeline(max_items=max_items)
        _pipeline_status["last_run"] = datetime.utcnow().isoformat()
        _pipeline_status["last_result"] = f"{len(results)} items processed"

        return PipelineRunResponse(
            message=f"Pipeline completed. {len(results)} items processed.",
            items_processed=len(results),
            items=results,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")
    finally:
        _pipeline_status["running"] = False


@router.post("/pipeline/run-async")
def trigger_pipeline_async(
    max_items: int = Query(default=5, ge=1, le=20),
):
    """
    Trigger the pipeline in a background thread.
    Returns immediately with a 202 Accepted.
    """
    if _pipeline_status["running"]:
        raise HTTPException(
            status_code=409, detail="Pipeline is already running."
        )

    def _run():
        _pipeline_status["running"] = True
        try:
            results = run_pipeline(max_items=max_items)
            _pipeline_status["last_run"] = datetime.utcnow().isoformat()
            _pipeline_status["last_result"] = f"{len(results)} items processed"
        except Exception as e:
            _pipeline_status["last_result"] = f"Error: {str(e)}"
        finally:
            _pipeline_status["running"] = False

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()

    return {
        "success": True,
        "message": "Pipeline started in background.",
        "status_url": "/api/pipeline/status",
    }


@router.get("/pipeline/status")
def pipeline_status():
    """Check the current pipeline status."""
    return {
        "running": _pipeline_status["running"],
        "last_run": _pipeline_status["last_run"],
        "last_result": _pipeline_status["last_result"],
    }


# ─── Regulatory Items CRUD ───────────────────────────────────────────


@router.get("/items", response_model=RegulatoryItemListResponse)
def list_items(
    status: Optional[str] = Query(default=None, description="Filter by status"),
    jurisdiction: Optional[str] = Query(default=None, description="Filter by jurisdiction"),
    urgency: Optional[str] = Query(default=None, description="Filter by urgency"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    """List all regulatory items with optional filters."""
    items = get_all_items(
        status=status,
        jurisdiction=jurisdiction,
        urgency=urgency,
        limit=limit,
        offset=offset,
    )
    return RegulatoryItemListResponse(count=len(items), data=items)


@router.get("/items/{item_id}", response_model=RegulatoryItemResponse)
def get_item(item_id: str):
    """Get a single regulatory item by ID."""
    item = get_item_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Item {item_id} not found.")
    return RegulatoryItemResponse(data=item)


@router.patch("/items/{item_id}/status", response_model=RegulatoryItemResponse)
def update_status(item_id: str, body: StatusUpdateRequest):
    """Update the status of a regulatory item."""
    item = update_item_status(item_id, body.status)
    if not item:
        raise HTTPException(status_code=404, detail=f"Item {item_id} not found.")
    return RegulatoryItemResponse(data=item)


@router.get("/stats")
def get_stats():
    """Get summary statistics about regulatory items."""
    all_items = get_all_items(limit=10000)
    total = len(all_items)

    by_status = {}
    by_urgency = {}
    by_jurisdiction = {}
    by_source = {}

    for item in all_items:
        status = item.status.value if hasattr(item.status, "value") else item.status
        by_status[status] = by_status.get(status, 0) + 1

        urgency = item.urgency.value if hasattr(item.urgency, "value") else item.urgency
        by_urgency[urgency] = by_urgency.get(urgency, 0) + 1

        by_jurisdiction[item.jurisdiction] = by_jurisdiction.get(item.jurisdiction, 0) + 1
        by_source[item.source] = by_source.get(item.source, 0) + 1

    total_gaps = sum(len(item.control_gaps) for item in all_items)
    total_actions = sum(len(item.recommended_actions) for item in all_items)

    return {
        "total_items": total,
        "by_status": by_status,
        "by_urgency": by_urgency,
        "by_jurisdiction": by_jurisdiction,
        "by_source": by_source,
        "total_control_gaps": total_gaps,
        "total_recommended_actions": total_actions,
    }


# ─── Chat ─────────────────────────────────────────────────────────────


@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(body: ChatRequest):
    """
    Ask a question about compliance policies using the Knowledge Base.
    Uses Bedrock RetrieveAndGenerate for RAG-powered answers.
    """
    result = ask(body.question)
    return ChatResponse(
        question=body.question,
        answer=result["answer"],
        sources=result["sources"],
    )


# ─── Frontend-compatible aliases ──────────────────────────────────────
# The frontend calls these paths — they map to our existing logic.


@router.get("/updates")
def get_updates():
    """Alias for /items — used by the frontend."""
    items = get_all_items(limit=100)
    return {
        "success": True,
        "count": len(items),
        "data": [item.model_dump(mode="json") for item in items],
    }


@router.get("/updates/urgent")
def get_urgent_updates():
    """Return only critical and high urgency items."""
    critical = get_all_items(urgency="critical", limit=100)
    high = get_all_items(urgency="high", limit=100)
    items = critical + high
    return {
        "success": True,
        "count": len(items),
        "data": [item.model_dump(mode="json") for item in items],
    }


@router.get("/updates/jurisdiction/{jurisdiction_name}")
def get_by_jurisdiction(jurisdiction_name: str):
    """Filter updates by jurisdiction."""
    items = get_all_items(jurisdiction=jurisdiction_name, limit=100)
    return {
        "success": True,
        "count": len(items),
        "data": [item.model_dump(mode="json") for item in items],
    }


@router.get("/updates/{update_id}")
def get_update_by_id(update_id: str):
    """Alias for /items/{id} — used by the frontend."""
    item = get_item_by_id(update_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Update {update_id} not found.")
    return {"success": True, "data": item.model_dump(mode="json")}


@router.get("/status")
def get_pipeline_status_alias():
    """Alias for /pipeline/status — used by the frontend."""
    return {
        "running": _pipeline_status["running"],
        "last_run": _pipeline_status["last_run"],
        "last_result": _pipeline_status["last_result"],
        "status": "running" if _pipeline_status["running"] else "idle",
    }


@router.get("/controls")
def get_controls():
    """Return all unique controls found across processed items."""
    items = get_all_items(limit=1000)
    controls_map: dict = {}
    for item in items:
        for ctrl in item.affected_controls:
            key = ctrl.control_id
            if key not in controls_map:
                controls_map[key] = {
                    "control_id": ctrl.control_id,
                    "control_name": ctrl.control_name,
                    "policy_name": ctrl.policy_name,
                    "affected_items": 0,
                }
            controls_map[key]["affected_items"] += 1
    return {
        "success": True,
        "count": len(controls_map),
        "data": list(controls_map.values()),
    }


@router.post("/analyze")
def trigger_analysis():
    """Alias for /pipeline/run — used by the frontend 'Run Analysis' button."""
    if _pipeline_status["running"]:
        raise HTTPException(status_code=409, detail="Pipeline is already running.")

    def _run():
        _pipeline_status["running"] = True
        try:
            results = run_pipeline(max_items=8)
            _pipeline_status["last_run"] = datetime.utcnow().isoformat()
            _pipeline_status["last_result"] = f"{len(results)} items processed"
        except Exception as e:
            _pipeline_status["last_result"] = f"Error: {str(e)}"
        finally:
            _pipeline_status["running"] = False

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()

    return {
        "success": True,
        "message": "Analysis pipeline started.",
        "status": "running",
    }

