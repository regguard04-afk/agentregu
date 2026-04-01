"""
Pipeline orchestrator — runs the 3-agent sequential pipeline
on each scraped regulatory item.

Uses litellm for Bedrock LLM calls (same lib CrewAI uses internally).
The three agents run sequentially: Analyst → Mapper → Planner.
"""

import json
import traceback
from datetime import datetime

from backend.database import save_item, url_exists
from backend.models.schemas import (
    AffectedControl,
    AnalystOutput,
    MappingOutput,
    RawScrapedItem,
    RecommendedAction,
    RegulatoryItem,
    RemediationOutput,
)
from backend.services.kb_service import retrieve
from backend.services.normalizer import build_regulatory_item
from backend.services.scraper import deduplicate, scrape_all_sources
from backend.tasks.analyst_tasks import run_analyst_task
from backend.tasks.mapper_tasks import run_mapper_task
from backend.tasks.planner_tasks import run_planner_task


def _safe_parse_json(raw_output: str) -> dict:
    """Attempt to extract and parse JSON from agent output."""
    text = raw_output.strip()

    # Remove markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to find JSON object in text
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass

    # Try to find JSON array
    start = text.find("[")
    end = text.rfind("]") + 1
    if start != -1 and end > start:
        try:
            return {"items": json.loads(text[start:end])}
        except json.JSONDecodeError:
            pass

    return {}


def _parse_analyst_output(raw_output: str, raw_item: RawScrapedItem) -> AnalystOutput:
    """Parse the analyst agent's output into a structured AnalystOutput."""
    data = _safe_parse_json(raw_output)

    return AnalystOutput(
        title=data.get("title", raw_item.title),
        source=data.get("source", raw_item.source),
        url=data.get("url", raw_item.url),
        jurisdiction=data.get("jurisdiction", raw_item.jurisdiction),
        regulatory_topic=data.get("regulatory_topic", "Other"),
        published_at=raw_item.published_at,
        summary=data.get("summary", raw_item.raw_content[:500]),
        obligations=data.get("obligations", []),
        urgency=data.get("urgency", "medium"),
        relevance_score=float(data.get("relevance_score", 0.5)),
        prediction_signals=data.get("prediction_signals", []),
    )


def _parse_mapping_output(raw_output: str) -> MappingOutput:
    """Parse the mapper agent's output into a structured MappingOutput."""
    data = _safe_parse_json(raw_output)

    affected = []
    for ctrl in data.get("affected_controls", []):
        if isinstance(ctrl, dict):
            affected.append(
                AffectedControl(
                    control_id=ctrl.get("control_id", "UNKNOWN"),
                    control_name=ctrl.get("control_name", "Unknown Control"),
                    policy_name=ctrl.get("policy_name", "unknown_policy.md"),
                )
            )

    return MappingOutput(
        affected_controls=affected,
        control_gaps=data.get("control_gaps", []),
    )


def _parse_remediation_output(raw_output: str) -> RemediationOutput:
    """Parse the planner agent's output into a structured RemediationOutput."""
    data = _safe_parse_json(raw_output)

    actions = []
    for act in data.get("recommended_actions", []):
        if isinstance(act, dict):
            actions.append(
                RecommendedAction(
                    task_id=act.get("task_id", "T000"),
                    task_description=act.get("task_description", "Review and assess"),
                    priority=act.get("priority", "P2"),
                    suggested_owner=act.get("suggested_owner", "Legal"),
                    suggested_deadline_days=int(
                        act.get("suggested_deadline_days", 30)
                    ),
                    evidence_required=act.get(
                        "evidence_required", "Documentation required"
                    ),
                )
            )

    return RemediationOutput(recommended_actions=actions)


def process_single_item(raw_item: RawScrapedItem) -> RegulatoryItem | None:
    """
    Run the full 3-agent pipeline on a single scraped item.

    1. Regulatory Analyst → structured intelligence
    2. Compliance Mapper → control mapping (uses KB)
    3. Remediation Planner → action plan

    Returns a fully assembled RegulatoryItem, or None on failure.
    """
    print(f"\n{'='*60}")
    print(f"📋 Processing: {raw_item.title[:80]}")
    print(f"   Source: {raw_item.source} | Jurisdiction: {raw_item.jurisdiction}")
    print(f"{'='*60}\n")

    try:
        # ── Step 1: Regulatory Analyst ────────────────────────────
        print("🔬 Step 1/3: Regulatory Analyst...")
        analyst_raw = run_analyst_task(raw_item)
        analyst_output = _parse_analyst_output(analyst_raw, raw_item)
        print(f"   ✅ Analyst done — urgency={analyst_output.urgency}, "
              f"relevance={analyst_output.relevance_score}")

        # ── Step 2: Compliance Mapper (with KB retrieval) ─────────
        print("\n🗺️  Step 2/3: Compliance Mapper...")

        # Query the Knowledge Base for relevant controls
        kb_query = (
            f"{analyst_output.regulatory_topic} "
            f"{' '.join(analyst_output.obligations[:3])}"
        )
        kb_chunks = retrieve(kb_query, top_k=5)
        kb_context = "\n\n---\n\n".join(kb_chunks) if kb_chunks else "No KB results."

        mapper_raw = run_mapper_task(
            analyst_output.obligations,
            kb_context,
            analyst_output.regulatory_topic,
        )
        mapping_output = _parse_mapping_output(mapper_raw)
        print(f"   ✅ Mapper done — {len(mapping_output.affected_controls)} controls, "
              f"{len(mapping_output.control_gaps)} gaps")

        # ── Step 3: Remediation Planner ───────────────────────────
        print("\n📝 Step 3/3: Remediation Planner...")
        planner_raw = run_planner_task(
            analyst_output.title,
            analyst_output.summary,
            analyst_output.obligations,
            mapping_output.control_gaps,
            analyst_output.urgency,
        )
        remediation_output = _parse_remediation_output(planner_raw)
        print(f"   ✅ Planner done — {len(remediation_output.recommended_actions)} actions")

        # ── Assemble final item ───────────────────────────────────
        item = build_regulatory_item(
            raw_item, analyst_output, mapping_output, remediation_output
        )
        save_item(item)
        print(f"\n💾 Saved: {item.id}")
        return item

    except Exception as e:
        print(f"\n❌ Pipeline failed for '{raw_item.title[:60]}': {e}")
        traceback.print_exc()
        return None


def run_pipeline(max_items: int = 5) -> list[RegulatoryItem]:
    """
    Full pipeline: scrape → deduplicate → process each item through 3 agents.

    Args:
        max_items: Maximum number of items to process per run (controls cost).

    Returns:
        List of successfully processed RegulatoryItem objects.
    """
    print("\n" + "=" * 60)
    print("🚀 REGULATORY INTELLIGENCE PIPELINE")
    print("=" * 60)

    # Step 1: Scrape
    raw_items = scrape_all_sources()

    if not raw_items:
        print("⚠️  No items scraped. Check your internet connection and source URLs.")
        return []

    # Step 2: Deduplicate
    from backend.database import init_db, get_all_items

    init_db()
    existing_urls = set()
    for existing in get_all_items(limit=1000):
        existing_urls.add(existing.url)

    unique_items = deduplicate(raw_items, existing_urls)

    if not unique_items:
        print("✅ All items already processed. Nothing new to do.")
        return []

    # Limit processing
    items_to_process = unique_items[:max_items]
    print(f"\n📊 Processing {len(items_to_process)} of {len(unique_items)} new items\n")

    # Step 3: Process each through the agent pipeline
    results: list[RegulatoryItem] = []
    for i, raw_item in enumerate(items_to_process, 1):
        print(f"\n{'─'*40}")
        print(f"  Item {i}/{len(items_to_process)}")
        print(f"{'─'*40}")
        result = process_single_item(raw_item)
        if result:
            results.append(result)

    print(f"\n{'='*60}")
    print(f"✅ PIPELINE COMPLETE: {len(results)}/{len(items_to_process)} items processed")
    print(f"{'='*60}\n")

    return results
