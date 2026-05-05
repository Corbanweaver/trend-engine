import os

from fastapi import HTTPException
from openai import OpenAI


def get_openai_client() -> OpenAI:
    """Return an OpenAI client for either Replit AI integrations or native OpenAI API keys."""
    base_url = os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL")
    api_key = (
        os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY")
        or os.environ.get("OPENAI_API_KEY")
        or ""
    ).strip()

    if base_url:
        return OpenAI(base_url=base_url, api_key=api_key or "placeholder")

    if api_key:
        return OpenAI(api_key=api_key)

    raise HTTPException(status_code=503, detail="OpenAI integration not configured.")
