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
  "bluesky",
  "threads",
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
  bluesky: "Bluesky",
  threads: "Threads",
  pinterest: "Pinterest",
  youtube: "YouTube Shorts",
  reddit: "Reddit conversations",
  google_trends: "Search demand",
  news: "News context",
};

const HOW_TO_USE_TRENDS = [
  "Pick one topic people are reacting to.",
  "Connect it to your niche.",
  "Turn it into a reaction, explainer, checklist, or short script.",
] as const;

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
    case "bluesky":
      return TrendingUp;
    case "threads":
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
      setError(e instanceof Error ? e.message : "Could not load trends.");
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
    <main className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border bg-background/95 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/95 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-[0.08em] text-foreground hover:text-primary sm:tracking-[0.16em]"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground dark:bg-cyan-400 dark:text-slate-950">
              T
            </span>
            <span className="truncate">TrendBoard</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm sm:gap-5">
            <Link
              href="/pricing"
              className="hidden font-medium text-muted-foreground hover:text-foreground sm:inline"
            >
              Pricing
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Open app
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <h1 className="max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
              Find a trend. Make a post.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
              This page shows live topics creators can react to right now.
              TrendBoard checks social, search, community, and news signals so
              you can spot ideas before they feel old.
            </p>
          </div>

          <aside className="rounded-3xl border border-border bg-card p-5 dark:border-white/10 dark:bg-slate-950/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:border-emerald-400/30 dark:text-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live trends
                {relative ? (
                  <span className="text-emerald-700/90 dark:text-emerald-300/90">
                    updated {relative}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void load(true)}
                disabled={refreshing}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60 dark:border-white/15 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                {refreshing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Refresh
              </button>
            </div>
            <h2 className="mt-5 text-base font-bold">How to use this page</h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              {HOW_TO_USE_TRENDS.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary dark:bg-cyan-400/10 dark:text-cyan-200">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>

        <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 dark:border-white/10 dark:bg-slate-950/70 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-muted-foreground">
            Want the app to turn a signal into hooks, scripts, hashtags, and
            source links?
          </p>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
          >
            Open TrendBoard
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-14 flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm">Pulling creator-platform signals...</p>
          </div>
        ) : error ? (
          <div className="mt-10 rounded-2xl border border-destructive/40 bg-destructive/10 px-5 py-4 text-sm text-destructive-foreground">
            <p className="font-medium">Couldn&apos;t reach the trend API.</p>
            <p className="mt-1 text-destructive/90">{error}</p>
            <button
              type="button"
              onClick={() => void load(true)}
              className="mt-4 rounded-lg bg-destructive/20 px-4 py-2 text-destructive-foreground hover:bg-destructive/30"
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
                    "fluid-transition flex flex-col rounded-2xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur-sm",
                    "dark:border-white/10 dark:bg-slate-900/60",
                    "animate-in fade-in slide-in-from-bottom-2 duration-500",
                  )}
                  style={{ animationDelay: `${si * 70}ms` }}
                >
                  <div className="flex items-center gap-3 border-b border-border pb-4 dark:border-white/10">
                    <div className="rounded-xl border border-primary/20 bg-primary/10 p-2 dark:border-cyan-400/25 dark:bg-cyan-400/10">
                      <Icon className="size-5 text-primary dark:text-cyan-300" />
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
                      <li className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground dark:border-white/15">
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
                                    "group-hover:text-primary dark:group-hover:text-cyan-200",
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
                                  "hover:border-primary/25 hover:bg-muted/60 dark:hover:bg-white/5",
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

      </section>
    </main>
  );
}
