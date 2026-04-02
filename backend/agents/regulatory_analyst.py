"""
Regulatory Analyst Agent — built with the CrewAI framework.

Uses crewai.Agent to define an AI agent that extracts structured
intelligence from raw regulatory content.
"""

from crewai import Agent, LLM


def create_regulatory_analyst(llm: LLM) -> Agent:
    """
    Create and return a CrewAI Agent for regulatory analysis.

    This agent reads raw scraped regulatory content and produces
    structured intelligence including summaries, obligations,
    urgency scoring, relevance scoring, and prediction signals.
    """
    return Agent(
        role="Senior Regulatory Analyst",
        goal=(
            "Read raw scraped regulatory content and produce structured "
            "intelligence including a plain-English summary, key obligations, "
            "urgency scoring, relevance scoring, and forward-looking "
            "prediction signals. Always respond with valid JSON."
        ),
        backstory=(
            "You are a Senior Regulatory Analyst with 15+ years of experience "
            "across global financial regulators (RBI, SEC, SEBI, EU). You have "
            "a gift for distilling dense legal text into clear, actionable "
            "intelligence. You understand how regulatory changes ripple through "
            "organizations and can spot enforcement trends before they materialize."
        ),
        llm=llm,
        verbose=True,
        allow_delegation=False,
        max_iter=3,
    )
