import os
import json
import asyncio
import logging
import time
from collections import defaultdict

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from openai import OpenAI

try:
    import anthropic
except ImportError:
    anthropic = None

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai-enhance"])


class RefineScriptRequest(BaseModel):
    script: str
    niche: str = "general"
    hook: str = ""
    idea: str = ""


class RefineScriptResponse(BaseModel):
    refined_script: str
    model: str = "claude"
    improvements: list[str] = []


class ThumbnailRequest(BaseModel):
    idea: str
    hook: str = ""
    niche: str = "general"


class ThumbnailResponse(BaseModel):
    image_b64: str
    prompt_used: str


_rate_limits = defaultdict(list)
RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX = 10

def check_rate_limit(client_ip: str):
    now = time.time()
    _rate_limits[client_ip] = [t for t in _rate_limits[client_ip] if now - t < RATE_LIMIT_WINDOW]
    if len(_rate_limits[client_ip]) >= RATE_LIMIT_MAX:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
    _rate_limits[client_ip].append(now)


def get_anthropic_client():
    if anthropic is None:
        return None
    base_url = os.environ.get("AI_INTEGRATIONS_ANTHROPIC_BASE_URL")
    api_key = os.environ.get("AI_INTEGRATIONS_ANTHROPIC_API_KEY", "placeholder")
    if not base_url:
        return None
    return anthropic.Anthropic(base_url=base_url, api_key=api_key)


def get_openai_client():
    base_url = os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL")
    api_key = os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY", "placeholder")
    if not base_url:
        raise HTTPException(status_code=503, detail="OpenAI integration not configured.")
    return OpenAI(base_url=base_url, api_key=api_key)


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
async def refine_script(body: RefineScriptRequest, request: Request):
    check_rate_limit(request.client.host if request.client else "unknown")
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


THUMBNAIL_PROMPT_TEMPLATE = """Create a viral YouTube/TikTok video thumbnail concept for:
Topic: {idea}
Hook: {hook}
Niche: {niche}

Style: Bold, high-contrast, eye-catching social media thumbnail. Bright colors, dramatic lighting, clean composition. No text overlay. Professional quality, attention-grabbing."""


@router.post("/generate-thumbnail", response_model=ThumbnailResponse)
async def generate_thumbnail(body: ThumbnailRequest, request: Request):
    check_rate_limit(request.client.host if request.client else "unknown")
    client = get_openai_client()
    prompt = THUMBNAIL_PROMPT_TEMPLATE.format(
        idea=body.idea,
        hook=body.hook,
        niche=body.niche,
    )

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.images.generate(
                model="gpt-image-1",
                prompt=prompt,
                n=1,
                size="1024x1024",
            ),
        )
        image_data = response.data[0].b64_json
        if not image_data:
            raise HTTPException(status_code=500, detail="No image data returned")
        return ThumbnailResponse(image_b64=image_data, prompt_used=prompt)
    except Exception as e:
        logger.error("Thumbnail generation failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")
