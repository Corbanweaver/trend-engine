import type { TrendIdea } from "@/lib/trend-ideas-types";

export type PlatformKey =
  | "tiktok"
  | "instagram"
  | "x"
  | "youtube"
  | "reddit"
  | "hackernews"
  | "news"
  | "web"
  | "pinterest"
  | "medium"
  | "mixed";

const PLATFORM_LABEL: Record<PlatformKey, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
  reddit: "Reddit",
  hackernews: "Tech forums",
  news: "Google News",
  web: "Web",
  pinterest: "Pinterest",
  medium: "Medium",
  mixed: "Multi-platform",
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Approximate cross-platform engagement from attached media (API has no single score). */
export function computeEngagementRaw(trend: TrendIdea): number {
  let score = 0;

  for (const p of trend.reddit_posts) {
    score += num(p.score) + num(p.num_comments) * 0.5;
  }
  for (const v of trend.tiktok_videos) {
    score += num(v.like_count) + num(v.play_count) / 10_000;
  }
  score += trend.instagram_posts.length * 35;
  score += (trend.x_posts ?? []).length * 28;
  for (const s of trend.hackernews_stories) {
    score += num(s.score);
  }

  score += trend.example_videos.length * 45;
  score += trend.google_news.length * 22;
  score += trend.web_results.length * 12;
  score += trend.pinterest_pins.length * 14;
  score += trend.medium_articles.length * 14;

  return Math.round(score);
}

/** 0-100 heat for display (log-scaled). */
export function engagementHeat(raw: number): number {
  if (raw <= 0) return 0;
  return Math.min(
    100,
    Math.round((Math.log10(raw + 12) / Math.log10(320)) * 100),
  );
}

export function primaryPlatform(trend: TrendIdea): {
  key: PlatformKey;
  label: string;
} {
  const parts: { key: PlatformKey; w: number }[] = [
    {
      key: "tiktok",
      w: trend.tiktok_videos.reduce(
        (a, v) => a + num(v.like_count) + num(v.play_count) / 15_000,
        0,
      ),
    },
    {
      key: "instagram",
      w: trend.instagram_posts.length * 45,
    },
    {
      key: "x",
      w: (trend.x_posts ?? []).length * 32,
    },
    {
      key: "reddit",
      w: trend.reddit_posts.reduce(
        (a, p) => a + num(p.score) + num(p.num_comments) * 0.4,
        0,
      ),
    },
    {
      key: "youtube",
      w: trend.example_videos.length * 50,
    },
    {
      key: "hackernews",
      w: trend.hackernews_stories.reduce((a, s) => a + num(s.score), 0),
    },
    {
      key: "news",
      w: trend.google_news.length * 30,
    },
    {
      key: "web",
      w: trend.web_results.length * 18,
    },
    {
      key: "pinterest",
      w: trend.pinterest_pins.length * 20,
    },
    {
      key: "medium",
      w: trend.medium_articles.length * 20,
    },
  ];

  parts.sort((a, b) => b.w - a.w);
  const top = parts[0];
  if (!top || top.w <= 0) {
    return { key: "mixed", label: PLATFORM_LABEL.mixed };
  }
  return { key: top.key, label: PLATFORM_LABEL[top.key] };
}
