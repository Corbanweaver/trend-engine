"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { IdeaPanel } from "@/components/idea-panel";
import { Badge } from "@/components/ui/badge";
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

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "mb-4 w-full break-inside-avoid text-left transition-shadow",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <Card
        className={cn(
          "cursor-pointer hover:shadow-md",
          selected && "ring-2 ring-primary",
        )}
      >
        <CardHeader className="space-y-3 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="secondary" className="font-medium">
              {platformLabel}
            </Badge>
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Engagement
              </p>
              <p className="text-lg font-bold tabular-nums leading-none">
                {raw > 0 ? heat : "—"}
                {raw > 0 ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    /100
                  </span>
                ) : null}
              </p>
              {raw > 0 ? (
                <p className="text-[10px] text-muted-foreground">
                  raw {raw.toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>
          <CardTitle className="text-base leading-snug">{trend.trend}</CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: raw > 0 ? `${heat}%` : "0%" }}
            />
          </div>
        </CardContent>
        <CardFooter className="pt-0 text-xs text-muted-foreground">
          {trend.ideas.length} AI idea{trend.ideas.length === 1 ? "" : "s"} ·
          Click for details
        </CardFooter>
      </Card>
    </button>
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
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            ← Home
          </Link>
          <div className="hidden h-6 w-px bg-border sm:block" aria-hidden />
          <h1 className="text-lg font-semibold tracking-tight">
            Trend dashboard
          </h1>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="niche-select">
              Niche
            </label>
            <select
              id="niche-select"
              value={nicheKey}
              onChange={(e) => setNicheKey(e.target.value)}
              disabled={loading}
              className={cn(
                "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
                  "h-9 w-40 rounded-md border border-input bg-background px-3 text-sm shadow-sm sm:w-48",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              />
            ) : null}
            <Button type="button" disabled={loading} onClick={runAnalysis}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                "Analyze trends"
              )}
            </Button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="mx-4 mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto p-4">
          {loading && !data ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-muted-foreground">
              <Loader2 className="size-10 animate-spin" />
              <p className="text-sm font-medium">
                Discovering trends for “{effectiveNiche}”
              </p>
              <p className="max-w-sm text-xs">
                Calling <code className="rounded bg-muted px-1">POST /trend-ideas/</code> — this can take ~20s while sources and AI run.
              </p>
            </div>
          ) : null}

          {!loading && !data && !error ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center text-muted-foreground">
              <p className="text-sm font-medium">No data yet</p>
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

        <aside className="hidden w-[min(420px,40vw)] shrink-0 border-l bg-card lg:block">
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
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-lg">
          <SheetHeader className="border-b px-4 py-3 text-left">
            <SheetTitle className="text-base">Video ideas</SheetTitle>
          </SheetHeader>
          <IdeaPanel trend={selectedTrend} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
