"""Knowledge Base service — queries Amazon Bedrock Knowledge Bases."""

import boto3

from backend.config import (
    AWS_ACCESS_KEY_ID,
    AWS_REGION_NAME,
    AWS_SECRET_ACCESS_KEY,
    BEDROCK_KB_ID,
)


def _get_kb_client():
    return boto3.client(
        "bedrock-agent-runtime",
        region_name=AWS_REGION_NAME,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    )


def retrieve(query: str, top_k: int = 5) -> list[str]:
    """
    Query the Bedrock Knowledge Base and return the top-k relevant text chunks.

    Uses the Retrieve API to fetch relevant passages from the internal
    compliance controls uploaded to the S3-backed Knowledge Base.
    """
    client = _get_kb_client()

    try:
        response = client.retrieve(
            knowledgeBaseId=BEDROCK_KB_ID,
            retrievalQuery={"text": query},
            retrievalConfiguration={
                "vectorSearchConfiguration": {
                    "numberOfResults": top_k,
                }
            },
        )

        chunks: list[str] = []
        for result in response.get("retrievalResults", []):
            content = result.get("content", {}).get("text", "")
            if content.strip():
                chunks.append(content.strip())

        return chunks[:top_k]

    except Exception as e:
        print(f"⚠️  Knowledge Base retrieve error: {e}")
        return [
            f"[KB retrieval failed: {str(e)}. "
            "The agent should proceed with general compliance knowledge.]"
        ]


def retrieve_with_source(query: str, top_k: int = 5) -> list[dict]:
    """
    Query the KB and return chunks along with their source metadata.

    Returns list of dicts with 'text' and 'source' keys.
    """
    client = _get_kb_client()

    try:
        response = client.retrieve(
            knowledgeBaseId=BEDROCK_KB_ID,
            retrievalQuery={"text": query},
            retrievalConfiguration={
                "vectorSearchConfiguration": {
                    "numberOfResults": top_k,
                }
            },
        )

        results: list[dict] = []
        for result in response.get("retrievalResults", []):
            text = result.get("content", {}).get("text", "")
            location = result.get("location", {})
            source_uri = location.get("s3Location", {}).get("uri", "unknown")
            if text.strip():
                results.append({"text": text.strip(), "source": source_uri})

        return results[:top_k]

    except Exception as e:
        print(f"⚠️  Knowledge Base retrieve error: {e}")
        return [{"text": f"KB retrieval failed: {str(e)}", "source": "error"}]
