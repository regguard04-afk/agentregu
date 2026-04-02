"""
CrewAI Pipeline Orchestrator — the core of the multi-agent system.

Uses the REAL CrewAI framework to orchestrate a 3-agent sequential
pipeline for regulatory intelligence processing:

  1. Regulatory Analyst Agent  → structured intelligence
  2. Compliance Mapper Agent   → control mapping (via Bedrock KB)
  3. Remediation Planner Agent → actionable task plans

Each scraped regulatory item is processed by a CrewAI Crew running
in Process.sequential mode, where task outputs chain automatically.

Key CrewAI components used:
  - crewai.Agent      — defines each AI agent with role/goal/backstory
  - crewai.Task       — defines structured tasks with context chaining
  - crewai.Crew       — orchestrates multi-agent collaboration
  - crewai.Process    — sequential execution strategy
  - crewai.LLM        — AWS Bedrock via litellm integration
  - crewai.tools.BaseTool — custom tools (KB retrieval, scraping)
"""

import json
import os
import traceback
from datetime import datetime

from crewai import Agent, Crew, LLM, Process, Task

from backend.agents.compliance_mapper import create_compliance_mapper
from backend.agents.regulatory_analyst import create_regulatory_analyst
from backend.agents.remediation_planner import create_remediation_planner
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
from backend.tasks.analyst_tasks import create_analyst_task
from backend.tasks.mapper_tasks import create_mapper_task
from backend.tasks.planner_tasks import create_planner_task
from backend.tools.kb_retrieval_tool import KBRetrievalTool


# ─── CrewAI LLM Configuration ────────────────────────────────────────
# CrewAI uses LiteLLM under the hood for Bedrock integration.
# The LLM instance is shared across all agents in the crew.


def _create_bedrock_llm() -> LLM:
    """
    Create a CrewAI LLM instance configured for AWS Bedrock.

    CrewAI's LLM class wraps litellm, so we use the 'bedrock/' prefix
    to route requests to Amazon Bedrock. AWS credentials are read
    from environment variables automatically by litellm/boto3.
    """
    model_id = os.getenv("BEDROCK_MODEL_ID", "amazon.nova-pro-v1:0")

    return LLM(
        model=f"bedrock/{model_id}",
        temperature=0.3,
        max_tokens=4096,
    )


# ─── JSON Parsing Helpers ────────────────────────────────────────────


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
    """Parse the analyst agent's CrewAI task output into a structured AnalystOutput."""
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
    """Parse the mapper agent's CrewAI task output into a structured MappingOutput."""
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
    """Parse the planner agent's CrewAI task output into a structured RemediationOutput."""
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


# ─── CrewAI Pipeline Execution ───────────────────────────────────────


def process_single_item(raw_item: RawScrapedItem) -> RegulatoryItem | None:
    """
    Run the full 3-agent CrewAI pipeline on a single scraped item.

    Creates a CrewAI Crew with three agents running in sequential mode:
      1. Regulatory Analyst Agent  → structured intelligence
      2. Compliance Mapper Agent   → control mapping (uses KB tool)
      3. Remediation Planner Agent → action plan

    Returns a fully assembled RegulatoryItem, or None on failure.
    """
    print(f"\n{'='*60}")
    print(f"📋 Processing: {raw_item.title[:80]}")
    print(f"   Source: {raw_item.source} | Jurisdiction: {raw_item.jurisdiction}")
    print(f"{'='*60}\n")

    try:
        # ── Initialize CrewAI LLM (AWS Bedrock) ──────────────────
        llm = _create_bedrock_llm()
        print(f"🤖 CrewAI LLM initialized: {llm.model}")

        # ── Create CrewAI Agents ─────────────────────────────────
        print("🔧 Creating CrewAI agents...")

        analyst_agent = create_regulatory_analyst(llm=llm)
        print(f"   ✅ Agent created: {analyst_agent.role}")

        # Create KB retrieval tool for the mapper agent
        kb_tool = KBRetrievalTool()
        mapper_agent = create_compliance_mapper(llm=llm, tools=[kb_tool])
        print(f"   ✅ Agent created: {mapper_agent.role} (with KB tool)")

        planner_agent = create_remediation_planner(llm=llm)
        print(f"   ✅ Agent created: {planner_agent.role}")

        # ── Pre-fetch KB context for the mapper ──────────────────
        # We also pass KB context directly in the task description
        # as a fallback in case the agent doesn't invoke the tool.
        kb_query = f"{raw_item.title} {raw_item.raw_content[:200]}"
        kb_chunks = retrieve(kb_query, top_k=5)
        kb_context = (
            "\n\n---\n\n".join(kb_chunks) if kb_chunks else "No KB results."
        )

        # ── Create CrewAI Tasks (with context chaining) ──────────
        print("\n📝 Creating CrewAI tasks with sequential context chaining...")

        analyst_task = create_analyst_task(
            agent=analyst_agent,
            raw_item=raw_item,
        )
        print("   ✅ Task 1/3: Regulatory Analysis")

        # We need obligations for the mapper task description.
        # For the first pass, we provide the raw content as context.
        # The mapper will also receive the analyst's output via
        # CrewAI's context chaining (context=[analyst_task]).
        preliminary_obligations = [
            f"Review: {raw_item.raw_content[:200]}"
        ]

        mapper_task = create_mapper_task(
            agent=mapper_agent,
            analyst_task=analyst_task,
            kb_context=kb_context,
            obligations=preliminary_obligations,
            regulatory_topic="Regulatory Compliance",
        )
        print("   ✅ Task 2/3: Compliance Mapping (context → analyst)")

        planner_task = create_planner_task(
            agent=planner_agent,
            analyst_task=analyst_task,
            mapper_task=mapper_task,
            title=raw_item.title,
            summary=raw_item.raw_content[:500],
            obligations=preliminary_obligations,
            control_gaps=[],
            urgency="medium",
        )
        print("   ✅ Task 3/3: Remediation Planning (context → analyst + mapper)")

        # ── Assemble and Execute the CrewAI Crew ─────────────────
        print("\n🚀 Assembling CrewAI Crew (Process.sequential)...")

        crew = Crew(
            agents=[analyst_agent, mapper_agent, planner_agent],
            tasks=[analyst_task, mapper_task, planner_task],
            process=Process.sequential,
            verbose=True,
        )

        print("⚡ Kicking off CrewAI crew execution...")
        print(f"   Agents: {len(crew.agents)}")
        print(f"   Tasks:  {len(crew.tasks)}")
        print(f"   Process: {crew.process}")
        print("-" * 40)

        # crew.kickoff() runs all tasks sequentially through the agents
        crew_output = crew.kickoff()

        print(f"\n{'─'*40}")
        print("✅ CrewAI crew execution complete!")
        print(f"{'─'*40}")

        # ── Parse CrewAI outputs ─────────────────────────────────
        # CrewAI returns a CrewOutput object. We extract task results
        # from each task's output attribute.

        # Get individual task outputs
        analyst_raw = str(analyst_task.output) if analyst_task.output else ""
        mapper_raw = str(mapper_task.output) if mapper_task.output else ""
        planner_raw = str(planner_task.output) if planner_task.output else ""

        # If individual task outputs are empty, use the final crew output
        if not analyst_raw.strip():
            analyst_raw = str(crew_output)
        if not planner_raw.strip():
            planner_raw = str(crew_output)

        # Parse structured outputs
        analyst_output = _parse_analyst_output(analyst_raw, raw_item)
        print(f"   📊 Analyst: urgency={analyst_output.urgency}, "
              f"relevance={analyst_output.relevance_score}")

        mapping_output = _parse_mapping_output(mapper_raw)
        print(f"   🗺️  Mapper: {len(mapping_output.affected_controls)} controls, "
              f"{len(mapping_output.control_gaps)} gaps")

        remediation_output = _parse_remediation_output(planner_raw)
        print(f"   📝 Planner: {len(remediation_output.recommended_actions)} actions")

        # ── Assemble final item ──────────────────────────────────
        item = build_regulatory_item(
            raw_item, analyst_output, mapping_output, remediation_output
        )
        save_item(item)
        print(f"\n💾 Saved: {item.id}")
        return item

    except Exception as e:
        print(f"\n❌ CrewAI pipeline failed for '{raw_item.title[:60]}': {e}")
        traceback.print_exc()
        return None


def run_pipeline(max_items: int = 5) -> list[RegulatoryItem]:
    """
    Full CrewAI pipeline: scrape → deduplicate → process each item
    through the 3-agent CrewAI crew.

    Each regulatory item gets its own CrewAI Crew execution with:
      - 3 agents (Analyst, Mapper, Planner)
      - 3 tasks (with context chaining)
      - Process.sequential execution

    Args:
        max_items: Maximum number of items to process per run (controls cost).

    Returns:
        List of successfully processed RegulatoryItem objects.
    """
    print("\n" + "=" * 60)
    print("🚀 REGULATORY INTELLIGENCE PIPELINE (Powered by CrewAI)")
    print("=" * 60)
    print("   Framework: CrewAI Multi-Agent Orchestration")
    print("   LLM: AWS Bedrock (via crewai.LLM)")
    print("   Process: Sequential (Analyst → Mapper → Planner)")
    print("   Tools: KBRetrievalTool (BaseTool)")
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
    print(f"\n📊 Processing {len(items_to_process)} of {len(unique_items)} new items")
    print(f"   Each item → 1 CrewAI Crew (3 agents, 3 tasks)\n")

    # Step 3: Process each through the CrewAI agent pipeline
    results: list[RegulatoryItem] = []
    for i, raw_item in enumerate(items_to_process, 1):
        print(f"\n{'─'*40}")
        print(f"  CrewAI Crew {i}/{len(items_to_process)}")
        print(f"{'─'*40}")
        result = process_single_item(raw_item)
        if result:
            results.append(result)

    print(f"\n{'='*60}")
    print(f"✅ CREWAI PIPELINE COMPLETE: {len(results)}/{len(items_to_process)} items processed")
    print(f"{'='*60}\n")

    return results
