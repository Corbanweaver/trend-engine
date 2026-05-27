"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  Flame,
  Instagram,
  Loader2,
  Music2,
  Newspaper,
  RefreshCw,
  TrendingUp,
  Youtube,
} from "lucide-react";

import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing/marketing-shell";
import { apiFetch } from "@/lib/api";
import type {
  DailyPlatformSection,
  DailyTrendingResponse,
} from "@/lib/daily-trending-types";
import { cn } from "@/lib/utils";

const REFRESH_MS = 75_000;
const SOCIAL_SECTION_ORDER = [
  "tiktok",
  "instagram",
  "x",
  "pinterest",
  "youtube",
  "reddit",
  "google_trends",
  "news",
] as const;

const SOCIAL_SECTION_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram Reels",
  x: "X",
  pinterest: "Pinterest",
  youtube: "YouTube Shorts",
  reddit: "Reddit conversations",
  google_trends: "Search demand",
  news: "News context",
};

const TRENDING_PUBLIC_GUIDES = [
  {
    title: "Trending creator topics today",
    body: "Watch for topics that appear across more than one source, then connect them to a specific niche before filming.",
  },
  {
    title: "Platforms scanned",
    body: "TrendBoard checks creator platforms like TikTok, Instagram, X, Pinterest, YouTube Shorts, Reddit, search, and news context when available.",
  },
  {
    title: "Content examples",
    body: "Use a live signal as a reaction, quick explainer, myth check, carousel, Shorts script, or save-worthy checklist.",
  },
];

function sectionIcon(key: string) {
  switch (key) {
    case "google_trends":
      return TrendingUp;
    case "news":
      return Newspaper;
    case "youtube":
      return Youtube;
    case "tiktok":
      return Music2;
    case "instagram":
      return Instagram;
    case "x":
      return Flame;
    case "pinterest":
      return TrendingUp;
    case "reddit":
      return Flame;
    default:
      return TrendingUp;
  }
}

function socialSections(data: DailyTrendingResponse): DailyPlatformSection[] {
  const sectionsByKey = new Map(
    data.sections.map((section) => [section.key, section]),
  );
  return SOCIAL_SECTION_ORDER.map((key) => {
    const existing = sectionsByKey.get(key);
    return {
      key,
      label: SOCIAL_SECTION_LABELS[key],
      items: existing?.items ?? [],
    };
  });
}

function emptySectionMessage(key: string) {
  if (key === "instagram") {
    return "Waiting for live Instagram/Reels rows from the trend API.";
  }
  return "No live rows yet - this source may be warming up or rate-limited.";
}

function formatRelative(iso: string, tick: number): string {
  void tick;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export function TrendingLivePage() {
  const [data, setData] = useState<DailyTrendingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const hasLoadedOnce = useRef(false);

  const load = useCallback(async (isManual: boolean) => {
    if (isManual) setRefreshing(true);
    else if (!hasLoadedOnce.current) setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/trending/daily", { method: "GET" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as DailyTrendingResponse;
      setData(json);
      hasLoadedOnce.current = true;
    } catch (e) {
      setError(
        e instanceof Error && e.message.trim()
          ? e.message
          : "The live trend source did not respond.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => void load(false), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const relative = useMemo(
    () => (data?.updated_at ? formatRelative(data.updated_at, tick) : ""),
    [data?.updated_at, tick],
  );

  return (
    <main className="creator-page min-h-svh text-foreground">
      <MarketingHeader currentPath="/trending" />

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800",
              "shadow-[0_8px_24px_rgba(16,185,129,0.14)]",
            )}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live pulse
            {relative ? <span>- updated {relative}</span> : null}
          </div>
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="creator-outline-cta fluid-transition inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refresh
          </button>
        </div>

        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase text-primary">
            Social momentum
          </p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            What creators are reacting to now
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A creator-focused snapshot from TikTok, Instagram/Reels, YouTube
            Shorts, Reddit conversations, plus search and news context. It
            refreshes automatically so the page feels alive.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {TRENDING_PUBLIC_GUIDES.map((guide) => (
            <article
              key={guide.title}
              className="creator-card rounded-xl border border-border bg-card/90 p-5 shadow-sm"
            >
              <h2 className="text-base font-semibold">{guide.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {guide.body}
              </p>
            </article>
          ))}
        </div>

        {loading ? (
          <div className="mt-14 flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm">Pulling creator-platform signals...</p>
          </div>
        ) : error ? (
          <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <p className="font-medium">Live trend feed is warming up.</p>
            <p className="mt-1">
              The source feed did not respond in this preview. Refresh in a
              moment, or run a niche analysis to create idea cards directly.
            </p>
            <details className="mt-2 text-xs text-amber-800/80">
              <summary className="cursor-pointer font-medium">
                Technical detail
              </summary>
              <p className="mt-1">{error}</p>
            </details>
            <button
              type="button"
              onClick={() => void load(true)}
              className="mt-4 rounded-lg bg-amber-100 px-4 py-2 font-semibold text-amber-900 hover:bg-amber-200"
            >
              Try again
            </button>
          </div>
        ) : data ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {socialSections(data).map((section, si) => {
              const Icon = sectionIcon(section.key);
              return (
                <div
                  key={section.key}
                  className={cn(
                    "creator-card fluid-transition flex flex-col rounded-xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur-sm",
                    "animate-in fade-in slide-in-from-bottom-2 duration-500",
                  )}
                  style={{ animationDelay: `${si * 70}ms` }}
                >
                  <div className="flex items-center gap-3 border-b border-border pb-4">
                    <div className="rounded-lg border border-primary/20 bg-primary/10 p-2">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold">
                        {section.label}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {section.items.length} signals
                      </p>
                    </div>
                  </div>
                  <ul className="mt-4 flex max-h-[min(420px,50vh)] flex-col gap-2 overflow-y-auto pr-1">
                    {section.items.length === 0 ? (
                      <li className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                        {emptySectionMessage(section.key)}
                      </li>
                    ) : (
                      section.items.map((item, ii) => {
                        const href = (item.url || "").trim();
                        const inner = (
                          <>
                            <div className="min-w-0 flex-1">
                              <p
                                className={cn(
                                  "line-clamp-2 text-sm font-medium leading-snug text-foreground",
                                  href &&
                                    "group-hover:text-primary",
                                )}
                              >
                                {item.title}
                              </p>
                              {item.subtitle ? (
                                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                  {item.subtitle}
                                </p>
                              ) : null}
                              {item.meta ? (
                                <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/90">
                                  {item.meta}
                                </p>
                              ) : null}
                            </div>
                            {href ? (
                              <ExternalLink className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                            ) : null}
                          </>
                        );
                        return (
                          <li key={`${section.key}-${ii}`}>
                            {href ? (
                              <a
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(
                                  "group flex gap-3 rounded-xl border border-transparent px-2 py-2.5 transition-colors",
                                  "hover:border-primary/25 hover:bg-muted/60",
                                )}
                              >
                                {inner}
                              </a>
                            ) : (
                              <div className="flex gap-3 rounded-xl border border-transparent px-2 py-2.5">
                                {inner}
                              </div>
                            )}
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="creator-studio-panel mt-14 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border px-6 py-5">
          <p className="max-w-xl text-sm text-muted-foreground">
            Turn these signals into organic video idea cards, hooks, scripts,
            and source links on the analysis page.
          </p>
          <Link
            href="/analyze"
            className="creator-cta inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-primary-foreground"
          >
            Analyze trends
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
