import os
from fastapi import APIRouter, HTTPException
from openai import OpenAI

from app.models import IdeasRequest, IdeasResponse

router = APIRouter(prefix="/ideas", tags=["ideas"])

SYSTEM_PROMPT = """You are a viral content strategist specializing in fitness and health video ideas.
Given a topic or piece of text, generate exactly 5 viral video ideas optimized for short-form content (TikTok, Instagram Reels, YouTube Shorts).
Each idea should be punchy, specific, and have strong hook potential.
Return ONLY a numbered list of 5 ideas, one per line, with no extra commentary."""


def get_openai_client() -> OpenAI:
    base_url = os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL")
    api_key = os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY", "placeholder")
    if not base_url:
        raise HTTPException(status_code=503, detail="OpenAI integration not configured.")
    return OpenAI(base_url=base_url, api_key=api_key)


@router.post("/", response_model=IdeasResponse)
def generate_ideas(body: IdeasRequest):
    if not body.text.strip():
        raise HTTPException(status_code=422, detail="text must not be empty.")

    client = get_openai_client()

    response = client.chat.completions.create(
        model="gpt-5.2",
        max_completion_tokens=1024,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": body.text},
        ],
    )

    raw = response.choices[0].message.content or ""
    lines = [line.strip() for line in raw.strip().splitlines() if line.strip()]
    ideas = []
    for line in lines:
        cleaned = line.lstrip("0123456789.)- ").strip()
        if cleaned:
            ideas.append(cleaned)

    return IdeasResponse(ideas=ideas[:5])
