/** Mirrors FastAPI `VideoIdea` / `TrendIdea` / `TrendIdeasResponse` JSON. */

export interface VideoIdea {
  hook: string;
  angle: string;
  idea: string;
  script?: string;
  hashtags?: string[];
  optimized_title?: string;
  seo_description?: string;
  thumbnail_url?: string;
}

export interface TrendIdea {
  trend: string;
  ideas: VideoIdea[];
  example_videos: Record<string, unknown>[];
  instagram_posts: Record<string, unknown>[];
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
