"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  Flame,
  Loader2,
  Music2,
  Newspaper,
  Radio,
  RefreshCw,
  TrendingUp,
  Youtube,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import type { DailyTrendingResponse } from "@/lib/daily-trending-types";
import { cn } from "@/lib/utils";

const REFRESH_MS = 75_000;

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
    case "reddit":
      return Flame;
    case "hackernews":
      return Radio;
    default:
      return TrendingUp;
  }
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
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-6rem] h-80 w-80 animate-pulse rounded-full bg-primary/10 blur-3xl dark:bg-fuchsia-500/20" />
        <div className="absolute right-[-5rem] top-10 h-96 w-96 animate-pulse rounded-full bg-secondary/70 blur-3xl dark:bg-cyan-500/15" />
        <div className="absolute bottom-[-7rem] left-1/3 h-96 w-96 rounded-full bg-primary/5 blur-3xl dark:bg-indigo-500/15" />
      </div>

      <header className="relative z-20 mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-7">
        <div className="flex flex-wrap items-center gap-6">
          <Link
            href="/"
            className="fluid-transition text-sm font-semibold tracking-[0.18em] text-foreground hover:text-primary"
          >
            Content Buddy
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <span className="font-medium text-primary">Trending</span>
            <Link
              href="/pricing"
              className="fluid-transition font-medium text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="/dashboard"
              className="fluid-transition font-medium text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200",
              "shadow-[0_0_20px_rgba(16,185,129,0.25)]",
            )}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live pulse
            {relative ? (
              <span className="text-emerald-700/90 dark:text-emerald-300/90">
                · updated {relative}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="fluid-transition inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60 dark:border-white/15 dark:bg-slate-900/80 dark:hover:bg-slate-800"
          >
            {refreshing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refresh
          </button>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary dark:text-cyan-200">
            Today&apos;s momentum
          </p>
          <h1 className="mt-4 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl dark:from-white dark:via-cyan-100 dark:to-fuchsia-200">
            Top trends across the open web
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A live-weighted snapshot from Google Trends, news wires, Shorts,
            TikTok, Reddit, and Hacker News — auto-refreshes every minute or so
            for a real-time feel.
          </p>
        </div>

        {loading ? (
          <div className="mt-14 flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm">Pulling cross-platform signals…</p>
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
            {data.sections.map((section, si) => {
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
                        No live rows yet — sources may be rate-limited.
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

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-muted/45 px-6 py-5 dark:border-white/10 dark:bg-gradient-to-r dark:from-slate-950/80 dark:via-slate-900/60 dark:to-indigo-950/40">
          <p className="max-w-xl text-sm text-muted-foreground">
            Turn these signals into full scripts, hooks, and thumbnails in the
            dashboard — niches from breaking news to gaming.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg hover:opacity-95 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-500 dark:text-slate-950"
          >
            Open Content Buddy
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
