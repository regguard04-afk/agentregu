"""
Bedrock LLM service — provides direct LLM invocation via litellm.

NOTE: This module is retained as a utility for direct LLM calls
(e.g., the chat service). The main pipeline now uses CrewAI's
built-in LLM integration (crewai.LLM) which also uses litellm
under the hood for Bedrock.

For the CrewAI-powered agent pipeline, see backend/crew.py.
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

    This is used by the chat service for direct LLM calls.
    The agent pipeline uses CrewAI's built-in LLM instead.
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
