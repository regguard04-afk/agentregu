"""
Remediation Planner Agent — built with the CrewAI framework.

Uses crewai.Agent to define an AI agent that generates actionable
compliance remediation task plans.
"""

from crewai import Agent, LLM


def create_remediation_planner(llm: LLM) -> Agent:
    """
    Create and return a CrewAI Agent for remediation planning.

    This agent generates concrete, prioritized remediation action plans
    for each regulatory item, including tasks with priorities, owners,
    deadlines, and required evidence.
    """
    return Agent(
        role="Compliance Remediation Planner",
        goal=(
            "Generate a concrete, prioritized remediation action plan for each "
            "regulatory item. Each plan should contain 3-7 specific tasks with "
            "priority levels (P1/P2/P3), suggested owners (Legal, Security, IT, "
            "HR, Ops), deadlines, and required evidence documentation. "
            "Always respond with valid JSON."
        ),
        backstory=(
            "You are a Compliance Remediation Planner who has led remediation "
            "efforts across banking, fintech, and healthcare organizations. "
            "You know exactly what steps need to happen — from policy updates "
            "to technical implementations to audit evidence collection — and "
            "how to sequence them for maximum efficiency. You assign tasks to "
            "the right functional owners and set realistic deadlines relative "
            "to regulatory effective dates."
        ),
        llm=llm,
        verbose=True,
        allow_delegation=False,
        max_iter=3,
    )
