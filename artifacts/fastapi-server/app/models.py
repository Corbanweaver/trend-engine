from datetime import datetime
from pydantic import BaseModel, Field


class RedditPost(BaseModel):
    id: str
    text: str
    engagement: int
    created_at: datetime

    class Config:
        from_attributes = True


class IngestResponse(BaseModel):
    ingested: int
    skipped: int
    posts: list[RedditPost]


class IdeasRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    niche: str = Field(default="fitness", max_length=80)


class VideoIdea(BaseModel):
    hook: str
    angle: str
    idea: str
    script: str = ""
    hashtags: list[str] = []
    optimized_title: str = ""
    seo_description: str = ""
    thumbnail_url: str = ""


class IdeasResponse(BaseModel):
    ideas: list[VideoIdea]


class TrendTopic(BaseModel):
    topic: str
    count: int
    total_engagement: int


class TrendsResponse(BaseModel):
    trends: list[TrendTopic]


class TrendIdea(BaseModel):
    trend: str
    ideas: list[VideoIdea]
    example_videos: list[dict] = []
    instagram_posts: list[dict] = []
    tiktok_videos: list[dict] = []
    google_news: list[dict] = []
    google_trends_data: dict = {}
    hackernews_stories: list[dict] = []
    web_results: list[dict] = []
    reddit_posts: list[dict] = []
    pinterest_pins: list[dict] = []
    medium_articles: list[dict] = []


class TrendIdeasRequest(BaseModel):
    niche: str = Field(default="fitness", max_length=80)


class TrendIdeasResponse(BaseModel):
    niche: str
    trend_ideas: list[TrendIdea]


class TrendDigestTopicsResponse(BaseModel):
    """Lightweight topic-only payload for email digests (no full idea generation)."""

    niche: str
    topics: list[str]


class IdeaEnrichmentRequest(BaseModel):
    """Context for per-idea hook, hashtag, and script generation."""

    niche: str = Field(default="fitness", max_length=80)
    trend: str = Field(min_length=1, max_length=160)
    hook: str = Field(default="", max_length=500)
    angle: str = Field(default="", max_length=1200)
    idea: str = Field(min_length=1, max_length=2000)
    optimized_title: str = Field(default="", max_length=160)
    script: str = Field(default="", max_length=6000)


class HooksResponse(BaseModel):
    hooks: list[str]


class HashtagsResponse(BaseModel):
    hashtags: list[str]


class FullScriptResponse(BaseModel):
    script: str


class DailyTrendItem(BaseModel):
    title: str
    subtitle: str = ""
    url: str = ""
    meta: str = ""


class DailyPlatformSection(BaseModel):
    key: str
    label: str
    items: list[DailyTrendItem]


class DailyTrendingResponse(BaseModel):
    updated_at: str
    sections: list[DailyPlatformSection]


class YouTubeSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=200)
    max_results: int = Field(default=5, ge=1, le=20)


class YouTubeVideo(BaseModel):
    video_id: str
    title: str
    channel: str
    thumbnail: str
    published_at: str
    url: str
    embed_url: str


class YouTubeSearchResponse(BaseModel):
    query: str
    videos: list[YouTubeVideo]
