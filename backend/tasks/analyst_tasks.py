"""
Tasks for the Regulatory Analyst Agent — built with CrewAI.

Uses crewai.Task to define structured task definitions that are
assigned to the Regulatory Analyst agent during crew execution.
"""

from crewai import Agent, Task

from backend.models.schemas import RawScrapedItem


def create_analyst_task(agent: Agent, raw_item: RawScrapedItem) -> Task:
    """
    Create a CrewAI Task for analyzing a single raw regulatory item.

    The task instructs the analyst agent to parse the raw content
    and produce structured intelligence in JSON format.

    Args:
        agent: The CrewAI Regulatory Analyst agent.
        raw_item: The raw scraped regulatory item to analyze.

    Returns:
        A crewai.Task instance ready for crew execution.
    """
    description = f"""Analyze the following regulatory update and produce structured intelligence.

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

    expected_output = (
        "A valid JSON object containing: title, source, url, jurisdiction, "
        "regulatory_topic, published_at, summary, obligations (array), "
        "urgency (critical/high/medium/low), relevance_score (0.0-1.0), "
        "and prediction_signals (array of strings)."
    )

    return Task(
        description=description,
        expected_output=expected_output,
        agent=agent,
    )
