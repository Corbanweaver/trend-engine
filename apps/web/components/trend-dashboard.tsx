"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Loader2,
  LogOut,
  Music2,
  Search,
  Sparkles,
  Star,
  Instagram,
  Calendar,
  Bookmark,
  Youtube,
  UserRound,
  Bell,
  ShieldCheck,
  type LucideIcon,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CREDIT_COSTS,
  getMonthlyCreditLimit,
  getRemainingCredits,
  shouldResetMonthlyUsage,
} from "@/lib/credits";
import { NICHE_OPTIONS } from "@/lib/niches";
import { getSupabaseClient } from "@/lib/supabase";
import { getVideoIdeaThumbnailUrls } from "@/lib/trend-ideas-types";
import type {
  TrendIdea,
  TrendIdeasResponse,
  VideoIdea,
} from "@/lib/trend-ideas-types";
import { computeEngagementRaw, engagementHeat } from "@/lib/trend-metrics";
import { cn } from "@/lib/utils";
import { recordTrendAnalysis } from "@/lib/user-stats";

const TREND_RESULTS_STORAGE_KEY = "trend_dashboard:last_results";
const LAST_ANALYZED_STORAGE_KEY = "trend_dashboard:last_analyzed";
const ONBOARDING_DISMISSED_KEY = "trend_dashboard:onboarding_dismissed";
const NICHE_FAVORITES_KEY = "trend_dashboard:niche_favorites";
const NICHE_HISTORY_KEY = "trend_dashboard:niche_history";
const CALENDAR_PLAN_STORAGE_KEY = "calendar:plans";
const ANALYSIS_PROGRESS_STEPS = [
  "Starting live trend scan...",
  "Checking TikTok, X, Instagram, Pinterest, and YouTube...",
  "Reading social, news, and search momentum...",
  "Generating creator-ready ideas and scripts...",
  "Attaching organic source thumbnails...",
  "Packaging your trend cards...",
] as const;

type SubscriptionPlan = "free" | "creator" | "pro";

type UserSubscriptionRow = {
  user_id: string;
  plan: SubscriptionPlan;
  analyses_used_this_month: number;
  credits_used_this_month: number;
  credits_reset_at: string;
  stripe_subscription_id?: string | null;
  stripe_subscription_status?: string | null;
  stripe_cancel_at_period_end?: boolean | null;
  stripe_current_period_end?: string | null;
};

type CreditSnapshot = {
  plan: SubscriptionPlan;
  creditsUsed: number;
  creditsLimit: number;
  creditsRemaining: number;
  analysesUsedThisMonth: number;
  isAdmin?: boolean;
};

type LastAnalyzedSnapshot = {
  niche: string;
  analyzedAt: string;
  trendCount: number;
  ideaCount: number;
};

type TrendIdeasApiResponse = TrendIdeasResponse & {
  credits?: CreditSnapshot;
  requiredCredits?: number;
  error?: string;
};

function formatPlanLabel(plan: SubscriptionPlan): "Free" | "Creator" | "Pro" {
  if (plan === "creator") return "Creator";
  if (plan === "pro") return "Pro";
  return "Free";
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
    ...(trend.x_posts ?? []),
    ...trend.pinterest_pins,
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

async function fetchTrendIdeas(niche: string): Promise<TrendIdeasApiResponse> {
  const res = await fetch("/api/trend-ideas/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ niche }),
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { detail?: unknown; error?: unknown };
      const errorDetail = body?.error ?? body?.detail;
      if (errorDetail != null) {
        detail =
          typeof errorDetail === "string"
            ? errorDetail
            : JSON.stringify(errorDetail);
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }

  return res.json() as Promise<TrendIdeasApiResponse>;
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatShortDateTime(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatCurrentPlanLabel(
  plan: SubscriptionPlan,
  cancelAtPeriodEnd: boolean,
  currentPeriodEnd: string | null,
) {
  const label = formatPlanLabel(plan);
  if (plan === "free" || !cancelAtPeriodEnd) return label;
  const cancelDate = formatShortDate(currentPeriodEnd);
  return cancelDate ? `${label} cancels ${cancelDate}` : `${label} canceling`;
}

function isPaidStripeStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing" || status === "past_due";
}

function getUsablePlan(
  plan: SubscriptionPlan,
  stripeSubscriptionId: string | null | undefined,
  stripeSubscriptionStatus: string | null | undefined,
): SubscriptionPlan {
  if (plan === "free") return "free";
  if (!stripeSubscriptionId) return plan;
  return isPaidStripeStatus(stripeSubscriptionStatus) ? plan : "free";
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function buildIdeaSaveKey(trend: string, idea: VideoIdea) {
  const raw = [trend, idea.optimized_title, idea.hook, idea.angle, idea.idea]
    .filter(Boolean)
    .join("\n")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return `idea_${hashString(raw || trend || "saved_idea")}`;
}

type PlatformChip =
  | "All"
  | "TikTok"
  | "YouTube"
  | "Reddit"
  | "Instagram"
  | "Pinterest"
  | "X";

const PLATFORM_CHIPS: PlatformChip[] = [
  "All",
  "TikTok",
  "YouTube",
  "Reddit",
  "Instagram",
  "Pinterest",
  "X",
];

const platformIconStyles: Record<string, string> = {
  TikTok: "bg-pink-500/20 text-pink-200 border-pink-400/40",
  YouTube: "bg-red-500/20 text-red-200 border-red-400/40",
  Reddit: "bg-orange-500/20 text-orange-200 border-orange-400/40",
  Instagram: "bg-purple-500/20 text-purple-200 border-purple-400/40",
  Pinterest: "bg-rose-500/20 text-rose-200 border-rose-400/40",
  X: "bg-sky-500/20 text-sky-200 border-sky-400/40",
};

const platformGlyph: Record<string, string> = {
  TikTok: "T",
  YouTube: "Y",
  Reddit: "R",
  Instagram: "IG",
  Pinterest: "P",
  X: "X",
};

function hasPlatform(
  trend: TrendIdea,
  platform: Exclude<PlatformChip, "All">,
): boolean {
  if (platform === "TikTok") {
    return (
      trend.tiktok_videos.length > 0 ||
      trend.tiktok_videos.some(
        (v) => (v as { platform?: string }).platform === "tiktok",
      )
    );
  }
  if (platform === "YouTube") {
    return (
      trend.example_videos.length > 0 ||
      trend.example_videos.some(
        (v) => (v as { platform?: string }).platform === "youtube",
      )
    );
  }
  if (platform === "Reddit") {
    return (
      trend.reddit_posts.length > 0 ||
      trend.reddit_posts.some(
        (p) => (p as { platform?: string }).platform === "reddit",
      )
    );
  }
  if (platform === "Instagram") {
    return (
      trend.instagram_posts.length > 0 ||
      trend.instagram_posts.some(
        (p) => (p as { platform?: string }).platform === "instagram",
      )
    );
  }
  if (platform === "Pinterest") {
    return (
      trend.pinterest_pins.length > 0 ||
      trend.pinterest_pins.some(
        (p) => (p as { platform?: string }).platform === "pinterest",
      )
    );
  }
  return (
    (trend.x_posts ?? []).length > 0 ||
    (trend.x_posts ?? []).some(
      (p) => (p as { platform?: string }).platform === "x",
    )
  );
}

function getPlatformBadges(trend: TrendIdea): string[] {
  const badges: string[] = [];
  if (hasPlatform(trend, "TikTok")) badges.push("TikTok");
  if (hasPlatform(trend, "YouTube")) badges.push("YouTube");
  if (hasPlatform(trend, "Reddit")) badges.push("Reddit");
  if (hasPlatform(trend, "Instagram")) badges.push("Instagram");
  if (hasPlatform(trend, "Pinterest")) badges.push("Pinterest");
  if (hasPlatform(trend, "X")) badges.push("X");
  return [...new Set(badges)].slice(0, 5);
}

function getCardVisual(trend: TrendIdea) {
  const youtubeThumb = trend.example_videos.find(
    (v) => typeof v.thumbnail === "string" && v.thumbnail,
  )?.thumbnail as string | undefined;
  const pinterestImage = trend.pinterest_pins.find(
    (p) => typeof p.image_url === "string" && p.image_url,
  )?.image_url as string | undefined;
  const instagramImage = trend.instagram_posts.find(
    (p) =>
      (typeof p.thumbnail_url === "string" && p.thumbnail_url) ||
      (typeof p.media_url === "string" && p.media_url),
  ) as Record<string, unknown> | undefined;
  const tiktokCover = trend.tiktok_videos.find(
    (v) => typeof v.cover === "string" && v.cover,
  )?.cover as string | undefined;
  return (
    youtubeThumb ||
    pinterestImage ||
    (instagramImage?.thumbnail_url as string | undefined) ||
    (instagramImage?.media_url as string | undefined) ||
    tiktokCover ||
    null
  );
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

function normalizeExternalUrl(url: string, baseUrl: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${baseUrl}${trimmed}`;
  return trimmed;
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
  return typeof preferred === "string" && preferred.trim().length > 0
    ? normalizeExternalUrl(preferred, "https://www.reddit.com")
    : null;
}

function getInstagramUrl(trend: TrendIdea): string | null {
  const sourceKeys = ["url", "permalink", "link"] as const;
  const candidate = trend.instagram_posts.find((post) =>
    sourceKeys.some((key) => {
      const value = post[key];
      return typeof value === "string" && value.trim().length > 0;
    }),
  );
  if (!candidate) return null;
  const preferred = candidate.url ?? candidate.permalink ?? candidate.link;
  return typeof preferred === "string" && preferred.trim().length > 0
    ? preferred
    : null;
}

function getPinterestUrl(trend: TrendIdea): string | null {
  const candidate = trend.pinterest_pins.find((pin) => {
    const sourceKeys = ["url", "link", "permalink"] as const;
    return sourceKeys.some((key) => {
      const value = pin[key];
      return typeof value === "string" && value.trim().length > 0;
    });
  });
  if (!candidate) return null;
  const preferred = candidate.url ?? candidate.link ?? candidate.permalink;
  return typeof preferred === "string" && preferred.trim().length > 0
    ? preferred
    : null;
}

function getXUrl(trend: TrendIdea): string | null {
  const candidate = (trend.x_posts ?? []).find((post) => {
    const sourceKeys = ["url", "link", "permalink"] as const;
    return sourceKeys.some((key) => {
      const value = post[key];
      return typeof value === "string" && value.trim().length > 0;
    });
  });
  if (!candidate) return null;
  const preferred = candidate.url ?? candidate.link ?? candidate.permalink;
  return typeof preferred === "string" && preferred.trim().length > 0
    ? preferred
    : null;
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
  const momentumLabel =
    heat >= 85
      ? "Very strong"
      : heat >= 70
        ? "Strong"
        : heat >= 45
          ? "Building"
          : heat > 0
            ? "Early signal"
            : "No clear signal";
  const signalCount =
    trend.tiktok_videos.length +
    trend.instagram_posts.length +
    trend.example_videos.length +
    trend.reddit_posts.length +
    trend.google_news.length +
    trend.web_results.length +
    trend.pinterest_pins.length +
    (trend.x_posts ?? []).length +
    trend.medium_articles.length;
  const platformBadges = getPlatformBadges(trend);
  const visual = getCardVisual(trend);
  const youtubeUrl = getYouTubeUrl(trend);
  const tiktokUrl = getTikTokUrl(trend);
  const redditUrl = getRedditUrl(trend);
  const instagramUrl = getInstagramUrl(trend);
  const pinterestUrl = getPinterestUrl(trend);
  const xUrl = getXUrl(trend);
  const trendLabel = getTrendDetectedLabel(trend);
  const [imageFailed, setImageFailed] = useState(false);
  const showVisual = Boolean(visual && !imageFailed);

  useEffect(() => {
    setImageFailed(false);
  }, [visual]);

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
      style={{ animationDelay: `${Math.min(index, 10) * 70}ms` }}
      className={cn(
        "h-full w-full text-left transition-all duration-200 motion-safe:animate-card-in",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
      )}
    >
      <Card
        className={cn(
          "group relative flex h-full min-h-[31rem] cursor-pointer flex-col overflow-hidden rounded-[1.35rem] border-border bg-card text-foreground shadow-sm shadow-slate-900/8 dark:border-white/10 dark:bg-slate-900/95 dark:text-slate-100 dark:shadow-black/30",
          "transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/10 dark:hover:border-cyan-300/40 dark:hover:shadow-cyan-500/10",
          selected &&
            "ring-2 ring-cyan-300/80 shadow-[0_0_0_1px_rgba(56,189,248,0.5),0_0_36px_rgba(56,189,248,0.28)]",
        )}
      >
        {selected ? (
          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.22),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.18),transparent_55%)]" />
        ) : null}
        <div
          className={cn(
            "relative h-64 shrink-0 overflow-hidden border-b border-border dark:border-white/10 sm:h-72",
          )}
        >
          {showVisual && visual ? (
            // Using API-provided thumbnails when available.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={visual}
              alt={trend.trend}
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.35),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(244,114,182,0.3),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(99,102,241,0.25),transparent_40%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent dark:from-slate-950/80 dark:via-slate-950/20" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
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
          <div className="absolute bottom-3 left-3 right-3">
            <p className="line-clamp-2 text-lg font-bold leading-tight text-white drop-shadow">
              {trend.trend}
            </p>
            <p className="mt-1 text-xs font-medium text-white/80">
              {trendLabel}
            </p>
          </div>
        </div>
        <CardHeader className="space-y-3 pb-2">
          <div className="flex flex-col gap-3">
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
            <div className="rounded-2xl border border-border bg-muted/40 p-3 dark:border-white/10 dark:bg-white/5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
                Momentum
              </p>
              <p className="mt-0.5 flex items-baseline justify-between gap-3 text-lg font-bold tabular-nums leading-none text-foreground dark:text-white">
                <span className="text-sm">{momentumLabel}</span>
                <span>
                  {raw > 0 ? heat : "--"}
                  {raw > 0 ? (
                    <span className="text-xs font-normal text-muted-foreground dark:text-slate-400">
                      /100
                    </span>
                  ) : null}
                </span>
              </p>
              <p className="mt-2 text-xs leading-snug text-muted-foreground dark:text-slate-400">
                {signalCount > 0
                  ? `Based on ${signalCount} social, search, and creator-platform signal${signalCount === 1 ? "" : "s"}. Higher means more people are already reacting or searching.`
                  : "Waiting on enough live social and search signals to score this trend."}
              </p>
            </div>
          </div>
          <CardTitle className="sr-only">{trend.trend}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-primary transition-all dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-500"
              style={{ width: raw > 0 ? `${heat}%` : "0%" }}
            />
          </div>
          {youtubeUrl ||
          tiktokUrl ||
          redditUrl ||
          instagramUrl ||
          pinterestUrl ||
          xUrl ? (
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
              {instagramUrl ? (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    platformIconStyles.Instagram,
                    "hover:bg-purple-500/30",
                  )}
                >
                  <Instagram className="size-3.5" />
                  View on Instagram
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
              {pinterestUrl ? (
                <a
                  href={pinterestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    platformIconStyles.Pinterest,
                    "hover:bg-rose-500/30",
                  )}
                >
                  <span className="text-xs font-bold">P</span>
                  View on Pinterest
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
              {xUrl ? (
                <a
                  href={xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    platformIconStyles.X,
                    "hover:bg-sky-500/30",
                  )}
                >
                  <span className="text-xs font-bold">X</span>
                  View on X
                  <ExternalLink className="size-3.5" />
                </a>
              ) : null}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="mt-auto pt-0 text-xs text-muted-foreground dark:text-slate-400">
          {trend.ideas.length} AI idea{trend.ideas.length === 1 ? "" : "s"} -
          Click for details
          <ChevronRight className="ml-1 size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </CardFooter>
      </Card>
    </div>
  );
}

type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

function DashboardNavLink({ item }: { item: DashboardNavItem }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      title={item.label}
      className={cn(
        "group flex items-center justify-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
        "text-muted-foreground hover:bg-muted hover:text-foreground dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white",
        item.active &&
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300",
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span className="hidden xl:inline">{item.label}</span>
    </Link>
  );
}

function LoadingState({
  niche,
  step,
  progress,
  elapsedSeconds,
}: {
  niche: string;
  step: string;
  progress: number;
  elapsedSeconds: number;
}) {
  const elapsedDisplay = `${Math.floor(elapsedSeconds / 60)}m ${String(
    elapsedSeconds % 60,
  ).padStart(2, "0")}s`;
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
      <div className="relative flex items-center justify-center">
        <div className="absolute size-28 animate-ping rounded-full bg-cyan-500/15" />
        <div className="absolute size-20 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300" />
        <div className="relative rounded-full border border-cyan-400/40 bg-slate-900/80 p-5 shadow-[0_0_40px_rgba(34,211,238,0.18)]">
          <Sparkles className="size-8 text-primary dark:text-cyan-300" />
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-base font-semibold text-foreground dark:text-slate-100">
          Crafting ideas for {niche}
        </p>
        <p className="max-w-md text-sm text-muted-foreground dark:text-slate-400">
          {step}
        </p>
        <div className="mx-auto h-2 w-[min(28rem,80vw)] overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-400 transition-all duration-700"
            style={{ width: `${Math.max(8, progress)}%` }}
          />
        </div>
        <p className="text-xs text-slate-400">
          Time running:{" "}
          <span className="font-medium text-slate-200">{elapsedDisplay}</span> -
          This usually takes 30 to 90 seconds while we scan sources and generate
          source links and thumbnails. Leave this tab open and don&apos;t
          refresh.
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
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
        active
          ? "border-primary/30 bg-primary/10 text-primary shadow-sm dark:border-cyan-300/70 dark:bg-cyan-400/20 dark:text-cyan-100 dark:shadow-[0_0_18px_rgba(34,211,238,0.25)]"
          : "border-border bg-card text-muted-foreground hover:border-primary/25 hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/25 dark:hover:text-white",
      )}
    >
      {label}
    </button>
  );
}

export function TrendDashboard() {
  const router = useRouter();
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [stripeCancelAtPeriodEnd, setStripeCancelAtPeriodEnd] = useState(false);
  const [stripeCurrentPeriodEnd, setStripeCurrentPeriodEnd] = useState<
    string | null
  >(null);
  const [analysesUsedThisMonth, setAnalysesUsedThisMonth] = useState(0);
  const [creditsUsedThisMonth, setCreditsUsedThisMonth] = useState(0);
  const [creditsLimit, setCreditsLimit] = useState(
    getMonthlyCreditLimit("free"),
  );
  const [creditsRemaining, setCreditsRemaining] = useState(
    getMonthlyCreditLimit("free"),
  );
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisElapsedSeconds, setAnalysisElapsedSeconds] = useState(0);
  const [lastAnalyzed, setLastAnalyzed] = useState<LastAnalyzedSnapshot | null>(
    null,
  );
  const [analysisStep, setAnalysisStep] = useState<
    (typeof ANALYSIS_PROGRESS_STEPS)[number]
  >(ANALYSIS_PROGRESS_STEPS[0]);
  const [favoriteNiches, setFavoriteNiches] = useState<string[]>([]);
  const [nicheHistory, setNicheHistory] = useState<string[]>([]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const saveIdeaLocksRef = useRef<Set<string>>(new Set());

  const applyCreditSnapshot = useCallback((snapshot: CreditSnapshot) => {
    setIsAdmin(Boolean(snapshot.isAdmin));
    setPlan(snapshot.plan);
    setAnalysesUsedThisMonth(snapshot.analysesUsedThisMonth);
    setCreditsUsedThisMonth(snapshot.creditsUsed);
    setCreditsLimit(snapshot.creditsLimit);
    setCreditsRemaining(snapshot.creditsRemaining);
  }, []);

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
      window.localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
      const fav = window.localStorage.getItem(NICHE_FAVORITES_KEY);
      if (fav) setFavoriteNiches(JSON.parse(fav) as string[]);
      const hist = window.localStorage.getItem(NICHE_HISTORY_KEY);
      if (hist) setNicheHistory(JSON.parse(hist) as string[]);
    } catch {
      /* ignore localStorage errors */
    }
  }, []);

  const toggleFavoriteNiche = useCallback((value: string) => {
    if (!value || value === "custom") return;
    setFavoriteNiches((prev) => {
      const next = prev.includes(value)
        ? prev.filter((x) => x !== value)
        : [value, ...prev];
      try {
        window.localStorage.setItem(
          NICHE_FAVORITES_KEY,
          JSON.stringify(next.slice(0, 8)),
        );
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
      if (raw) {
        const parsed = JSON.parse(raw) as TrendIdeasResponse;
        if (parsed?.trend_ideas && Array.isArray(parsed.trend_ideas)) {
          setData(parsed);
        }
      }
      const lastRaw = window.localStorage.getItem(LAST_ANALYZED_STORAGE_KEY);
      if (lastRaw) {
        const parsedLast = JSON.parse(lastRaw) as LastAnalyzedSnapshot;
        if (parsedLast?.analyzedAt && parsedLast?.niche) {
          setLastAnalyzed(parsedLast);
        }
      }
    } catch {
      /* ignore malformed cache */
    }
  }, []);

  const effectiveNiche =
    nicheKey === "custom" ? customNiche.trim() || "fitness" : nicheKey;

  const selectedTrend =
    data && selectedIndex !== null
      ? (data.trend_ideas[selectedIndex] ?? null)
      : null;

  const sheetOpen = selectedIndex !== null;

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
    if (!isAdmin && creditsRemaining < CREDIT_COSTS.analysis) {
      setError(
        `You need ${CREDIT_COSTS.analysis} credits to run a full trend analysis. Upgrade for more monthly credits.`,
      );
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedIndex(null);
    setAnalysisElapsedSeconds(0);
    setAnalysisProgress(8);
    setAnalysisStep(ANALYSIS_PROGRESS_STEPS[0]);
    let stepIndex = 0;
    let elapsedSeconds = 0;
    const timer = window.setInterval(() => {
      elapsedSeconds += 1;
      setAnalysisElapsedSeconds(elapsedSeconds);
      const nextStepIndex = Math.min(
        Math.floor(elapsedSeconds / 4),
        ANALYSIS_PROGRESS_STEPS.length - 1,
      );
      if (nextStepIndex !== stepIndex) {
        stepIndex = nextStepIndex;
        setAnalysisStep(ANALYSIS_PROGRESS_STEPS[stepIndex]);
      }
      setAnalysisProgress(Math.min(Math.round((elapsedSeconds / 75) * 94), 94));
    }, 1000);
    try {
      const res = await fetchTrendIdeas(effectiveNiche);
      setData(res);
      const analyzedSnapshot = {
        niche: effectiveNiche,
        analyzedAt: new Date().toISOString(),
        trendCount: res.trend_ideas.length,
        ideaCount: res.trend_ideas.reduce(
          (sum, trend) => sum + trend.ideas.length,
          0,
        ),
      };
      setLastAnalyzed(analyzedSnapshot);
      try {
        window.localStorage.setItem(
          LAST_ANALYZED_STORAGE_KEY,
          JSON.stringify(analyzedSnapshot),
        );
      } catch {
        /* ignore localStorage errors */
      }
      if (res.credits) {
        applyCreditSnapshot(res.credits);
      }
      setAnalysisProgress(100);
      recordTrendAnalysis(effectiveNiche);
      setNicheHistory((prev) => {
        const next = [
          effectiveNiche,
          ...prev.filter((n) => n !== effectiveNiche),
        ].slice(0, 5);
        try {
          window.localStorage.setItem(NICHE_HISTORY_KEY, JSON.stringify(next));
        } catch {
          /* ignore localStorage errors */
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      window.clearInterval(timer);
      setLoading(false);
      window.setTimeout(() => {
        setAnalysisProgress(0);
        setAnalysisElapsedSeconds(0);
      }, 450);
    }
  }, [applyCreditSnapshot, creditsRemaining, effectiveNiche, isAdmin]);

  useEffect(() => {
    try {
      if (data) {
        window.localStorage.setItem(
          TREND_RESULTS_STORAGE_KEY,
          JSON.stringify(data),
        );
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
      setUserEmail(user?.email ?? "");
      setUserAvatar(
        (user?.user_metadata?.avatar_url as string | undefined) ?? "",
      );
    };

    const loadAdminStatus = async () => {
      try {
        const response = await fetch("/api/admin/status", {
          cache: "no-store",
        });
        if (!response.ok) {
          setIsAdmin(false);
          return;
        }
        const body = (await response.json()) as { isAdmin?: boolean };
        setIsAdmin(Boolean(body.isAdmin));
      } catch {
        setIsAdmin(false);
      }
    };

    const loadSubscription = async (uid: string | null) => {
      if (!uid) {
        setIsAdmin(false);
        setPlan("free");
        setAnalysesUsedThisMonth(0);
        setCreditsUsedThisMonth(0);
        setCreditsLimit(getMonthlyCreditLimit("free"));
        setCreditsRemaining(getMonthlyCreditLimit("free"));
        setStripeCancelAtPeriodEnd(false);
        setStripeCurrentPeriodEnd(null);
        setSubscriptionLoading(false);
        return;
      }

      setSubscriptionLoading(true);
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select(
          "user_id, plan, analyses_used_this_month, credits_used_this_month, credits_reset_at, stripe_subscription_id, stripe_subscription_status, stripe_cancel_at_period_end, stripe_current_period_end",
        )
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
          .insert({
            user_id: uid,
            plan: "free",
            analyses_used_this_month: 0,
            credits_used_this_month: 0,
          })
          .select(
            "user_id, plan, analyses_used_this_month, credits_used_this_month, credits_reset_at, stripe_subscription_id, stripe_subscription_status, stripe_cancel_at_period_end, stripe_current_period_end",
          )
          .single<UserSubscriptionRow>();
        if (!insertError && inserted) {
          row = inserted;
        }
      }

      if (row) {
        const planValue = getUsablePlan(
          row.plan ?? "free",
          row.stripe_subscription_id,
          row.stripe_subscription_status,
        );
        const staleMonth = shouldResetMonthlyUsage(row.credits_reset_at);
        const usage = staleMonth
          ? 0
          : Math.max(0, row.credits_used_this_month ?? 0);
        setPlan(planValue);
        setAnalysesUsedThisMonth(
          staleMonth ? 0 : (row.analyses_used_this_month ?? 0),
        );
        setCreditsUsedThisMonth(usage);
        setCreditsLimit(getMonthlyCreditLimit(planValue));
        setCreditsRemaining(getRemainingCredits(planValue, usage));
        setStripeCancelAtPeriodEnd(
          planValue !== "free" && Boolean(row.stripe_cancel_at_period_end),
        );
        setStripeCurrentPeriodEnd(row.stripe_current_period_end ?? null);
      }

      setSubscriptionLoading(false);
    };

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserState(user);
      await loadAdminStatus();
      await loadSubscription(user?.id ?? null);
    };

    void loadUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUserState(nextUser);
      void loadAdminStatus();
      void loadSubscription(nextUser?.id ?? null);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const analysisCreditBlocked =
    !isAdmin && creditsRemaining < CREDIT_COSTS.analysis;
  const favoriteSet = new Set(favoriteNiches);
  const favoriteOptions = NICHE_OPTIONS.filter((o) => favoriteSet.has(o.value));
  const regularOptions = NICHE_OPTIONS.filter((o) => !favoriteSet.has(o.value));
  const canFavoriteNiche =
    nicheKey !== "custom" && !nicheKey.startsWith("__group_");
  const selectedNicheIsFavorite = favoriteSet.has(nicheKey);
  const dashboardNavItems: DashboardNavItem[] = [
    { href: "/dashboard", label: "Create", icon: Sparkles, active: true },
    { href: "/saved", label: "Saved", icon: Bookmark },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/alerts", label: "Alerts", icon: Bell },
    { href: "/trending", label: "Trending", icon: BarChart3 },
    { href: "/profile", label: "Profile", icon: UserRound },
    { href: "/support", label: "Support", icon: HelpCircle },
    ...(isAdmin
      ? [
          {
            href: "/admin",
            label: "Admin",
            icon: ShieldCheck,
          } satisfies DashboardNavItem,
        ]
      : []),
  ];

  const buildSavedIdeaContent = useCallback(
    (trendName: string, idea: VideoIdea) => {
      const sourceTrend = data?.trend_ideas.find(
        (item) => item.trend === trendName,
      );
      const hookVariations = idea.hook_variations ?? [];
      const fullScript = idea.full_script?.trim();
      const hashtags = idea.hashtags ?? [];
      const sourceLinks = [
        ...(sourceTrend?.instagram_posts ?? []).map((post) => ({
          label: "Instagram",
          url: (post.url || post.permalink || post.link || "") as string,
          title: String(post.caption || post.title || "Instagram post"),
        })),
        ...(sourceTrend?.tiktok_videos ?? []).map((post) => ({
          label: "TikTok",
          url: String(post.url || post.link || post.webVideoUrl || ""),
          title: String(
            post.title || post.description || post.desc || "TikTok video",
          ),
        })),
        ...((sourceTrend?.x_posts ?? []) as Record<string, unknown>[]).map(
          (post) => ({
            label: "X",
            url: String(post.url || post.link || post.permalink || ""),
            title: String(post.title || post.snippet || "X post"),
          }),
        ),
        ...(sourceTrend?.example_videos ?? []).map((post) => ({
          label: "YouTube",
          url: String(post.url || post.link || ""),
          title: String(post.title || "YouTube video"),
        })),
        ...(sourceTrend?.pinterest_pins ?? []).map((post) => ({
          label: "Pinterest",
          url: String(post.url || post.link || post.permalink || ""),
          title: String(post.title || "Pinterest pin"),
        })),
        ...(sourceTrend?.reddit_posts ?? []).map((post) => ({
          label: "Reddit",
          url: String(post.url || post.permalink || ""),
          title: String(post.title || "Reddit discussion"),
        })),
        ...(sourceTrend?.google_news ?? []).map((post) => ({
          label: "News",
          url: String(post.url || post.link || ""),
          title: String(post.title || "News result"),
        })),
        ...(sourceTrend?.web_results ?? []).map((post) => ({
          label: "Web",
          url: String(post.url || post.link || ""),
          title: String(post.title || "Web result"),
        })),
      ].filter((item) => item.url);

      return [
        `Trend: ${trendName}`,
        `Niche: ${effectiveNiche}`,
        "",
        idea.hook ? `Hook:\n${idea.hook}` : "",
        idea.angle ? `Angle:\n${idea.angle}` : "",
        idea.idea ? `Concept:\n${idea.idea}` : "",
        idea.seo_description ? `SEO description:\n${idea.seo_description}` : "",
        hashtags.length
          ? `Hashtags:\n${hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)).join(" ")}`
          : "",
        hookVariations.length
          ? `Generated hook variations:\n${hookVariations.map((hook, index) => `${index + 1}. ${hook}`).join("\n")}`
          : "",
        fullScript ? `Full script:\n${fullScript}` : "",
        idea.script ? `Quick script:\n${idea.script}` : "",
        sourceLinks.length
          ? `Source links:\n${sourceLinks
              .slice(0, 16)
              .map((item) => `- ${item.label}: ${item.title}\n  ${item.url}`)
              .join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");
    },
    [data, effectiveNiche],
  );

  const saveIdea = useCallback(
    async ({
      trend,
      idea,
      mode = "saved",
    }: {
      trend: string;
      idea: VideoIdea;
      mode?: "saved" | "calendar";
    }) => {
      const supabase = getSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("You must be logged in to save ideas.");
      }

      const title =
        idea.optimized_title?.trim() || idea.hook || trend || "Saved idea";
      const saveKey = buildIdeaSaveKey(trend, idea);
      const lockKey = `save:${mode}:${user.id}:${saveKey}`;
      if (saveIdeaLocksRef.current.has(lockKey)) return;
      saveIdeaLocksRef.current.add(lockKey);

      try {
        let savedIdeaId = "";

        const { data: existing, error: findError } = await supabase
          .from("saved_ideas")
          .select("id")
          .eq("user_id", user.id)
          .eq("save_key", saveKey)
          .limit(1)
          .maybeSingle<{ id: string }>();

        if (findError) {
          throw new Error(findError.message);
        }

        if (existing?.id) {
          savedIdeaId = existing.id;
        }

        if (!savedIdeaId) {
          const { data: inserted, error: insertError } = await supabase
            .from("saved_ideas")
            .upsert(
              {
                user_id: user.id,
                save_key: saveKey,
                idea_title: title,
                idea_content: buildSavedIdeaContent(trend, idea),
                thumbnail_url: getVideoIdeaThumbnailUrls(idea)[0] ?? "",
                niche: effectiveNiche,
              },
              { onConflict: "user_id,save_key" },
            )
            .select("id")
            .single<{ id: string }>();

          if (insertError) {
            throw new Error(insertError.message);
          }
          savedIdeaId = inserted?.id ?? "";
        }

        if (!savedIdeaId) {
          throw new Error("Failed to save idea.");
        }

        if (mode === "calendar") {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dayKey = tomorrow.toISOString().slice(0, 10);
          const raw = window.localStorage.getItem(CALENDAR_PLAN_STORAGE_KEY);
          const map = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
          const existing = new Set(map[dayKey] ?? []);
          existing.add(savedIdeaId);
          map[dayKey] = [...existing];
          window.localStorage.setItem(
            CALENDAR_PLAN_STORAGE_KEY,
            JSON.stringify(map),
          );
        }
      } finally {
        saveIdeaLocksRef.current.delete(lockKey);
      }
    },
    [buildSavedIdeaContent, effectiveNiche],
  );

  return (
    <div className="min-h-svh overflow-x-hidden bg-[#f6f5f2] pb-[calc(4.75rem+env(safe-area-inset-bottom))] text-foreground dark:bg-slate-950 lg:pl-[5.5rem] lg:pb-0 xl:pl-56">
      {showOnboarding ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 dark:bg-slate-950/80">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl dark:border-white/15 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-foreground dark:text-white">
              Welcome to TrendBoard
            </h2>
            <p className="mt-2 text-sm text-muted-foreground dark:text-slate-300">
              Your first workflow takes just a few steps:
            </p>
            <ol className="mt-4 space-y-2 text-sm text-foreground dark:text-slate-200">
              <li>1. Pick your niche</li>
              <li>2. Run your first analysis</li>
              <li>3. Save your best idea with source links</li>
              <li>4. Move it to your content calendar</li>
            </ol>
            <p className="mt-4 text-xs text-muted-foreground dark:text-slate-400">
              Each analysis takes 30-90 seconds. If no result appears right
              away, keep this window open and the process will continue.
            </p>
            <div className="mt-6 flex justify-end">
              <Button
                type="button"
                onClick={dismissOnboarding}
                className="bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-500 dark:text-slate-950 dark:hover:opacity-90"
              >
                Let&apos;s go
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[5.5rem] flex-col border-r border-border bg-background/95 px-3 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/95 lg:flex xl:w-56">
        <Link
          href="/dashboard"
          className="mb-6 flex items-center justify-center gap-3 rounded-2xl px-3 py-2 text-primary dark:text-cyan-200 xl:justify-start"
          aria-label="TrendBoard dashboard"
        >
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground dark:bg-cyan-400 dark:text-slate-950">
            T
          </span>
          <span className="hidden text-sm font-bold tracking-tight xl:inline">
            TrendBoard
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {dashboardNavItems.map((item) => (
            <DashboardNavLink key={item.href} item={item} />
          ))}
        </nav>
        <button
          type="button"
          disabled={signingOut}
          onClick={signOut}
          className="group flex items-center justify-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-60 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white xl:justify-start"
          title="Logout"
        >
          {signingOut ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <LogOut className="size-5" />
          )}
          <span className="hidden xl:inline">
            {signingOut ? "Signing out" : "Logout"}
          </span>
        </button>
      </aside>
      <header className="sticky top-0 z-40 border-b border-border bg-[#f6f5f2]/95 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
        {loading ? (
          <div className="border-b border-primary/20 bg-accent/70 px-4 py-2 dark:border-cyan-400/20 dark:bg-cyan-500/5">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-1">
              <p className="text-xs font-medium text-primary dark:text-cyan-200">
                {analysisStep}
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-500"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : null}
        <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-3 px-3 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-2xl text-sm font-bold text-foreground dark:text-white lg:hidden"
            >
              <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-xs font-black text-primary-foreground dark:bg-cyan-400 dark:text-slate-950">
                T
              </span>
              <span>TrendBoard</span>
            </Link>
            <div className="hidden min-w-0 lg:block">
              <h1 className="truncate text-xl font-bold tracking-tight">
                Create ideas
              </h1>
              <p className="text-xs text-muted-foreground dark:text-slate-400">
                Pick a niche, scan live signals, save the best cards.
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                title={`${creditsUsedThisMonth} credits used this month across ${analysesUsedThisMonth} analyses`}
              >
                {isAdmin ? (
                  "Unlimited"
                ) : (
                  <>
                    {creditsRemaining}/{creditsLimit} credits
                  </>
                )}
              </div>
              <Link
                href="/profile"
                className="hidden items-center gap-2 rounded-full border border-border bg-card p-1.5 text-xs text-foreground shadow-sm hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 sm:flex"
                title={userEmail || "Profile"}
              >
                {userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userAvatar}
                    alt=""
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary dark:bg-cyan-400/20 dark:text-cyan-200">
                    {userEmail ? userEmail.slice(0, 1).toUpperCase() : "U"}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                className="hidden rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-sm hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 sm:inline-flex"
              >
                Feedback
              </button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border bg-card p-2 shadow-sm dark:border-white/10 dark:bg-slate-900/95">
            <div className="grid grid-cols-[1fr_auto] gap-2 md:grid-cols-[minmax(220px,360px)_1fr_auto_auto] md:items-center">
              <label className="sr-only" htmlFor="quick-niche-select">
                Niche
              </label>
              <select
                id="quick-niche-select"
                value={nicheKey}
                onChange={(e) => setNicheKey(e.target.value)}
                disabled={loading}
                className="h-12 rounded-[1.15rem] border border-border bg-background px-4 text-center text-base font-bold capitalize text-foreground outline-none focus:ring-2 focus:ring-primary/60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-cyan-300/60 sm:text-lg md:text-base"
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
              {nicheKey === "custom" ? (
                <input
                  type="text"
                  value={customNiche}
                  onChange={(e) => setCustomNiche(e.target.value)}
                  placeholder="Describe your niche..."
                  disabled={loading}
                  className="col-span-2 h-12 rounded-[1.15rem] border border-border bg-background px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-cyan-300/60 md:col-span-1"
                />
              ) : (
                <div className="hidden md:block" />
              )}
              {canFavoriteNiche ? (
                <button
                  type="button"
                  onClick={() => toggleFavoriteNiche(nicheKey)}
                  aria-label={
                    selectedNicheIsFavorite
                      ? "Remove niche from favorites"
                      : "Save niche as favorite"
                  }
                  aria-pressed={selectedNicheIsFavorite}
                  className={cn(
                    "inline-flex h-12 w-12 items-center justify-center gap-2 rounded-[1.15rem] border px-0 text-sm font-semibold transition-colors sm:w-auto sm:px-4",
                    selectedNicheIsFavorite
                      ? "border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200 dark:border-amber-300/40 dark:bg-amber-400/15 dark:text-amber-100 dark:hover:bg-amber-400/25"
                      : "border-border bg-background text-foreground hover:bg-muted dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-white/10",
                  )}
                >
                  <Star
                    className={cn(
                      "size-4",
                      selectedNicheIsFavorite && "fill-current",
                    )}
                  />
                  <span className="hidden md:inline">
                    {selectedNicheIsFavorite ? "Favorite" : "Favorite"}
                  </span>
                </button>
              ) : null}
              <Button
                type="button"
                disabled={
                  loading || analysisCreditBlocked || subscriptionLoading
                }
                onClick={runAnalysis}
                className="col-span-2 h-12 rounded-[1.15rem] bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 md:col-span-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {lastAnalyzed ? (
                <span className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm dark:bg-white/5 dark:text-slate-300">
                  Last analyzed{" "}
                  <span className="font-semibold text-foreground dark:text-white">
                    {lastAnalyzed.niche}
                  </span>{" "}
                  at{" "}
                  {formatShortDateTime(lastAnalyzed.analyzedAt) ?? "just now"}
                </span>
              ) : (
                <span className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm dark:bg-white/5 dark:text-slate-300">
                  Pick a niche, then tap Analyze
                </span>
              )}
              {analysisCreditBlocked ? (
                <Link
                  href="/pricing"
                  className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/15 dark:border-fuchsia-300/40 dark:bg-fuchsia-500/15 dark:text-fuchsia-100 dark:hover:bg-fuchsia-500/25"
                >
                  Upgrade for more credits
                </Link>
              ) : null}
              {nicheHistory.slice(0, 4).map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setNicheKey(entry)}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white"
                >
                  {entry}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="hidden">
          <Link
            href="/"
            className="fluid-transition rounded-md px-1 text-xs font-medium text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-white sm:text-sm"
          >
            ← Home
          </Link>
          <div
            className="hidden h-6 w-px bg-border sm:block dark:bg-white/10"
            aria-hidden
          />
          <div className="flex min-w-0 items-center gap-2">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-1.5 dark:border-cyan-300/30 dark:bg-cyan-400/10">
              <Sparkles className="size-4 text-primary dark:text-cyan-300" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
                TrendBoard
              </h1>
              <p className="hidden text-xs text-muted-foreground dark:text-slate-400 sm:block">
                AI trend intelligence for creators
              </p>
            </div>
          </div>
          <div className="ml-auto" />
          <div
            className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] text-primary dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-100 sm:px-3 sm:text-xs"
            title={`${creditsUsedThisMonth} credits used this month across ${analysesUsedThisMonth} analyses`}
          >
            {isAdmin ? (
              "Admin: unlimited credits"
            ) : (
              <>
                {formatCurrentPlanLabel(
                  plan,
                  stripeCancelAtPeriodEnd,
                  stripeCurrentPeriodEnd,
                )}
                : {creditsRemaining}/{creditsLimit} credits
              </>
            )}
          </div>
          {isAdmin ? (
            <Link
              href="/admin"
              className="fluid-transition hidden items-center gap-1 rounded-md border border-primary/25 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/15 dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-100 dark:hover:bg-cyan-400/15 lg:inline-flex"
            >
              <ShieldCheck className="size-3.5" />
              Admin
            </Link>
          ) : null}
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
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary dark:bg-cyan-400/20 dark:text-cyan-200">
                {userEmail ? userEmail.slice(0, 1).toUpperCase() : "U"}
              </div>
            )}
            <span className="min-w-0 truncate">
              {userEmail || "Logged in user"}
            </span>
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
            asChild
            className="h-9 border-border bg-card px-2.5 text-foreground hover:bg-muted dark:border-white/20 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800 sm:px-3"
          >
            <Link href="/support">Support</Link>
          </Button>
          <div className="grid w-full grid-cols-1 gap-2 pt-1 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:pt-0">
            <span className="text-xs text-muted-foreground dark:text-slate-400">
              Niche
            </span>
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
                <span>
                  {selectedNicheIsFavorite ? "Favorite" : "Save niche"}
                </span>
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
              disabled={loading || analysisCreditBlocked || subscriptionLoading}
              onClick={runAnalysis}
              className="h-10 w-full bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-500 dark:text-slate-950 sm:h-9 sm:w-auto"
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
            {analysisCreditBlocked ? (
              <Link
                href="/pricing"
                className="rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/15 dark:border-fuchsia-300/40 dark:bg-fuchsia-500/15 dark:text-fuchsia-100 dark:hover:bg-fuchsia-500/25"
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
                This may take a moment while we scan live trends across
                platforms.
              </p>
            ) : null}
            {lastAnalyzed ? (
              <p className="w-full text-xs text-muted-foreground dark:text-slate-400 sm:w-auto">
                Last analyzed{" "}
                <span className="font-medium text-foreground dark:text-slate-200">
                  {lastAnalyzed.niche}
                </span>{" "}
                at {formatShortDateTime(lastAnalyzed.analyzedAt) ?? "just now"}{" "}
                with{" "}
                <span className="tabular-nums">{lastAnalyzed.trendCount}</span>{" "}
                trends.
              </p>
            ) : null}
          </div>
        </div>
        <div className="hidden">
          {nicheHistory.length > 0 ? (
            <div className="-mx-3 flex items-center gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              <span className="text-xs text-muted-foreground dark:text-slate-500">
                Recent niches:
              </span>
              {nicheHistory.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setNicheKey(entry)}
                  className="fluid-transition shrink-0 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground hover:border-primary/30 hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-cyan-300/40 dark:hover:text-cyan-100"
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

      {analysisCreditBlocked ? (
        <div className="mx-4 mt-4 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary dark:border-fuchsia-400/40 dark:bg-fuchsia-500/10 dark:text-fuchsia-100">
          You need {CREDIT_COSTS.analysis} credits for another full trend
          analysis. Upgrade to Creator or Pro for higher monthly credits.
          <Link href="/pricing" className="ml-2 underline underline-offset-2">
            View pricing
          </Link>
        </div>
      ) : null}

      <div className="min-h-0">
        <div className="mx-auto min-w-0 max-w-[1500px] p-3 sm:p-5">
          {loading && !data ? (
            <LoadingState
              niche={effectiveNiche}
              step={analysisStep}
              progress={analysisProgress}
              elapsedSeconds={analysisElapsedSeconds}
            />
          ) : null}

          {!loading && !data && !error ? (
            <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center justify-center gap-4 rounded-[2rem] border border-dashed border-border bg-card p-10 text-center text-muted-foreground shadow-sm dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-400">
              <div className="flex size-14 items-center justify-center rounded-3xl bg-primary/10 dark:bg-cyan-400/10">
                <Sparkles className="size-7 text-primary dark:text-cyan-300" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground dark:text-slate-100">
                  Start with one niche
                </p>
                <p className="mt-1 max-w-md text-sm">
                  The board fills with image-first trend cards. Open any card to
                  see hooks, scripts, hashtags, and save actions.
                </p>
              </div>
            </div>
          ) : null}

          {data ? (
            filteredTrends.length > 0 ? (
              <div className="grid auto-rows-fr grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) setSelectedIndex(null);
        }}
      >
        <SheetContent className="w-full overflow-y-auto border-border bg-card p-0 dark:border-white/10 dark:bg-slate-950 sm:max-w-2xl">
          <SheetHeader className="border-b border-border px-4 py-3 text-left dark:border-white/10">
            <SheetTitle className="text-base">Video ideas</SheetTitle>
          </SheetHeader>
          <IdeaPanel
            trend={selectedTrend}
            trendIdeas={data?.trend_ideas ?? []}
            niche={effectiveNiche}
            onSaveIdea={saveIdea}
          />
        </SheetContent>
      </Sheet>
      {feedbackOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 dark:bg-slate-950/75">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-4 dark:border-white/15 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-foreground dark:text-slate-100">
              Send feedback
            </h3>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us what to improve..."
              className="mt-3 h-28 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            {feedbackSent ? (
              <p className="mt-2 text-xs text-emerald-300">
                Thanks! Feedback sent.
              </p>
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
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Failed to send feedback.",
                    );
                  }
                }}
                className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground dark:bg-cyan-400 dark:text-slate-950"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-white/10 dark:bg-slate-950/95 lg:hidden">
        <div
          className={cn(
            "mx-auto grid max-w-lg",
            isAdmin ? "grid-cols-7" : "grid-cols-6",
          )}
        >
          <Link
            href="/dashboard"
            className="flex flex-col items-center text-[11px] text-primary dark:text-cyan-200"
          >
            <Sparkles className="mb-1 size-4" />
            Create
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
          {isAdmin ? (
            <Link
              href="/admin"
              className="flex flex-col items-center text-[11px] text-primary dark:text-cyan-200"
            >
              <ShieldCheck className="mb-1 size-4" />
              Admin
            </Link>
          ) : null}
        </div>
      </nav>
    </div>
  );
}
