"""
Knowledge Base Retrieval Tool — a custom CrewAI tool.

Extends crewai.tools.BaseTool to provide the Compliance Mapper agent
with the ability to query the Amazon Bedrock Knowledge Base for
relevant internal compliance control documents.

This is a REAL CrewAI tool using BaseTool inheritance.
"""

from typing import Type

from crewai.tools import BaseTool
from pydantic import BaseModel, Field


class KBRetrievalInput(BaseModel):
    """Input schema for the Knowledge Base Retrieval Tool."""

    query: str = Field(
        ...,
        description=(
            "The search query to find relevant compliance controls "
            "in the Knowledge Base. Use regulatory topics, obligation "
            "keywords, or control framework terms."
        ),
    )
    top_k: int = Field(
        default=5,
        description="Number of top results to retrieve (1-10).",
    )


class KBRetrievalTool(BaseTool):
    """
    CrewAI tool that queries Amazon Bedrock Knowledge Base for
    internal compliance control documents.

    The Compliance Mapper agent uses this tool to find relevant
    controls that map to regulatory obligations.
    """

    name: str = "Knowledge Base Retrieval"
    description: str = (
        "Queries the organization's internal compliance Knowledge Base "
        "(powered by Amazon Bedrock) to find relevant control documents, "
        "policies, and procedures. Use this to find which internal controls "
        "match regulatory obligations. Input should be a search query about "
        "the regulatory topic or specific obligation."
    )
    args_schema: Type[BaseModel] = KBRetrievalInput

    def _run(self, query: str, top_k: int = 5) -> str:
        """
        Execute the KB retrieval query against Amazon Bedrock.

        Returns the retrieved text chunks as a formatted string.
        """
        from backend.services.kb_service import retrieve

        chunks = retrieve(query, top_k=top_k)

        if not chunks:
            return "No relevant compliance controls found in the Knowledge Base."

        # Format results for the agent
        results = []
        for i, chunk in enumerate(chunks, 1):
            results.append(f"--- Control Document {i} ---\n{chunk}")

        return "\n\n".join(results)
