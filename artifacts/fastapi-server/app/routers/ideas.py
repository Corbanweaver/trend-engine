import os
import json
import asyncio
from fastapi import APIRouter, HTTPException
from openai import OpenAI

from app.models import IdeasRequest, IdeasResponse, VideoIdea
from app.pinterest_client import pinterest_search
from app.google_trends_client import google_trends_search

router = APIRouter(prefix="/ideas", tags=["ideas"])

SYSTEM_PROMPT = """You are an elite viral content strategist who has generated millions of views on TikTok, Instagram Reels, and YouTube Shorts.

Given a topic and a niche, generate exactly 5 viral short-form video ideas.

Rules for EVERY idea:
- The HOOK must stop the scroll in under 2 seconds. Use curiosity gaps, bold claims, or pattern interrupts. Never start with "Did you know" or generic openers.
- The ANGLE must be contrarian, surprising, or counterintuitive. Challenge common beliefs. Avoid generic advice that sounds like every other creator.
- The IDEA should be specific enough to film immediately — include the format (POV, listicle, story, reaction, experiment, etc.)
- The SCRIPT should be a complete 30-60 second video script with the hook opening line, 3-4 talking points, and a call-to-action. Write it in first person as if the creator is speaking to camera. Keep it punchy and conversational.

Return your response as a JSON array with exactly 5 objects, each having "hook", "angle", "idea", and "script" keys. Return ONLY the JSON array, no other text."""


def get_openai_client() -> OpenAI:
    base_url = os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL")
    api_key = os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY", "placeholder")
    if not base_url:
        raise HTTPException(status_code=503, detail="OpenAI integration not configured.")
    return OpenAI(base_url=base_url, api_key=api_key)


def parse_ideas(raw: str) -> list[VideoIdea]:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)

    try:
        data = json.loads(cleaned)
        if isinstance(data, list):
            return [
                VideoIdea(
                    hook=item.get("hook", ""),
                    angle=item.get("angle", ""),
                    idea=item.get("idea", ""),
                    script=item.get("script", ""),
                )
                for item in data[:5]
            ]
    except json.JSONDecodeError:
        pass

    ideas = []
    for line in cleaned.splitlines():
        line = line.strip()
        if not line:
            continue
        stripped = line.lstrip("0123456789.)- ").strip()
        if stripped:
            ideas.append(VideoIdea(hook=stripped, angle="", idea=stripped, script=""))
    return ideas[:5]


@router.post("/", response_model=IdeasResponse)
async def generate_ideas(body: IdeasRequest):
    if not body.text.strip():
        raise HTTPException(status_code=422, detail="text must not be empty.")

    client = get_openai_client()
    niche = body.niche or "fitness"
    topic = body.text.strip()

    trends_task = google_trends_search(f"{niche} {topic}")
    pinterest_task = pinterest_search(f"{niche} {topic}", max_results=5)
    trends_data, pinterest_data = await asyncio.gather(trends_task, pinterest_task)

    context_parts = [f"Niche: {niche}", f"Topic: {topic}"]
    trending_searches = (trends_data or {}).get("trending_searches", [])
    related_queries = (trends_data or {}).get("related_queries", [])
    if trending_searches:
        context_parts.append(
            "Google Trends (US trending): " + ", ".join(str(s) for s in trending_searches[:10])
        )
    if related_queries:
        context_parts.append(
            "Google Trends (related queries): "
            + ", ".join(str(q.get("query", "")) for q in related_queries[:10] if q.get("query"))
        )
    if pinterest_data:
        context_parts.append(
            "Pinterest pin topics: "
            + ", ".join(str(pin.get("title", "")) for pin in pinterest_data[:5] if pin.get("title"))
        )
    user_prompt = "\n".join(context_parts)

    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.chat.completions.create(
            model="gpt-5.2",
            max_completion_tokens=4096,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        ),
    )

    raw = response.choices[0].message.content or ""
    ideas = parse_ideas(raw)
    return IdeasResponse(ideas=ideas)
