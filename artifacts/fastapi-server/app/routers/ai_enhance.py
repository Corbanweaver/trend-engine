import os
import json
import asyncio
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.security import expensive_endpoint_rate_limit
from app.openai_client import get_openai_client

try:
    import anthropic
except ImportError:
    anthropic = None

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ai",
    tags=["ai-enhance"],
    dependencies=[Depends(expensive_endpoint_rate_limit("ai-enhance"))],
)


class RefineScriptRequest(BaseModel):
    script: str = Field(min_length=1, max_length=6000)
    niche: str = Field(default="general", max_length=80)
    hook: str = Field(default="", max_length=500)
    idea: str = Field(default="", max_length=2000)


class RefineScriptResponse(BaseModel):
    refined_script: str
    model: str = "claude"
    improvements: list[str] = []


def get_anthropic_client():
    if anthropic is None:
        return None
    base_url = os.environ.get("AI_INTEGRATIONS_ANTHROPIC_BASE_URL")
    api_key = os.environ.get("AI_INTEGRATIONS_ANTHROPIC_API_KEY", "placeholder")
    if not base_url:
        return None
    return anthropic.Anthropic(base_url=base_url, api_key=api_key)


REFINE_PROMPT = """You are a world-class short-form video scriptwriter. Take this script and make it significantly better.

Original hook: {hook}
Video idea: {idea}
Niche: {niche}

Original script:
{script}

Rewrite the script to be more:
1. Engaging — stronger hook, better pacing, more conversational
2. Viral — add pattern interrupts, curiosity loops, emotional triggers
3. Actionable — clearer CTA, more specific advice
4. Concise — tighter language, no filler words

Return your response as JSON with these keys:
- "refined_script": the improved script text
- "improvements": array of 2-3 short bullet points describing what you changed

Return ONLY the JSON object, no other text."""


@router.post("/refine-script", response_model=RefineScriptResponse)
async def refine_script(body: RefineScriptRequest):
    claude = get_anthropic_client()

    prompt = REFINE_PROMPT.format(
        hook=body.hook,
        idea=body.idea,
        niche=body.niche,
        script=body.script,
    )

    if claude:
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: claude.messages.create(
                    model="claude-sonnet-4-6",
                    max_tokens=2048,
                    messages=[{"role": "user", "content": prompt}],
                ),
            )
            raw = response.content[0].text
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                lines = cleaned.splitlines()
                lines = [l for l in lines if not l.strip().startswith("```")]
                cleaned = "\n".join(lines)
            data = json.loads(cleaned)
            return RefineScriptResponse(
                refined_script=data.get("refined_script", raw),
                model="claude-sonnet-4-6",
                improvements=data.get("improvements", []),
            )
        except Exception as e:
            logger.warning("Claude refinement failed, falling back to OpenAI: %s", e)

    client = get_openai_client()
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model="gpt-5.2",
            max_completion_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        ),
    )
    raw = response.choices[0].message.content or ""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)
    try:
        data = json.loads(cleaned)
        return RefineScriptResponse(
            refined_script=data.get("refined_script", raw),
            model="gpt-5.2",
            improvements=data.get("improvements", []),
        )
    except json.JSONDecodeError:
        return RefineScriptResponse(refined_script=raw, model="gpt-5.2")
