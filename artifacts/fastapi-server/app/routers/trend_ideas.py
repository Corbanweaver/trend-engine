import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text as sql_text
from openai import OpenAI

from app.database import get_db
from app.models import TrendIdeasRequest, TrendIdeasResponse, TrendIdea, VideoIdea
from app.routers.trends import extract_topics

router = APIRouter(prefix="/trend-ideas", tags=["trend-ideas"])

SYSTEM_PROMPT = """You are an elite viral content strategist who has generated millions of views on TikTok, Instagram Reels, and YouTube Shorts.

Given a trending topic and a niche, generate exactly 3 viral short-form video ideas.

Rules for EVERY idea:
- The HOOK must stop the scroll in under 2 seconds. Use curiosity gaps, bold claims, or pattern interrupts. Never start generic.
- The ANGLE must be contrarian, surprising, or counterintuitive. Challenge common beliefs. Avoid generic advice.
- The IDEA should be specific enough to film immediately — include the format (POV, listicle, story, reaction, experiment, etc.)

Return your response as a JSON array with exactly 3 objects, each having "hook", "angle", and "idea" keys. Return ONLY the JSON array, no other text."""


def get_openai_client() -> OpenAI:
    base_url = os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL")
    api_key = os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY", "placeholder")
    if not base_url:
        raise HTTPException(status_code=503, detail="OpenAI integration not configured.")
    return OpenAI(base_url=base_url, api_key=api_key)


def parse_ideas_json(raw: str) -> list[VideoIdea]:
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
                )
                for item in data[:3]
            ]
    except json.JSONDecodeError:
        pass
    return [VideoIdea(hook=cleaned[:100], angle="", idea=cleaned)]


@router.post("/", response_model=TrendIdeasResponse)
def get_trend_ideas(body: TrendIdeasRequest = TrendIdeasRequest(), db: Session = Depends(get_db)):
    rows = db.execute(
        sql_text("SELECT title, engagement FROM reddit_posts WHERE title != '' ORDER BY created_at DESC LIMIT 200")
    ).fetchall()

    texts = [(row[0], row[1]) for row in rows]
    trends = extract_topics(texts)

    if not trends:
        raise HTTPException(status_code=404, detail="No trends found. Try ingesting posts first.")

    client = get_openai_client()
    niche = body.niche or "fitness"
    result: list[TrendIdea] = []

    for trend in trends:
        response = client.chat.completions.create(
            model="gpt-5.2",
            max_completion_tokens=1024,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Niche: {niche}\nTrending topic: {trend.topic}",
                },
            ],
        )
        raw = response.choices[0].message.content or ""
        ideas = parse_ideas_json(raw)
        result.append(TrendIdea(trend=trend.topic, ideas=ideas))

    return TrendIdeasResponse(niche=niche, trend_ideas=result)
