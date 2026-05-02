"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  ExternalLink,
  Loader2,
  LogOut,
  Music2,
  Search,
  Sparkles,
  Star,
  Moon,
  Sun,
  Info,
  Calendar,
  Home,
  Bookmark,
  Youtube,
  UserRound,
  Bell,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { IdeaPanel } from "@/components/idea-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getApiBaseUrl } from "@/lib/api";
import { NICHE_OPTIONS } from "@/lib/niches";
import { getSupabaseClient } from "@/lib/supabase";
import type {
  TrendIdea,
  TrendIdeasResponse,
  VideoIdea,
} from "@/lib/trend-ideas-types";
import { computeEngagementRaw, engagementHeat } from "@/lib/trend-metrics";
import { cn } from "@/lib/utils";
import { recordTrendAnalysis } from "@/lib/user-stats";

const TREND_RESULTS_STORAGE_KEY = "trend_dashboard:last_results";
const FREE_ANALYSIS_LIMIT = 5;
const ONBOARDING_DISMISSED_KEY = "trend_dashboard:onboarding_dismissed";
const NICHE_FAVORITES_KEY = "trend_dashboard:niche_favorites";
const NICHE_HISTORY_KEY = "trend_dashboard:niche_history";
const ANALYSIS_PROGRESS_STEPS = [
  "Scanning TikTok...",
  "Scanning Reddit...",
  "Generating AI ideas...",
  "Almost done...",
] as const;

type SubscriptionPlan = "free" | "creator" | "pro";

type UserSubscriptionRow = {
  user_id: string;
  plan: SubscriptionPlan;
  analyses_used_this_month: number;
  updated_at: string;
};

function formatPlanLabel(plan: SubscriptionPlan): "Free" | "Creator" | "Pro" {
  if (plan === "creator") return "Creator";
  if (plan === "pro") return "Pro";
  return "Free";
}

function isSameMonth(timestamp: string, now = new Date()): boolean {
  const date = new Date(timestamp);
  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth()
  );
}

function parseTimestampCandidate(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function getTrendDetectedLabel(trend: TrendIdea): string {
  const candidates: unknown[] = [];
  const buckets: Record<string, unknown>[] = [
    ...trend.tiktok_videos,
    ...trend.example_videos,
    ...trend.reddit_posts,
    ...trend.instagram_posts,
    ...trend.google_news,
    ...trend.hackernews_stories,
    ...trend.web_results,
  ];
  const keys = [
    "published_at",
    "publishedAt",
    "created_at",
    "createdAt",
    "timestamp",
    "time",
    "date",
    "pubDate",
  ];
  for (const item of buckets) {
    for (const key of keys) {
      if (key in item) candidates.push((item as Record<string, unknown>)[key]);
    }
  }
  const parsed = candidates
    .map(parseTimestampCandidate)
    .filter((d): d is Date => d instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime());
  if (!parsed.length) return "Trending now";
  const now = Date.now();
  const diffMs = now - parsed[0].getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Trending now";
  if (diffDays === 1) return "Trending 1 day ago";
  return `Trending ${diffDays} days ago`;
}

function useIsMobile(breakpoint = 1023) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}

async function fetchTrendIdeas(niche: string): Promise<TrendIdeasResponse> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/trend-ideas/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ niche }),
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: unknown };
      if (body?.detail != null) {
        detail =
          typeof body.detail === "string"
            ? body.detail
            : JSON.stringify(body.detail);
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }

  return res.json() as Promise<TrendIdeasResponse>;
}

type PlatformChip = "All" | "TikTok" | "YouTube" | "Reddit" | "Instagram" | "Twitter";

const PLATFORM_CHIPS: PlatformChip[] = [
  "All",
  "TikTok",
  "YouTube",
  "Reddit",
  "Instagram",
  "Twitter",
];

const platformIconStyles: Record<string, string> = {
  TikTok: "bg-pink-500/20 text-pink-200 border-pink-400/40",
  YouTube: "bg-red-500/20 text-red-200 border-red-400/40",
  Reddit: "bg-orange-500/20 text-orange-200 border-orange-400/40",
  Instagram: "bg-purple-500/20 text-purple-200 border-purple-400/40",
  Twitter: "bg-sky-500/20 text-sky-200 border-sky-400/40",
};

const platformGlyph: Record<string, string> = {
  TikTok: "♪",
  YouTube: "▶",
  Reddit: "R",
  Instagram: "◎",
  Twitter: "X",
};

function hasPlatform(trend: TrendIdea, platform: Exclude<PlatformChip, "All">): boolean {
  if (platform === "TikTok") {
    return (
      trend.tiktok_videos.length > 0 ||
      trend.tiktok_videos.some((v) => (v as { platform?: string }).platform === "tiktok")
    );
  }
  if (platform === "YouTube") {
    return (
      trend.example_videos.length > 0 ||
      trend.example_videos.some((v) => (v as { platform?: string }).platform === "youtube")
    );
  }
  if (platform === "Reddit") {
    return (
      trend.reddit_posts.length > 0 ||
      trend.reddit_posts.some((p) => (p as { platform?: string }).platform === "reddit")
    );
  }
  if (platform === "Instagram") {
    return (
      trend.instagram_posts.length > 0 ||
      trend.instagram_posts.some((p) => (p as { platform?: string }).platform === "instagram")
    );
  }
  return trend.web_results.length > 0 || trend.hackernews_stories.length > 0;
}

function getPlatformBadges(trend: TrendIdea): string[] {
  const badges: string[] = [];
  if (hasPlatform(trend, "TikTok")) badges.push("TikTok");
  if (hasPlatform(trend, "YouTube")) badges.push("YouTube");
  if (hasPlatform(trend, "Reddit")) badges.push("Reddit");
  if (hasPlatform(trend, "Instagram")) badges.push("Instagram");
  if (hasPlatform(trend, "Twitter")) badges.push("Twitter");
  return [...new Set(badges)].slice(0, 5);
}

function getCardVisual(trend: TrendIdea) {
  const generatedIdeaThumb = trend.ideas.find(
    (idea) => typeof idea.thumbnail_url === "string" && idea.thumbnail_url,
  )?.thumbnail_url;
  const youtubeThumb = trend.example_videos.find(
    (v) => typeof v.thumbnail === "string" && v.thumbnail,
  )?.thumbnail as string | undefined;
  const tiktokCover = trend.tiktok_videos.find(
    (v) => typeof v.cover === "string" && v.cover,
  )?.cover as string | undefined;
  return generatedIdeaThumb || youtubeThumb || tiktokCover || null;
}

function getYouTubeUrl(trend: TrendIdea): string | null {
  const candidate = trend.example_videos.find((video) => {
    const url = video.url;
    return typeof url === "string" && url.trim().length > 0;
  });
  if (!candidate) return null;
  return candidate.url as string;
}

function getTikTokUrl(trend: TrendIdea): string | null {
  const candidate = trend.tiktok_videos.find((video) => {
    const url = video.url;
    return typeof url === "string" && url.trim().length > 0;
  });
  if (!candidate) return null;
  return candidate.url as string;
}

function getRedditUrl(trend: TrendIdea): string | null {
  const candidate = trend.reddit_posts.find((post) => {
    const sourceKeys = ["url", "permalink", "link"] as const;
    return sourceKeys.some((key) => {
      const value = post[key];
      return typeof value === "string" && value.trim().length > 0;
    });
  });
  if (!candidate) return null;
  const preferred = candidate.url ?? candidate.permalink ?? candidate.link;
  return typeof preferred === "string" && preferred.trim().length > 0 ? preferred : null;
}

function TrendCard({
  trend,
  index,
  selected,
  onSelect,
}: {
  trend: TrendIdea;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const raw = computeEngagementRaw(trend);
  const heat = engagementHeat(raw);
  const platformBadges = getPlatformBadges(trend);
  const visual = getCardVisual(trend);
  const youtubeUrl = getYouTubeUrl(trend);
  const tiktokUrl = getTikTokUrl(trend);
  const redditUrl = getRedditUrl(trend);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const trendLabel = getTrendDetectedLabel(trend);

  const handleCardMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 5;
    const rotateX = (0.5 - py) * 5;
    setTilt({ x: rotateX, y: rotateY });
  };

  const resetCardTilt = () => setTilt({ x: 0, y: 0 });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      onMouseMove={handleCardMove}
      onMouseLeave={resetCardTilt}
      style={{ animationDelay: `${Math.min(index, 10) * 70}ms` }}
      className={cn(
        "mb-4 w-full break-inside-avoid text-left transition-all duration-200 motion-safe:animate-card-in",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
      )}
    >
      <Card
        className={cn(
          "group relative cursor-pointer overflow-hidden border-border bg-card text-foreground shadow-lg shadow-black/10 dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-900/95 dark:to-slate-950/95 dark:text-slate-100 dark:shadow-black/30",
          "transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-blue-300 hover:shadow-blue-500/20 dark:hover:border-cyan-300/40 dark:hover:shadow-cyan-500/20",
          selected &&
            "ring-2 ring-cyan-300/80 shadow-[0_0_0_1px_rgba(56,189,248,0.5),0_0_36px_rgba(56,189,248,0.28)]",
        )}
        style={{
          transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        {selected ? (
          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.22),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.18),transparent_55%)]" />
        ) : null}
        <div className="relative h-32 overflow-hidden border-b border-white/10">
          {visual ? (
            // Using API-provided thumbnails when available.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={visual}
              alt={trend.trend}
              className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.35),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(244,114,182,0.3),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(99,102,241,0.25),transparent_40%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent dark:from-slate-950/80 dark:via-slate-950/20" />
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5">
            {platformBadges.slice(0, 3).map((badge) => (
              <span
                key={`${trend.trend}-${badge}-glyph`}
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold",
                  platformIconStyles[badge],
                )}
              >
                {platformGlyph[badge]}
              </span>
            ))}
          </div>
        </div>
        <CardHeader className="space-y-3 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {platformBadges.map((badge) => (
                <span
                  key={`${trend.trend}-${badge}`}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                    platformIconStyles[badge],
                  )}
                >
                  {badge}
                </span>
              ))}
            </div>
            <div className="text-right">
              <p className="flex items-center justify-end gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground dark:text-slate-400">
                Engagement
                <span
                  title="Trend score combines Reddit score/comments, TikTok likes/plays, Hacker News score, and counts from YouTube/news/web/Pinterest/Medium, then log-scales to 0-100."
                  className="inline-flex"
                >
                  <Info className="size-3 text-muted-foreground dark:text-slate-500" />
                </span>
              </p>
              <p className="text-lg font-bold tabular-nums leading-none text-foreground dark:text-white">
                {raw > 0 ? heat : "—"}
                {raw > 0 ? (
                  <span className="text-xs font-normal text-muted-foreground dark:text-slate-400">
                    /100
                  </span>
                ) : null}
              </p>
              {raw > 0 ? (
                <p className="text-[10px] text-muted-foreground dark:text-slate-500">
                  raw {raw.toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>
          <CardTitle className="text-base leading-snug text-foreground dark:text-slate-100">
            {trend.trend}
          </CardTitle>
          <p className="text-[11px] text-blue-600/80 dark:text-cyan-200/80">{trendLabel}</p>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all dark:from-cyan-400 dark:to-indigo-500"
              style={{ width: raw > 0 ? `${heat}%` : "0%" }}
            />
          </div>
          {youtubeUrl || tiktokUrl || redditUrl ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {tiktokUrl ? (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    platformIconStyles.TikTok,
                    "hover:bg-pink-500/30",
                  )}
                >
                  <Music2 className="size-3.5" />
                  Watch on TikTok
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
              {youtubeUrl ? (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    platformIconStyles.YouTube,
                    "hover:bg-red-500/30",
                  )}
                >
                  <Youtube className="size-3.5" />
                  Watch on YouTube
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
              {redditUrl ? (
                <a
                  href={redditUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    platformIconStyles.Reddit,
                    "hover:bg-orange-500/30",
                  )}
                >
                  <span className="text-xs font-bold">R</span>
                  View on Reddit
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="pt-0 text-xs text-muted-foreground dark:text-slate-400">
          {trend.ideas.length} AI idea{trend.ideas.length === 1 ? "" : "s"} ·
          Click for details
          <ChevronRight className="ml-1 size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </CardFooter>
      </Card>
    </div>
  );
}

function LoadingState({ niche }: { niche: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
      <div className="relative flex items-center justify-center">
        <div className="absolute size-20 animate-ping rounded-full bg-cyan-500/20" />
        <div className="relative rounded-full border border-cyan-500/30 bg-card p-5 shadow-sm dark:border-cyan-400/40 dark:bg-slate-900/80">
          <Sparkles className="size-8 text-cyan-600 dark:text-cyan-300" />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-base font-semibold text-foreground dark:text-slate-100">
          Crafting ideas for {niche}
        </p>
        <p className="max-w-md text-sm text-muted-foreground dark:text-slate-400">
          Scanning live trends across platforms and generating high-converting
          short-form concepts.
        </p>
      </div>
      <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm dark:border-white/10 dark:bg-slate-900/60"
          >
            <div className="h-28 animate-pulse bg-muted dark:bg-slate-800/80" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-16 animate-pulse rounded bg-muted-foreground/20 dark:bg-slate-700/70" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted-foreground/20 dark:bg-slate-700/70" />
              <div className="h-2 w-full animate-pulse rounded bg-muted dark:bg-slate-800/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: PlatformChip;
  active: boolean;
  onClick: () => void;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setOffset({ x: px * 8, y: py * 8 });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
        active
          ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm dark:border-cyan-300/70 dark:bg-cyan-400/20 dark:text-cyan-100 dark:shadow-[0_0_18px_rgba(34,211,238,0.25)]"
          : "border-border bg-card text-muted-foreground hover:border-blue-300 hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/25 dark:hover:text-white",
      )}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
    >
      {label}
    </button>
  );
}

export function TrendDashboard() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [nicheKey, setNicheKey] = useState("fitness");
  const [customNiche, setCustomNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrendIdeasResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<PlatformChip>("All");
  const [signingOut, setSigningOut] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [analysesUsedThisMonth, setAnalysesUsedThisMonth] = useState(0);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState<(typeof ANALYSIS_PROGRESS_STEPS)[number]>(
    ANALYSIS_PROGRESS_STEPS[0],
  );
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [favoriteNiches, setFavoriteNiches] = useState<string[]>([]);
  const [nicheHistory, setNicheHistory] = useState<string[]>([]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(ONBOARDING_DISMISSED_KEY);
      if (!dismissed) {
        setShowOnboarding(true);
      }
    } catch {
      /* ignore localStorage errors */
    }
  }, []);

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("theme");
      const nextTheme = savedTheme === "light" ? "light" : "dark";
      setTheme(nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      const fav = window.localStorage.getItem(NICHE_FAVORITES_KEY);
      if (fav) setFavoriteNiches(JSON.parse(fav) as string[]);
      const hist = window.localStorage.getItem(NICHE_HISTORY_KEY);
      if (hist) setNicheHistory(JSON.parse(hist) as string[]);
    } catch {
      /* ignore localStorage errors */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        window.localStorage.setItem("theme", next);
      } catch {
        /* ignore localStorage errors */
      }
      return next;
    });
  }, []);

  const toggleFavoriteNiche = useCallback((value: string) => {
    if (!value || value === "custom") return;
    setFavoriteNiches((prev) => {
      const next = prev.includes(value) ? prev.filter((x) => x !== value) : [value, ...prev];
      try {
        window.localStorage.setItem(NICHE_FAVORITES_KEY, JSON.stringify(next.slice(0, 8)));
      } catch {
        /* ignore localStorage errors */
      }
      return next.slice(0, 8);
    });
  }, []);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try {
      window.localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
    } catch {
      /* ignore localStorage errors */
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TREND_RESULTS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as TrendIdeasResponse;
      if (parsed?.trend_ideas && Array.isArray(parsed.trend_ideas)) {
        setData(parsed);
      }
    } catch {
      /* ignore malformed cache */
    }
  }, []);

  const effectiveNiche =
    nicheKey === "custom"
      ? (customNiche.trim() || "fitness")
      : nicheKey;

  const selectedTrend =
    data && selectedIndex !== null
      ? (data.trend_ideas[selectedIndex] ?? null)
      : null;

  const sheetOpen = isMobile && selectedIndex !== null;

  const filteredTrends = (data?.trend_ideas ?? []).filter((trend) => {
    const matchesPlatform =
      platformFilter === "All" || hasPlatform(trend, platformFilter);
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q.length === 0 ||
      trend.trend.toLowerCase().includes(q) ||
      trend.ideas.some(
        (idea) =>
          idea.idea.toLowerCase().includes(q) ||
          idea.hook.toLowerCase().includes(q) ||
          (idea.optimized_title ?? "").toLowerCase().includes(q),
      );
    return matchesPlatform && matchesQuery;
  });

  const runAnalysis = useCallback(async () => {
    if (plan === "free" && analysesUsedThisMonth >= FREE_ANALYSIS_LIMIT) {
      setError(
        "You have reached your free plan limit (5 analyses this month). Upgrade to continue.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedIndex(null);
    setAnalysisProgress(8);
    setAnalysisStep(ANALYSIS_PROGRESS_STEPS[0]);
    let stepIndex = 0;
    const timer = window.setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, ANALYSIS_PROGRESS_STEPS.length - 1);
      setAnalysisStep(ANALYSIS_PROGRESS_STEPS[stepIndex]);
      setAnalysisProgress((prev) => Math.min(prev + 23, 92));
    }, 1300);
    try {
      const res = await fetchTrendIdeas(effectiveNiche);
      setData(res);
      setAnalysisProgress(100);
      recordTrendAnalysis(effectiveNiche);
      setNicheHistory((prev) => {
        const next = [effectiveNiche, ...prev.filter((n) => n !== effectiveNiche)].slice(0, 5);
        try {
          window.localStorage.setItem(NICHE_HISTORY_KEY, JSON.stringify(next));
        } catch {
          /* ignore localStorage errors */
        }
        return next;
      });

      if (userId && plan === "free") {
        const nextCount = analysesUsedThisMonth + 1;
        const supabase = getSupabaseClient();
        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({ analyses_used_this_month: nextCount })
          .eq("user_id", userId);
        if (updateError) {
          throw new Error(updateError.message);
        }
        setAnalysesUsedThisMonth(nextCount);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      window.clearInterval(timer);
      setLoading(false);
      window.setTimeout(() => {
        setAnalysisProgress(0);
      }, 450);
    }
  }, [analysesUsedThisMonth, effectiveNiche, plan, userId]);

  useEffect(() => {
    try {
      if (data) {
        window.localStorage.setItem(TREND_RESULTS_STORAGE_KEY, JSON.stringify(data));
      } else {
        window.localStorage.removeItem(TREND_RESULTS_STORAGE_KEY);
      }
    } catch {
      /* ignore storage errors */
    }
  }, [data]);

  const signOut = useCallback(async () => {
    setSigningOut(true);
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }, [router]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const setUserState = (user: User | null) => {
      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? "");
      setUserAvatar((user?.user_metadata?.avatar_url as string | undefined) ?? "");
    };

    const loadSubscription = async (uid: string | null) => {
      if (!uid) {
        setPlan("free");
        setAnalysesUsedThisMonth(0);
        setSubscriptionLoading(false);
        return;
      }

      setSubscriptionLoading(true);
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("user_id, plan, analyses_used_this_month, updated_at")
        .eq("user_id", uid)
        .maybeSingle<UserSubscriptionRow>();

      if (error) {
        setSubscriptionLoading(false);
        return;
      }

      let row = data;
      if (!row) {
        const { data: inserted, error: insertError } = await supabase
          .from("user_subscriptions")
          .insert({ user_id: uid, plan: "free", analyses_used_this_month: 0 })
          .select("user_id, plan, analyses_used_this_month, updated_at")
          .single<UserSubscriptionRow>();
        if (!insertError && inserted) {
          row = inserted;
        }
      }

      if (row) {
        let usage = row.analyses_used_this_month ?? 0;
        if (row.plan === "free" && !isSameMonth(row.updated_at)) {
          usage = 0;
          const { error: resetError } = await supabase
            .from("user_subscriptions")
            .update({ analyses_used_this_month: 0 })
            .eq("user_id", uid);
          if (resetError) {
            console.error("Failed to reset monthly usage:", resetError.message);
          }
        }
        setPlan(row.plan);
        setAnalysesUsedThisMonth(usage);
      }

      setSubscriptionLoading(false);
    };

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserState(user);
      await loadSubscription(user?.id ?? null);
    };

    void loadUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUserState(nextUser);
      void loadSubscription(nextUser?.id ?? null);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const freeLimitReached = plan === "free" && analysesUsedThisMonth >= FREE_ANALYSIS_LIMIT;
  const favoriteSet = new Set(favoriteNiches);
  const favoriteOptions = NICHE_OPTIONS.filter((o) => favoriteSet.has(o.value));
  const regularOptions = NICHE_OPTIONS.filter((o) => !favoriteSet.has(o.value));
  const canFavoriteNiche = nicheKey !== "custom" && !nicheKey.startsWith("__group_");
  const selectedNicheIsFavorite = favoriteSet.has(nicheKey);

  const saveIdea = useCallback(
    async ({ trend, idea }: { trend: string; idea: VideoIdea }) => {
      const supabase = getSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("You must be logged in to save ideas.");
      }

      const { error: insertError } = await supabase.from("saved_ideas").insert({
        user_id: user.id,
        idea_title: idea.optimized_title?.trim() || idea.hook || trend || "Saved idea",
        idea_content: idea.script?.trim() || idea.idea,
        thumbnail_url: idea.thumbnail_url?.trim() || "",
        niche: effectiveNiche,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }
    },
    [effectiveNiche],
  );

  return (
    <div className="relative flex min-h-svh flex-col overflow-x-hidden bg-background pb-[calc(4.75rem+env(safe-area-inset-bottom))] text-foreground lg:pb-0">
      {showOnboarding ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 dark:bg-slate-950/80">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl dark:border-white/15 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-foreground dark:text-white">Welcome to Trend Engine</h2>
            <p className="mt-2 text-sm text-muted-foreground dark:text-slate-300">
              Get started in under two minutes:
            </p>
            <ol className="mt-4 space-y-2 text-sm text-foreground dark:text-slate-200">
              <li>1. Pick your niche</li>
              <li>2. Run your first analysis</li>
              <li>3. Save your best ideas</li>
            </ol>
            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                onClick={dismissOnboarding}
                className="bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 hover:opacity-90"
              >
                Let&apos;s go
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <div
        className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-50"
        style={{
          background:
            "radial-gradient(circle at 10% 10%, rgba(59,130,246,0.16), transparent 40%), radial-gradient(circle at 85% 18%, rgba(59,130,246,0.1), transparent 36%), radial-gradient(circle at 50% 90%, rgba(59,130,246,0.08), transparent 42%)",
        }}
      />
      <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
        {loading ? (
          <div className="border-b border-blue-200 bg-blue-50 px-4 py-2 dark:border-cyan-400/20 dark:bg-cyan-500/5">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-1">
              <p className="text-xs font-medium text-blue-700 dark:text-cyan-200">{analysisStep}</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 dark:from-cyan-400 dark:to-indigo-500"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : null}
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
          <Link
            href="/"
            className="fluid-transition rounded-md px-1 text-xs font-medium text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-white sm:text-sm"
          >
            ← Home
          </Link>
          <div className="hidden h-6 w-px bg-border sm:block dark:bg-white/10" aria-hidden />
          <div className="flex min-w-0 items-center gap-2">
            <div className="rounded-lg border border-blue-200 bg-blue-100 p-1.5 dark:border-cyan-300/30 dark:bg-cyan-400/10">
              <Sparkles className="size-4 text-blue-600 dark:text-cyan-300" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
                Trend Engine
              </h1>
              <p className="hidden text-xs text-muted-foreground dark:text-slate-400 sm:block">
                AI trend intelligence for creators
              </p>
            </div>
          </div>
          <div className="ml-auto" />
          <div className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-100 sm:px-3 sm:text-xs">
            Plan: {formatPlanLabel(plan)}
            {plan === "free" ? ` (${analysesUsedThisMonth}/${FREE_ANALYSIS_LIMIT})` : ""}
          </div>
          <Link
            href="/analytics"
            className="fluid-transition hidden rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground hover:bg-muted dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800 lg:inline-flex"
          >
            Analytics
          </Link>
          <Link
            href="/profile"
            className="fluid-transition hidden rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground hover:bg-muted dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800 lg:inline-flex"
          >
            Profile
          </Link>
          <Link
            href="/saved"
            className="fluid-transition hidden rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground hover:bg-muted dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800 lg:inline-flex"
          >
            Saved Ideas
          </Link>
          <Link
            href="/trending"
            className="fluid-transition hidden rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground hover:bg-muted dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800 lg:inline-flex"
          >
            Trending
          </Link>
          <Link
            href="/alerts"
            className="fluid-transition hidden rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground hover:bg-muted dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800 lg:inline-flex"
          >
            Trend Alerts
          </Link>
          <Link
            href="/calendar"
            className="fluid-transition hidden rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground hover:bg-muted dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800 lg:inline-flex"
          >
            Calendar
          </Link>
          <Link
            href="/profile"
            className="fluid-transition hidden max-w-[220px] items-center gap-2 rounded-full border border-border bg-card px-2 py-1 text-xs text-foreground hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-slate-800 md:flex"
          >
            {userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userAvatar}
                alt=""
                className="size-6 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700 dark:bg-cyan-400/20 dark:text-cyan-200">
                {userEmail ? userEmail.slice(0, 1).toUpperCase() : "U"}
              </div>
            )}
            <span className="min-w-0 truncate">{userEmail || "Logged in user"}</span>
          </Link>
          <Button
            type="button"
            variant="outline"
            disabled={signingOut}
            onClick={signOut}
            className="h-9 border-border bg-card px-2.5 text-foreground hover:bg-muted dark:border-white/20 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800 sm:px-3"
          >
            {signingOut ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span className="hidden sm:inline">Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={toggleTheme}
            className="h-9 border-border bg-card px-2.5 text-foreground hover:bg-muted dark:border-white/20 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800 sm:px-3"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
          </Button>
          <div className="grid w-full grid-cols-1 gap-2 pt-1 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:pt-0">
            <span className="text-xs text-muted-foreground dark:text-slate-400">Niche</span>
            <label className="sr-only" htmlFor="niche-select">
              Niche
            </label>
            <select
              id="niche-select"
              value={nicheKey}
              onChange={(e) => setNicheKey(e.target.value)}
              disabled={loading}
              className={cn(
                "h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm sm:h-9 sm:w-auto",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:focus-visible:ring-cyan-300",
              )}
            >
              {favoriteOptions.length > 0 ? (
                <optgroup label="Favorites">
                  {favoriteOptions.map((o) => (
                    <option
                      key={o.value}
                      value={o.value}
                      disabled={o.value.startsWith("__group_")}
                    >
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {regularOptions.map((o) => (
                <option
                  key={o.value}
                  value={o.value}
                  disabled={o.value.startsWith("__group_")}
                >
                  {o.label}
                </option>
              ))}
            </select>
            {canFavoriteNiche ? (
              <button
                type="button"
                onClick={() => toggleFavoriteNiche(nicheKey)}
                className={cn(
                  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors sm:h-9 sm:w-auto",
                  selectedNicheIsFavorite
                    ? "border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200 dark:border-amber-300/40 dark:bg-amber-400/15 dark:text-amber-100 dark:hover:bg-amber-400/25"
                    : "border-border bg-card text-foreground hover:bg-muted dark:border-white/15 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                )}
                aria-pressed={selectedNicheIsFavorite}
              >
                <Star
                  className={cn(
                    "size-4",
                    selectedNicheIsFavorite && "fill-current",
                  )}
                />
                <span>{selectedNicheIsFavorite ? "Favorite" : "Save niche"}</span>
              </button>
            ) : null}
            {nicheKey === "custom" ? (
              <input
                type="text"
                value={customNiche}
                onChange={(e) => setCustomNiche(e.target.value)}
                placeholder="Your niche…"
                disabled={loading}
                className={cn(
                  "h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm sm:h-9 sm:w-48",
                  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:ring-cyan-300",
                )}
              />
            ) : null}
            <Button
              type="button"
              disabled={loading || freeLimitReached || subscriptionLoading}
              onClick={runAnalysis}
              className="h-10 w-full bg-primary text-white hover:opacity-90 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-500 dark:text-slate-950 sm:h-9 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating…
                </>
              ) : (
                "Analyze trends"
              )}
            </Button>
            {freeLimitReached ? (
              <Link
                href="/pricing"
                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-fuchsia-300/40 dark:bg-fuchsia-500/15 dark:text-fuchsia-100 dark:hover:bg-fuchsia-500/25"
              >
                Upgrade plan
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground hover:bg-muted dark:border-white/20 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              Feedback
            </button>
            {loading ? (
              <p className="w-full text-xs text-muted-foreground dark:text-slate-400 sm:w-auto">
                This may take a moment while we scan live trends across platforms.
              </p>
            ) : null}
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-3 pb-3 sm:px-4 sm:pb-4">
          {nicheHistory.length > 0 ? (
            <div className="-mx-3 flex items-center gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              <span className="text-xs text-muted-foreground dark:text-slate-500">Recent niches:</span>
              {nicheHistory.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setNicheKey(entry)}
                  className="fluid-transition shrink-0 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-cyan-300/40 dark:hover:text-cyan-100"
                >
                  {entry}
                </button>
              ))}
            </div>
          ) : null}
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground dark:text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trends, hooks, or idea titles..."
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-cyan-300/60"
            />
          </div>
          <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            {PLATFORM_CHIPS.map((chip) => {
              const active = platformFilter === chip;
              return (
                <FilterChip
                  key={chip}
                  label={chip}
                  active={active}
                  onClick={() => setPlatformFilter(chip)}
                />
              );
            })}
          </div>
        </div>
      </header>

      {error ? (
        <div className="mx-4 mt-4 rounded-lg border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {freeLimitReached ? (
        <div className="mx-4 mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-fuchsia-400/40 dark:bg-fuchsia-500/10 dark:text-fuchsia-100">
          You have used all 5 free analyses this month. Upgrade to Creator or Pro
          for higher limits.
          <Link href="/pricing" className="ml-2 underline underline-offset-2">
            View pricing
          </Link>
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-4">
          {loading && !data ? (
            <LoadingState niche={effectiveNiche} />
          ) : null}

          {!loading && !data && !error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-muted-foreground dark:text-slate-400">
              <Sparkles className="size-8 text-cyan-600 dark:text-cyan-300" />
              <p className="text-sm font-medium text-foreground dark:text-slate-200">No data yet</p>
              <p className="max-w-sm text-xs">
                Choose a niche and run <strong>Analyze trends</strong> to load
                cards from your FastAPI backend.
              </p>
            </div>
          ) : null}

          {data ? (
            filteredTrends.length > 0 ? (
              <div className="mx-auto max-w-[1100px] columns-1 gap-3 sm:columns-2 sm:gap-4 xl:columns-3">
                {filteredTrends.map((trend, index) => {
                  const realIndex = data.trend_ideas.findIndex(
                    (t) => t.trend === trend.trend,
                  );
                  return (
                    <TrendCard
                      key={`${trend.trend}-${index}`}
                      trend={trend}
                      index={index}
                      selected={selectedIndex === realIndex}
                      onSelect={() => setSelectedIndex(realIndex)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
                <p className="text-sm font-medium text-foreground dark:text-slate-200">
                  No trends match this filter
                </p>
                <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">
                  Try another platform chip or clear your search terms.
                </p>
              </div>
            )
          ) : null}
        </div>

        <aside
          className={cn(
            "hidden w-[min(420px,40vw)] shrink-0 border-l border-border bg-card lg:block dark:border-white/10 dark:bg-slate-900/70",
            "transition-all duration-300",
            selectedTrend
              ? "translate-x-0 opacity-100"
              : "translate-x-2 opacity-90",
          )}
        >
          <ScrollArea className="h-[calc(100vh-57px)]">
            {!isMobile ? (
              <IdeaPanel
                trend={selectedTrend}
                trendIdeas={data?.trend_ideas ?? []}
                niche={effectiveNiche}
                onSaveIdea={saveIdea}
              />
            ) : null}
          </ScrollArea>
        </aside>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) setSelectedIndex(null);
        }}
      >
        <SheetContent className="w-full overflow-y-auto border-border bg-card p-0 dark:border-white/10 dark:bg-slate-950 sm:max-w-lg">
          <SheetHeader className="border-b border-border px-4 py-3 text-left dark:border-white/10">
            <SheetTitle className="text-base">Video ideas</SheetTitle>
          </SheetHeader>
          {isMobile ? (
            <IdeaPanel
              trend={selectedTrend}
              trendIdeas={data?.trend_ideas ?? []}
              niche={effectiveNiche}
              onSaveIdea={saveIdea}
            />
          ) : null}
        </SheetContent>
      </Sheet>
      {feedbackOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 dark:bg-slate-950/75">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-4 dark:border-white/15 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-foreground dark:text-slate-100">Send feedback</h3>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us what to improve..."
              className="mt-3 h-28 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            {feedbackSent ? (
              <p className="mt-2 text-xs text-emerald-300">Thanks! Feedback sent.</p>
            ) : null}
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFeedbackOpen(false)}
                className="rounded-md border border-border px-3 py-2 text-xs text-foreground hover:bg-muted dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  const message = feedbackText.trim();
                  if (!message) return;
                  try {
                    const res = await fetch("/api/idea-feedback", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        idea_title: "General dashboard feedback",
                        feedback_type: "written",
                        message,
                      }),
                    });
                    if (!res.ok) {
                      let detail = "Failed to send feedback.";
                      try {
                        const body = (await res.json()) as { error?: string };
                        if (body.error) detail = body.error;
                      } catch {
                        // ignore parse failures
                      }
                      throw new Error(detail);
                    }
                    setFeedbackSent(true);
                    setFeedbackText("");
                    window.setTimeout(() => {
                      setFeedbackSent(false);
                      setFeedbackOpen(false);
                    }, 900);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to send feedback.");
                  }
                }}
                className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-white dark:bg-cyan-400 dark:text-slate-950"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-white/10 dark:bg-slate-950/95 lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-6">
          <Link href="/" className="flex flex-col items-center text-[11px] text-muted-foreground dark:text-slate-300">
            <Home className="mb-1 size-4" />
            Home
          </Link>
          <Link
            href="/analytics"
            className="flex flex-col items-center text-[11px] text-muted-foreground dark:text-slate-300"
          >
            <BarChart3 className="mb-1 size-4" />
            Stats
          </Link>
          <Link
            href="/saved"
            className="flex flex-col items-center text-[11px] text-muted-foreground dark:text-slate-300"
          >
            <Bookmark className="mb-1 size-4" />
            Saved
          </Link>
          <Link
            href="/alerts"
            className="flex flex-col items-center text-[11px] text-muted-foreground dark:text-slate-300"
          >
            <Bell className="mb-1 size-4" />
            Alerts
          </Link>
          <Link
            href="/calendar"
            className="flex flex-col items-center text-[11px] text-muted-foreground dark:text-slate-300"
          >
            <Calendar className="mb-1 size-4" />
            Calendar
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center text-[11px] text-muted-foreground dark:text-slate-300"
          >
            <UserRound className="mb-1 size-4" />
            Profile
          </Link>
        </div>
      </nav>
    </div>
  );
}
