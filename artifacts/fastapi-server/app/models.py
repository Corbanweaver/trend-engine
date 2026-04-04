from datetime import datetime
from pydantic import BaseModel


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
    text: str
    niche: str = "fitness"


class VideoIdea(BaseModel):
    hook: str
    angle: str
    idea: str
    script: str = ""


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


class TrendIdeasRequest(BaseModel):
    niche: str = "fitness"


class TrendIdeasResponse(BaseModel):
    niche: str
    trend_ideas: list[TrendIdea]


class YouTubeSearchRequest(BaseModel):
    query: str
    max_results: int = 5


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
