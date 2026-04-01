"""
Bedrock LLM service — provides LLM invocation via litellm.

litellm is the same library CrewAI uses under the hood for Bedrock.
We use it directly because the published crewai package (0.11.x) has
numpy<2/langchain<0.2 deps that are incompatible with Python 3.14.
"""

import json

import litellm

from backend.config import (
    AWS_ACCESS_KEY_ID,
    AWS_REGION_NAME,
    AWS_SECRET_ACCESS_KEY,
    BEDROCK_LLM_MODEL_STRING,
)

# Suppress litellm debug noise
litellm.set_verbose = False


def invoke_llm(system_prompt: str, user_prompt: str) -> str:
    """
    Send a system + user prompt to Bedrock via litellm and return
    the assistant's text response.
    """
    response = litellm.completion(
        model=BEDROCK_LLM_MODEL_STRING,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        aws_region_name=AWS_REGION_NAME,
        temperature=0.3,
        max_tokens=4096,
    )
    return response.choices[0].message.content.strip()
