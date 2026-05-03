/** Mirrors FastAPI `VideoIdea` / `TrendIdea` / `TrendIdeasResponse` JSON. */

export interface VideoIdea {
  hook: string;
  angle: string;
  idea: string;
  script?: string;
  hashtags?: string[];
  optimized_title?: string;
  seo_description?: string;
  hook_variations?: string[];
  full_script?: string;
  thumbnail_url?: string;
  thumbnail_urls?: string[];
  thumbnails?: string[];
}

export interface InstagramPost extends Record<string, unknown> {
  url?: string;
  permalink?: string;
  link?: string;
}

export interface TrendIdea {
  trend: string;
  ideas: VideoIdea[];
  example_videos: Record<string, unknown>[];
  instagram_posts: InstagramPost[];
  tiktok_videos: Record<string, unknown>[];
  google_news: Record<string, unknown>[];
  google_trends_data: Record<string, unknown>;
  hackernews_stories: Record<string, unknown>[];
  web_results: Record<string, unknown>[];
  reddit_posts: Record<string, unknown>[];
  pinterest_pins: Record<string, unknown>[];
  medium_articles: Record<string, unknown>[];
}

export interface TrendIdeasResponse {
  niche: string;
  trend_ideas: TrendIdea[];
}

/** FastAPI `POST /trend-ideas/digest-topics` */
export interface TrendDigestTopicsResponse {
  niche: string;
  topics: string[];
}

export function getVideoIdeaThumbnailUrls(idea: VideoIdea): string[] {
  const candidates = [
    idea.thumbnail_url,
    ...(idea.thumbnail_urls ?? []),
    ...(idea.thumbnails ?? []),
  ];

  return [
    ...new Set(candidates.map((url) => url?.trim()).filter(Boolean)),
  ] as string[];
}
