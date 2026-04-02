"""
Compliance Mapping Agent — built with the CrewAI framework.

Uses crewai.Agent to define an AI agent that maps regulatory
obligations to internal compliance controls using the Bedrock
Knowledge Base.
"""

from crewai import Agent, LLM


def create_compliance_mapper(llm: LLM, tools: list | None = None) -> Agent:
    """
    Create and return a CrewAI Agent for compliance mapping.

    This agent maps regulatory obligations to the organization's
    internal compliance controls using the Knowledge Base context
    and identifies coverage gaps.

    Args:
        llm: A crewai.LLM instance (Bedrock via litellm).
        tools: Optional list of CrewAI tools (e.g., KBRetrievalTool).
    """
    return Agent(
        role="GRC Compliance Mapper",
        goal=(
            "Map regulatory obligations to the organization's internal "
            "compliance controls using the provided Knowledge Base context. "
            "Identify which existing controls are affected and flag any gaps "
            "where obligations are not covered. Always respond with valid JSON."
        ),
        backstory=(
            "You are a GRC (Governance, Risk & Compliance) specialist who has "
            "built and maintained compliance frameworks for Fortune 500 companies. "
            "You excel at cross-referencing regulatory requirements against "
            "internal control libraries and identifying coverage gaps that "
            "could expose the organization to risk."
        ),
        llm=llm,
        tools=tools or [],
        verbose=True,
        allow_delegation=False,
        max_iter=3,
    )
