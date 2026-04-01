"""Tasks for the Regulatory Analyst Agent."""

from backend.agents.regulatory_analyst import SYSTEM_PROMPT
from backend.models.schemas import RawScrapedItem
from backend.services.bedrock_service import invoke_llm


def run_analyst_task(raw_item: RawScrapedItem) -> str:
    """
    Run the analysis task for a single raw regulatory item.
    Returns the raw LLM response (JSON string).
    """
    user_prompt = f"""Analyze the following regulatory update and produce structured intelligence.

## Raw Regulatory Content

- **Source**: {raw_item.source}
- **Title**: {raw_item.title}
- **URL**: {raw_item.url}
- **Jurisdiction**: {raw_item.jurisdiction}
- **Published**: {raw_item.published_at or 'Unknown'}
- **Content**: {raw_item.raw_content[:1500]}

## Required Output

Produce a JSON object with EXACTLY these fields:

{{
  "title": "<clean title of the regulation>",
  "source": "{raw_item.source}",
  "url": "{raw_item.url}",
  "jurisdiction": "<one of: India, EU, USA, Global>",
  "regulatory_topic": "<one of: Data Privacy, Cybersecurity, AML, KYC, Financial Reporting, Corporate Governance, Consumer Protection, Risk Management, Capital Markets, Banking Regulation, Other>",
  "published_at": "<ISO datetime or null>",
  "summary": "<3-5 line plain-English summary of what this regulation does and why it matters>",
  "obligations": ["<obligation 1>", "<obligation 2>", ...],
  "urgency": "<one of: critical, high, medium, low>",
  "relevance_score": <float 0.0-1.0>,
  "prediction_signals": ["<signal 1>", "<signal 2>", ...]
}}

## Scoring Guidelines

- **urgency**: critical = immediate enforcement/fines risk; high = 30-day action needed; medium = 90-day horizon; low = informational
- **relevance_score**: 1.0 = directly impacts our operations; 0.0 = no relevance
- **prediction_signals**: 2-4 forward-looking signals about enforcement trends, upcoming regulatory actions, or industry-wide implications
- **obligations**: List specific things organizations must DO or STOP doing

Return ONLY the JSON object, no markdown fences, no extra text."""

    return invoke_llm(SYSTEM_PROMPT, user_prompt)
