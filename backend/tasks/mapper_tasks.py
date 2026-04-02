"""
Tasks for the Compliance Mapping Agent — built with CrewAI.

Uses crewai.Task to define structured task definitions that are
assigned to the Compliance Mapper agent during crew execution.
The mapper task receives context from the analyst task output.
"""

from crewai import Agent, Task


def create_mapper_task(
    agent: Agent,
    analyst_task: Task,
    kb_context: str,
    obligations: list[str],
    regulatory_topic: str,
) -> Task:
    """
    Create a CrewAI Task for compliance mapping.

    This task maps regulatory obligations to internal controls using
    the Knowledge Base context. It receives context from the analyst
    task to chain outputs sequentially.

    Args:
        agent: The CrewAI Compliance Mapper agent.
        analyst_task: The preceding analyst task (for context chaining).
        kb_context: Retrieved Knowledge Base text chunks.
        obligations: List of regulatory obligations from the analyst.
        regulatory_topic: The regulatory topic category.

    Returns:
        A crewai.Task instance ready for crew execution.
    """
    obligations_text = "\n".join(
        f"  {i + 1}. {ob}" for i, ob in enumerate(obligations)
    )

    description = f"""Map the following regulatory obligations to internal compliance controls.

## Regulatory Obligations

{obligations_text}

## Regulatory Topic
{regulatory_topic}

## Internal Controls Knowledge Base Context

The following are relevant excerpts from our internal compliance control documents:

{kb_context}

## Required Output

Produce a JSON object with EXACTLY these fields:

{{
  "affected_controls": [
    {{
      "control_id": "<e.g., AC-001>",
      "control_name": "<e.g., Access Control Policy>",
      "policy_name": "<e.g., access_control_policy.md>"
    }}
  ],
  "control_gaps": [
    "<obligation or area NOT covered by any existing control>"
  ]
}}

## Instructions

1. For each obligation, find the most relevant internal control from the KB context.
2. If an obligation is clearly covered by an existing control, add that control to affected_controls.
3. If an obligation has NO matching internal control, add it to control_gaps.
4. Use realistic control IDs based on the policy names (e.g., AC-001 for access control, DR-001 for data retention, IR-001 for incident response, VR-001 for vendor risk, DP-001 for data privacy, AL-001 for audit logging, ES-001 for employee security).
5. Be specific about which policy document the control comes from.

Return ONLY the JSON object, no markdown fences, no extra text."""

    expected_output = (
        "A valid JSON object containing: affected_controls (array of objects "
        "with control_id, control_name, policy_name) and control_gaps "
        "(array of strings describing uncovered obligations)."
    )

    return Task(
        description=description,
        expected_output=expected_output,
        agent=agent,
        context=[analyst_task],  # CrewAI sequential context chaining
    )
