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


class IdeasResponse(BaseModel):
    ideas: list[str]
