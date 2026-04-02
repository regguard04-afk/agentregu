"""
Regulatory Scraper Tool — a custom CrewAI tool.

Extends crewai.tools.BaseTool to provide agents with the ability
to scrape live regulatory sources (RSS feeds and websites) for
the latest updates from RBI, SEBI, SEC, FCA, and more.

This is a REAL CrewAI tool using BaseTool inheritance.
"""

from typing import Type

from crewai.tools import BaseTool
from pydantic import BaseModel, Field


class ScraperInput(BaseModel):
    """Input schema for the Regulatory Scraper Tool."""

    max_items: int = Field(
        default=10,
        description="Maximum number of regulatory items to scrape (1-50).",
    )


class RegulatoryScraperTool(BaseTool):
    """
    CrewAI tool that scrapes live regulatory sources for the
    latest updates from global regulators.

    Sources include: RBI (India), SEBI (India), SEC (USA),
    FCA (UK), and EUR-Lex (EU).
    """

    name: str = "Regulatory Source Scraper"
    description: str = (
        "Scrapes live regulatory sources (RSS feeds and government websites) "
        "for the latest regulatory updates from RBI, SEBI, SEC, FCA, and "
        "other global regulators. Returns a list of raw regulatory items "
        "with title, source, URL, and content."
    )
    args_schema: Type[BaseModel] = ScraperInput

    def _run(self, max_items: int = 10) -> str:
        """
        Execute the regulatory scraping pipeline.

        Returns a formatted string of scraped items.
        """
        from backend.services.scraper import scrape_all_sources

        items = scrape_all_sources()

        if not items:
            return "No regulatory items found from live sources."

        # Limit and format results
        items = items[:max_items]
        results = []
        for i, item in enumerate(items, 1):
            results.append(
                f"--- Item {i} ---\n"
                f"Source: {item.source}\n"
                f"Title: {item.title}\n"
                f"URL: {item.url}\n"
                f"Jurisdiction: {item.jurisdiction}\n"
                f"Content: {item.raw_content[:500]}\n"
            )

        return "\n".join(results)
