"""
Chat service — provides a conversational RAG interface over the
Knowledge Base using Bedrock's RetrieveAndGenerate API.
"""

import boto3

from backend.config import (
    AWS_ACCESS_KEY_ID,
    AWS_REGION_NAME,
    AWS_SECRET_ACCESS_KEY,
    BEDROCK_KB_ID,
    BEDROCK_MODEL_ID,
)


def _get_client():
    return boto3.client(
        "bedrock-agent-runtime",
        region_name=AWS_REGION_NAME,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    )


def ask(question: str) -> dict:
    """
    Use the Bedrock RetrieveAndGenerate API to answer a compliance question
    grounded in the Knowledge Base documents.

    Returns dict with 'answer' and 'sources' keys.
    """
    client = _get_client()

    model_arn = f"arn:aws:bedrock:{AWS_REGION_NAME}::foundation-model/{BEDROCK_MODEL_ID}"

    try:
        response = client.retrieve_and_generate(
            input={"text": question},
            retrieveAndGenerateConfiguration={
                "type": "KNOWLEDGE_BASE",
                "knowledgeBaseConfiguration": {
                    "knowledgeBaseId": BEDROCK_KB_ID,
                    "modelArn": model_arn,
                },
            },
        )

        answer = response.get("output", {}).get("text", "No answer generated.")

        sources: list[str] = []
        for citation in response.get("citations", []):
            for ref in citation.get("retrievedReferences", []):
                loc = ref.get("location", {})
                uri = loc.get("s3Location", {}).get("uri", "")
                if uri and uri not in sources:
                    sources.append(uri)

        return {"answer": answer, "sources": sources}

    except Exception as e:
        return {
            "answer": f"I encountered an error querying the knowledge base: {str(e)}",
            "sources": [],
        }
