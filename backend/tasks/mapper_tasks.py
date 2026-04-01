"""Tasks for the Compliance Mapping Agent."""

from backend.agents.compliance_mapper import SYSTEM_PROMPT
from backend.services.bedrock_service import invoke_llm


def run_mapper_task(
    obligations: list[str],
    kb_context: str,
    regulatory_topic: str,
) -> str:
    """
    Run the compliance mapping task.
    Returns the raw LLM response (JSON string).
    """
    obligations_text = "\n".join(f"  {i+1}. {ob}" for i, ob in enumerate(obligations))

    user_prompt = f"""Map the following regulatory obligations to internal compliance controls.

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

    return invoke_llm(SYSTEM_PROMPT, user_prompt)
