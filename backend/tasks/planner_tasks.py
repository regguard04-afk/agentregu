"""Tasks for the Remediation Planner Agent."""

from backend.agents.remediation_planner import SYSTEM_PROMPT
from backend.services.bedrock_service import invoke_llm


def run_planner_task(
    title: str,
    summary: str,
    obligations: list[str],
    control_gaps: list[str],
    urgency: str,
) -> str:
    """
    Run the remediation planning task.
    Returns the raw LLM response (JSON string).
    """
    obligations_text = "\n".join(f"  - {ob}" for ob in obligations)
    gaps_text = (
        "\n".join(f"  - {g}" for g in control_gaps)
        if control_gaps
        else "  - None identified"
    )

    user_prompt = f"""Generate a detailed remediation action plan for the following regulatory update.

## Regulatory Update
- **Title**: {title}
- **Summary**: {summary}
- **Urgency**: {urgency}

## Key Obligations
{obligations_text}

## Control Gaps (areas with no existing coverage)
{gaps_text}

## Required Output

Produce a JSON object with EXACTLY this structure:

{{
  "recommended_actions": [
    {{
      "task_id": "<short unique ID like T001>",
      "task_description": "<specific actionable task>",
      "priority": "<P1 or P2 or P3>",
      "suggested_owner": "<one of: Legal, Security, IT, HR, Ops>",
      "suggested_deadline_days": <integer>,
      "evidence_required": "<what documentation/proof is needed>"
    }}
  ]
}}

## Task Generation Guidelines

1. Generate 3-7 specific, actionable tasks
2. **P1** tasks: Must be done within 7-14 days (critical compliance gaps, legal exposure)
3. **P2** tasks: Must be done within 30-60 days (policy updates, process changes)
4. **P3** tasks: Can be done within 60-90 days (training, documentation, optimization)
5. Assign each task to the most appropriate owner:
   - **Legal**: Policy drafting, regulatory filings, legal interpretations
   - **Security**: Technical controls, access management, monitoring
   - **IT**: System changes, tool deployments, integrations
   - **HR**: Training, awareness programs, role assignments
   - **Ops**: Process changes, operational procedures, vendor management
6. **suggested_deadline_days**: Days from NOW to complete the task
7. **evidence_required**: Specific documents, screenshots, logs, sign-offs, or audit trails needed

Prioritize control gaps — these are the highest risk areas.

Return ONLY the JSON object, no markdown fences, no extra text."""

    return invoke_llm(SYSTEM_PROMPT, user_prompt)
