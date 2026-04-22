"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Sparkles, Wand2 } from "lucide-react";

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
import type { TrendIdea, TrendIdeasResponse } from "@/lib/trend-ideas-types";
import {
  computeEngagementRaw,
  engagementHeat,
  primaryPlatform,
} from "@/lib/trend-metrics";
import { cn } from "@/lib/utils";

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

const platformBadgeStyles: Record<string, string> = {
  TikTok: "border-pink-400/40 bg-pink-500/10 text-pink-200",
  YouTube: "border-red-400/40 bg-red-500/10 text-red-200",
  Reddit: "border-orange-400/40 bg-orange-500/10 text-orange-200",
  Instagram: "border-purple-400/40 bg-purple-500/10 text-purple-200",
};

function getPlatformBadges(trend: TrendIdea): string[] {
  const badges: string[] = [];
  if (trend.tiktok_videos.length > 0) badges.push("TikTok");
  if (trend.example_videos.length > 0) badges.push("YouTube");
  if (trend.reddit_posts.length > 0) badges.push("Reddit");
  if (trend.instagram_posts.length > 0) badges.push("Instagram");
  if (badges.length === 0) badges.push("Reddit");
  return badges.slice(0, 4);
}

function TrendCard({
  trend,
  selected,
  onSelect,
}: {
  trend: TrendIdea;
  selected: boolean;
  onSelect: () => void;
}) {
  const raw = computeEngagementRaw(trend);
  const heat = engagementHeat(raw);
  const { label: platformLabel } = primaryPlatform(trend);
  const platformBadges = getPlatformBadges(trend);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "mb-4 w-full break-inside-avoid text-left transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
      )}
    >
      <Card
        className={cn(
          "cursor-pointer border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-950/95 text-slate-100 shadow-lg shadow-black/30 hover:-translate-y-0.5 hover:border-cyan-300/40 hover:shadow-cyan-500/20",
          selected && "ring-2 ring-cyan-300/80",
        )}
      >
        <CardHeader className="space-y-3 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {platformBadges.map((badge) => (
                <span
                  key={`${trend.trend}-${badge}`}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                    platformBadgeStyles[badge],
                  )}
                >
                  {badge}
                </span>
              ))}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Engagement
              </p>
              <p className="text-lg font-bold tabular-nums leading-none text-white">
                {raw > 0 ? heat : "—"}
                {raw > 0 ? (
                  <span className="text-xs font-normal text-slate-400">
                    /100
                  </span>
                ) : null}
              </p>
              {raw > 0 ? (
                <p className="text-[10px] text-slate-500">
                  raw {raw.toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>
          <CardTitle className="text-base leading-snug text-slate-100">
            {trend.trend}
          </CardTitle>
          <p className="text-xs text-slate-400">
            Primary signal: {platformLabel}
          </p>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all"
              style={{ width: raw > 0 ? `${heat}%` : "0%" }}
            />
          </div>
        </CardContent>
        <CardFooter className="pt-0 text-xs text-slate-400">
          {trend.ideas.length} AI idea{trend.ideas.length === 1 ? "" : "s"} ·
          Click for details
          <ChevronRight className="ml-1 size-3" />
        </CardFooter>
      </Card>
    </button>
  );
}

function LoadingState({ niche }: { niche: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
      <div className="relative flex items-center justify-center">
        <div className="absolute size-20 animate-ping rounded-full bg-cyan-500/20" />
        <div className="relative rounded-full border border-cyan-400/40 bg-slate-900/80 p-5">
          <Wand2 className="size-8 text-cyan-300" />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-base font-semibold text-slate-100">
          Crafting ideas for {niche}
        </p>
        <p className="max-w-md text-sm text-slate-400">
          Scanning live trends across platforms and generating high-converting
          short-form concepts.
        </p>
      </div>
      <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border border-white/10 bg-slate-900/60"
          />
        ))}
      </div>
    </div>
  );
}

export function TrendDashboard() {
  const isMobile = useIsMobile();
  const [nicheKey, setNicheKey] = useState("fitness");
  const [customNiche, setCustomNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrendIdeasResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const effectiveNiche =
    nicheKey === "custom"
      ? (customNiche.trim() || "fitness")
      : nicheKey;

  const selectedTrend =
    data && selectedIndex !== null
      ? (data.trend_ideas[selectedIndex] ?? null)
      : null;

  const sheetOpen = isMobile && selectedIndex !== null;

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedIndex(null);
    try {
      const res = await fetchTrendIdeas(effectiveNiche);
      setData(res);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [effectiveNiche]);

  return (
    <div className="flex min-h-svh flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="text-sm font-medium text-slate-400 hover:text-white"
          >
            ← Home
          </Link>
          <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden />
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 p-1.5">
              <Sparkles className="size-4 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Content Idea Maker
              </h1>
              <p className="text-xs text-slate-400">
                AI trend intelligence for creators
              </p>
            </div>
          </div>
          <div className="ml-auto rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            API: {getApiBaseUrl()}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Niche</span>
            <label className="sr-only" htmlFor="niche-select">
              Niche
            </label>
            <select
              id="niche-select"
              value={nicheKey}
              onChange={(e) => setNicheKey(e.target.value)}
              disabled={loading}
              className={cn(
                "h-9 rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-slate-100 shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
              )}
            >
              {NICHE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {nicheKey === "custom" ? (
              <input
                type="text"
                value={customNiche}
                onChange={(e) => setCustomNiche(e.target.value)}
                placeholder="Your niche…"
                disabled={loading}
                className={cn(
                  "h-9 w-40 rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-slate-100 shadow-sm sm:w-48",
                  "placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                )}
              />
            ) : null}
            <Button
              type="button"
              disabled={loading}
              onClick={runAnalysis}
              className="bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 hover:opacity-90"
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
          </div>
        </div>
      </header>

      {error ? (
        <div className="mx-4 mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto p-4">
          {loading && !data ? (
            <LoadingState niche={effectiveNiche} />
          ) : null}

          {!loading && !data && !error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-slate-400">
              <Sparkles className="size-8 text-cyan-300" />
              <p className="text-sm font-medium text-slate-200">No data yet</p>
              <p className="max-w-sm text-xs">
                Choose a niche and run <strong>Analyze trends</strong> to load
                cards from your FastAPI backend.
              </p>
            </div>
          ) : null}

          {data ? (
            <div className="mx-auto max-w-[1100px] columns-1 gap-4 sm:columns-2 xl:columns-3">
              {data.trend_ideas.map((trend, index) => (
                <TrendCard
                  key={`${trend.trend}-${index}`}
                  trend={trend}
                  selected={selectedIndex === index}
                  onSelect={() => setSelectedIndex(index)}
                />
              ))}
            </div>
          ) : null}
        </div>

        <aside className="hidden w-[min(420px,40vw)] shrink-0 border-l border-white/10 bg-slate-900/70 lg:block">
          <ScrollArea className="h-[calc(100vh-57px)]">
            <IdeaPanel trend={selectedTrend} />
          </ScrollArea>
        </aside>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) setSelectedIndex(null);
        }}
      >
        <SheetContent className="w-full overflow-y-auto border-white/10 bg-slate-950 p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-white/10 px-4 py-3 text-left">
            <SheetTitle className="text-base">Video ideas</SheetTitle>
          </SheetHeader>
          <IdeaPanel trend={selectedTrend} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
