"""
Tasks for the Remediation Planner Agent — built with CrewAI.

Uses crewai.Task to define structured task definitions that are
assigned to the Remediation Planner agent during crew execution.
The planner task receives context from both the analyst and mapper tasks.
"""

from crewai import Agent, Task


def create_planner_task(
    agent: Agent,
    analyst_task: Task,
    mapper_task: Task,
    title: str,
    summary: str,
    obligations: list[str],
    control_gaps: list[str],
    urgency: str,
) -> Task:
    """
    Create a CrewAI Task for remediation planning.

    This task generates a concrete action plan. It receives context
    from both the analyst and mapper tasks to leverage their outputs.

    Args:
        agent: The CrewAI Remediation Planner agent.
        analyst_task: The preceding analyst task (for context).
        mapper_task: The preceding mapper task (for context).
        title: The regulatory item title.
        summary: The regulatory item summary.
        obligations: List of regulatory obligations.
        control_gaps: List of identified control gaps.
        urgency: The urgency level.

    Returns:
        A crewai.Task instance ready for crew execution.
    """
    obligations_text = "\n".join(f"  - {ob}" for ob in obligations)
    gaps_text = (
        "\n".join(f"  - {g}" for g in control_gaps)
        if control_gaps
        else "  - None identified"
    )

    description = f"""Generate a detailed remediation action plan for the following regulatory update.

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

    expected_output = (
        "A valid JSON object containing: recommended_actions (array of objects "
        "with task_id, task_description, priority (P1/P2/P3), suggested_owner "
        "(Legal/Security/IT/HR/Ops), suggested_deadline_days (integer), and "
        "evidence_required (string))."
    )

    return Task(
        description=description,
        expected_output=expected_output,
        agent=agent,
        context=[analyst_task, mapper_task],  # CrewAI context from both prior tasks
    )
