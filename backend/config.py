"""
Configuration loader — reads .env and validates all required vars.

Supports CrewAI integration: the LLM configuration is handled by
crewai.LLM which reads AWS credentials from environment variables
automatically via litellm/boto3.
"""

import os
import sys

from dotenv import load_dotenv

load_dotenv()

REQUIRED_VARS = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_REGION_NAME",
    "BEDROCK_MODEL_ID",
    "BEDROCK_KB_ID",
    "S3_BUCKET_NAME",
]


def _validate() -> None:
    missing = [v for v in REQUIRED_VARS if not os.getenv(v)]
    if missing:
        print(
            f"\n⚠️  Missing environment variables (non-fatal):\n"
            + "\n".join(f"   • {v}" for v in missing)
            + "\n\nCopy .env.example → .env and fill in the values.\n"
            "Some features may not work without these.\n"
        )


_validate()

# ─── Exported Settings ────────────────────────────────────────────────

AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION_NAME: str = os.getenv("AWS_REGION_NAME", "us-east-1")

BEDROCK_MODEL_ID: str = os.getenv("BEDROCK_MODEL_ID", "amazon.nova-pro-v1:0")
BEDROCK_KB_ID: str = os.getenv("BEDROCK_KB_ID", "")
BEDROCK_KB_DATASOURCE_NAME: str = os.getenv(
    "BEDROCK_KB_DATASOURCE_NAME", "knowledge-base-quick-start-c6jl3-data-source"
)
S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "")

API_HOST: str = os.getenv("API_HOST", "127.0.0.1")
API_PORT: int = int(os.getenv("API_PORT", "8000"))

# Derived — used by both CrewAI (via crewai.LLM) and the legacy bedrock_service
BEDROCK_LLM_MODEL_STRING: str = f"bedrock/{BEDROCK_MODEL_ID}"
