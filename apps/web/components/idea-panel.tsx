"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookmarkPlus,
  CalendarPlus,
  FileText,
  Loader2,
  ThumbsDown,
  ThumbsUp,
  WandSparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { trackUiEvent } from "@/lib/telemetry";
import { getVideoIdeaThumbnailUrls } from "@/lib/trend-ideas-types";
import type { TrendIdea, VideoIdea } from "@/lib/trend-ideas-types";
import { cn } from "@/lib/utils";

function tiktokTagSearchUrl(tag: string): string {
  const clean = tag.replace(/^#/, "").trim();
  if (!clean) return "https://www.tiktok.com/search";
  return `https://www.tiktok.com/search?q=${encodeURIComponent(`#${clean}`)}`;
}

async function postIdeaEnrichment<T>(
  path: "generate-hooks" | "generate-hashtags" | "generate-full-script",
  body: Record<string, string>,
): Promise<T> {
  const res = await fetch("/api/trend-ideas/enrich", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, payload: body }),
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errBody = (await res.json()) as {
        detail?: unknown;
        error?: unknown;
      };
      const errorDetail = errBody?.error ?? errBody?.detail;
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
  const json = (await res.json()) as { data?: T } & T;
  return (json.data ?? json) as T;
}

function estimateVideoLength(idea: VideoIdea): string {
  const scriptWords =
    idea.script?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  if (scriptWords > 220) return "90-120 seconds";
  if (scriptWords > 120) return "60-90 seconds";
  return "30-60 seconds";
}

function estimateBestPostTime(ideaIndex: number): string {
  const slots = [
    "Tuesday 6-9pm",
    "Wednesday 5-8pm",
    "Thursday 6-9pm",
    "Sunday 4-7pm",
  ];
  return slots[ideaIndex % slots.length];
}

function buildOutline(idea: VideoIdea): string[] {
  if (idea.script) {
    const bullets = idea.script
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- ") || line.startsWith("* "))
      .map((line) => line.replace(/^[-*]\s+/, ""))
      .filter(Boolean);
    if (bullets.length >= 3) return bullets.slice(0, 4);
  }
  return [
    `Open with: ${idea.hook || "a bold problem statement"}`,
    `Teach one clear insight about ${idea.angle || "the trend"}`,
    `Show a quick example viewers can copy today`,
    "Close with a CTA to comment or save",
  ];
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = regex.exec(text);
  let key = 0;

  while (match) {
    const start = match.index;
    const end = regex.lastIndex;
    if (start > lastIndex) {
      nodes.push(
        <span key={`text-${key++}`}>{text.slice(lastIndex, start)}</span>,
      );
    }
    nodes.push(<strong key={`bold-${key++}`}>{match[1]}</strong>);
    lastIndex = end;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`text-${key++}`}>{text.slice(lastIndex)}</span>);
  }

  return nodes.length ? nodes : [text];
}

function renderMarkdownLikeContent(text: string): React.ReactNode {
  const lines = text.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let key = 0;

  const flushList = () => {
    if (!listBuffer.length) return;
    blocks.push(
      <ul key={`list-${key++}`} className="list-disc space-y-1 pl-5 font-sans">
        {listBuffer.map((item, idx) => (
          <li
            key={`item-${idx}`}
            className="font-sans text-xs leading-relaxed text-foreground dark:text-slate-200"
          >
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ul>,
    );
    listBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const bulletMatch = line.match(/^[-*]\s+(.*)$/);

    if (bulletMatch) {
      listBuffer.push(bulletMatch[1]);
      continue;
    }

    flushList();
    if (!line) {
      blocks.push(<div key={`spacer-${key++}`} className="h-2" />);
      continue;
    }

    blocks.push(
      <p
        key={`p-${key++}`}
        className="font-sans text-xs leading-relaxed text-foreground dark:text-slate-200"
      >
        {renderInlineMarkdown(line)}
      </p>,
    );
  }

  flushList();
  return <div className="space-y-1 font-sans">{blocks}</div>;
}

export function IdeaPanel({
  trend,
  trendIdeas,
  niche,
  onSaveIdea,
}: {
  trend: TrendIdea | null;
  trendIdeas?: TrendIdea[];
  niche: string;
  onSaveIdea?: (payload: {
    trend: string;
    idea: VideoIdea;
    mode?: "saved" | "calendar";
  }) => Promise<void>;
}) {
  const [savingIdeaIndex, setSavingIdeaIndex] = useState<number | null>(null);
  const [savingCalendarIndex, setSavingCalendarIndex] = useState<number | null>(
    null,
  );
  const [savedIndexes, setSavedIndexes] = useState<Record<number, boolean>>({});
  const [calendarSavedIndexes, setCalendarSavedIndexes] = useState<
    Record<number, boolean>
  >({});
  const [errorByIndex, setErrorByIndex] = useState<Record<number, string>>({});
  const [ideaRatings, setIdeaRatings] = useState<Record<string, "up" | "down">>(
    {},
  );
  const saveInFlightRef = useRef<Set<string>>(new Set());

  const [trendingTagsByIndex, setTrendingTagsByIndex] = useState<
    Record<number, string[]>
  >({});
  const [tagsLoadingByIndex, setTagsLoadingByIndex] = useState<
    Record<number, boolean>
  >({});
  const [tagsErrorByIndex, setTagsErrorByIndex] = useState<
    Record<number, string>
  >({});

  const [hookListsByIndex, setHookListsByIndex] = useState<
    Record<number, string[]>
  >({});
  const [hooksLoadingByIndex, setHooksLoadingByIndex] = useState<
    Record<number, boolean>
  >({});
  const [hooksErrorByIndex, setHooksErrorByIndex] = useState<
    Record<number, string>
  >({});

  const [fullScriptByIndex, setFullScriptByIndex] = useState<
    Record<number, string>
  >({});
  const [fullScriptLoadingByIndex, setFullScriptLoadingByIndex] = useState<
    Record<number, boolean>
  >({});
  const [fullScriptErrorByIndex, setFullScriptErrorByIndex] = useState<
    Record<number, string>
  >({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("idea_ratings");
      if (!raw) return;
      setIdeaRatings(JSON.parse(raw) as Record<string, "up" | "down">);
    } catch {
      /* ignore malformed local cache */
    }
  }, []);

  useEffect(() => {
    setSavingIdeaIndex(null);
    setSavingCalendarIndex(null);
    setSavedIndexes({});
    setCalendarSavedIndexes({});
    setErrorByIndex({});
    setTrendingTagsByIndex({});
    setTagsLoadingByIndex({});
    setTagsErrorByIndex({});
    setHookListsByIndex({});
    setHooksLoadingByIndex({});
    setHooksErrorByIndex({});
    setFullScriptByIndex({});
    setFullScriptLoadingByIndex({});
    setFullScriptErrorByIndex({});
  }, [trend?.trend]);

  useEffect(() => {
    if (!trend?.ideas?.length) return;

    const nicheLabel = (niche || "fitness").trim() || "fitness";

    trend.ideas.forEach((idea, index) => {
      setTagsLoadingByIndex((prev) => ({ ...prev, [index]: true }));
      setTagsErrorByIndex((prev) => ({ ...prev, [index]: "" }));

      void (async () => {
        try {
          const json = await postIdeaEnrichment<{ hashtags: string[] }>(
            "generate-hashtags",
            {
              niche: nicheLabel,
              trend: trend.trend,
              hook: idea.hook ?? "",
              angle: idea.angle ?? "",
              idea: idea.idea ?? "",
              optimized_title: idea.optimized_title ?? "",
            },
          );
          setTrendingTagsByIndex((prev) => ({
            ...prev,
            [index]: json.hashtags,
          }));
        } catch (err) {
          setTagsErrorByIndex((prev) => ({
            ...prev,
            [index]:
              err instanceof Error
                ? err.message
                : "Could not load trending hashtags.",
          }));
        } finally {
          setTagsLoadingByIndex((prev) => ({ ...prev, [index]: false }));
        }
      })();
    });
  }, [trend, niche]);

  const loadHooks = async (idea: VideoIdea, index: number) => {
    if (!trend) return;
    setHooksErrorByIndex((prev) => ({ ...prev, [index]: "" }));
    setHooksLoadingByIndex((prev) => ({ ...prev, [index]: true }));
    try {
      const json = await postIdeaEnrichment<{ hooks: string[] }>(
        "generate-hooks",
        {
          niche: (niche || "fitness").trim() || "fitness",
          trend: trend.trend,
          hook: idea.hook ?? "",
          angle: idea.angle ?? "",
          idea: idea.idea ?? "",
          optimized_title: idea.optimized_title ?? "",
        },
      );
      setHookListsByIndex((prev) => ({ ...prev, [index]: json.hooks }));
      trackUiEvent({
        area: "idea_panel",
        action: "generate_hooks_success",
        context: { trend: trend.trend },
      });
    } catch (err) {
      setHooksErrorByIndex((prev) => ({
        ...prev,
        [index]: err instanceof Error ? err.message : "Hook generation failed.",
      }));
    } finally {
      setHooksLoadingByIndex((prev) => ({ ...prev, [index]: false }));
    }
  };

  const loadFullScript = async (idea: VideoIdea, index: number) => {
    if (!trend) return;
    setFullScriptErrorByIndex((prev) => ({ ...prev, [index]: "" }));
    setFullScriptLoadingByIndex((prev) => ({ ...prev, [index]: true }));
    try {
      const json = await postIdeaEnrichment<{ script: string }>(
        "generate-full-script",
        {
          niche: (niche || "fitness").trim() || "fitness",
          trend: trend.trend,
          hook: idea.hook ?? "",
          angle: idea.angle ?? "",
          idea: idea.idea ?? "",
          optimized_title: idea.optimized_title ?? "",
          script: idea.script ?? "",
        },
      );
      setFullScriptByIndex((prev) => ({ ...prev, [index]: json.script }));
      trackUiEvent({
        area: "idea_panel",
        action: "generate_full_script_success",
        context: { trend: trend.trend },
      });
    } catch (err) {
      setFullScriptErrorByIndex((prev) => ({
        ...prev,
        [index]:
          err instanceof Error ? err.message : "Script generation failed.",
      }));
    } finally {
      setFullScriptLoadingByIndex((prev) => ({ ...prev, [index]: false }));
    }
  };

  const setIdeaRating = async (
    idea: VideoIdea,
    index: number,
    value: "up" | "down",
  ) => {
    if (!trend) return;
    const key = `${trend?.trend ?? "trend"}::${idea.optimized_title ?? idea.hook ?? idea.idea}`;
    setErrorByIndex((prev) => ({ ...prev, [index]: "" }));
    setIdeaRatings((prev) => {
      const next = { ...prev, [key]: value };
      try {
        window.localStorage.setItem("idea_ratings", JSON.stringify(next));
      } catch {
        /* ignore localStorage errors */
      }
      return next;
    });
    try {
      const res = await fetch("/api/idea-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea_title:
            idea.optimized_title?.trim() || idea.hook || idea.idea || "Idea",
          feedback_type: value === "up" ? "thumbs_up" : "thumbs_down",
        }),
      });
      if (!res.ok) {
        let message = "Failed to save feedback";
        try {
          const body = (await res.json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }
      trackUiEvent({
        area: "idea_panel",
        action: "rate_idea_success",
        context: {
          trend: trend.trend,
          rating: value,
        },
      });
    } catch (err) {
      trackUiEvent({
        area: "idea_panel",
        action: "rate_idea_failed",
        level: "error",
        message: err instanceof Error ? err.message : "unknown",
        context: {
          trend: trend.trend,
          rating: value,
        },
      });
      setErrorByIndex((prev) => ({
        ...prev,
        [index]:
          err instanceof Error ? err.message : "Failed to save feedback.",
      }));
    }
  };

  const relatedTrends =
    trend && trendIdeas
      ? trendIdeas
          .filter((t) => t.trend !== trend.trend)
          .map((t) => {
            const a = new Set(
              trend.trend.toLowerCase().split(/\W+/).filter(Boolean),
            );
            const b = new Set(
              t.trend.toLowerCase().split(/\W+/).filter(Boolean),
            );
            let overlap = 0;
            a.forEach((w) => {
              if (b.has(w)) overlap += 1;
            });
            return { trend: t.trend, overlap };
          })
          .sort((x, y) => y.overlap - x.overlap)
          .slice(0, 3)
      : [];

  const handleSaveIdea = async (
    idea: VideoIdea,
    index: number,
    mode: "saved" | "calendar",
  ) => {
    if (!trend || !onSaveIdea) return;
    const lockKey = `${mode}:${index}`;
    if (saveInFlightRef.current.has(lockKey)) return;
    saveInFlightRef.current.add(lockKey);
    setErrorByIndex((prev) => ({ ...prev, [index]: "" }));
    if (mode === "saved") setSavingIdeaIndex(index);
    else setSavingCalendarIndex(index);
    try {
      const savePayload = {
        ...idea,
        full_script: fullScriptByIndex[index] || undefined,
        hashtags: trendingTagsByIndex[index]?.length
          ? trendingTagsByIndex[index]
          : idea.hashtags,
        hook_variations: hookListsByIndex[index] ?? [],
      };
      await onSaveIdea({ trend: trend.trend, idea: savePayload, mode });
      if (mode === "saved")
        setSavedIndexes((prev) => ({ ...prev, [index]: true }));
      else setCalendarSavedIndexes((prev) => ({ ...prev, [index]: true }));
      trackUiEvent({
        area: "idea_panel",
        action:
          mode === "saved" ? "save_idea_success" : "save_to_calendar_success",
        context: { trend: trend.trend, mode },
      });
    } catch (err) {
      trackUiEvent({
        area: "idea_panel",
        action:
          mode === "saved" ? "save_idea_failed" : "save_to_calendar_failed",
        level: "error",
        message: err instanceof Error ? err.message : "unknown",
        context: { trend: trend.trend, mode },
      });
      setErrorByIndex((prev) => ({
        ...prev,
        [index]: err instanceof Error ? err.message : "Failed to save idea.",
      }));
    } finally {
      saveInFlightRef.current.delete(lockKey);
      if (mode === "saved") setSavingIdeaIndex(null);
      else setSavingCalendarIndex(null);
    }
  };

  if (!trend) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm font-medium text-foreground dark:text-slate-300">
          Select a trend card
        </p>
        <p className="max-w-xs text-xs text-muted-foreground dark:text-slate-400">
          AI-generated video ideas, hooks, and scripts for that topic appear
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-5">
      <div>
        <h2 className="text-lg font-semibold leading-tight text-foreground dark:text-slate-100">
          {trend.trend}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
          {trend.ideas.length} idea{trend.ideas.length === 1 ? "" : "s"} from
          Content Buddy
        </p>
      </div>

      {relatedTrends.length > 0 ? (
        <div className="rounded-2xl border border-border bg-background p-3 dark:border-white/10 dark:bg-slate-900/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-300">
            Similar trends
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {relatedTrends.map((t) => (
              <span
                key={t.trend}
                className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs text-primary dark:border-cyan-300/30 dark:bg-cyan-500/10 dark:text-cyan-100"
              >
                {t.trend}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        {trend.ideas.map((idea, i) => {
          const thumbnailUrls = getVideoIdeaThumbnailUrls(idea);
          const isSavingThisIdea =
            savingIdeaIndex === i || savingCalendarIndex === i;

          return (
            <Card
              key={`${trend.trend}-${i}`}
              className="overflow-hidden rounded-[1.35rem] border-border bg-background text-card-foreground shadow-sm shadow-black/5 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100 dark:shadow-black/20"
            >
              {thumbnailUrls.length > 0 ? (
                <div
                  className={cn(
                    "grid gap-1 overflow-hidden border-b border-border bg-muted p-1.5 dark:border-white/10 dark:bg-slate-950",
                    thumbnailUrls.length === 1 ? "grid-cols-1" : "grid-cols-2",
                  )}
                >
                  {thumbnailUrls.map((thumbnailUrl, thumbnailIndex) => (
                    <div
                      key={`${thumbnailUrl}-${thumbnailIndex}`}
                      className={cn(
                        "relative aspect-video overflow-hidden rounded-xl bg-background dark:bg-slate-900",
                        thumbnailUrls.length === 3 &&
                          thumbnailIndex === 0 &&
                          "col-span-2",
                      )}
                    >
                      {/* Idea-card images are generated by the FastAPI backend via OpenAI. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbnailUrl}
                        alt={
                          thumbnailUrls.length === 1
                            ? idea.optimized_title?.trim() ||
                              `Idea ${i + 1} thumbnail`
                            : `${idea.optimized_title?.trim() || `Idea ${i + 1}`} thumbnail ${
                                thumbnailIndex + 1
                              }`
                        }
                        className="absolute inset-0 size-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              <CardHeader className="pb-2">
                <CardTitle className="text-base leading-snug text-foreground dark:text-slate-100">
                  {idea.optimized_title?.trim() || `Idea ${i + 1}`}
                </CardTitle>
                {idea.hook ? (
                  <CardDescription className="text-sm font-medium text-foreground dark:text-slate-200">
                    Hook: {idea.hook}
                  </CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-2 rounded-md border border-border bg-muted/60 p-3 text-xs text-muted-foreground sm:grid-cols-2 dark:border-white/10 dark:bg-slate-800/40 dark:text-slate-200">
                  <p>
                    <span className="font-semibold text-foreground dark:text-slate-100">
                      Video length:{" "}
                    </span>
                    {estimateVideoLength(idea)}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground dark:text-slate-100">
                      Best post time:{" "}
                    </span>
                    {estimateBestPostTime(i)}
                  </p>
                </div>
                {idea.angle ? (
                  <p>
                    <span className="font-medium text-foreground dark:text-slate-200">
                      Angle:{" "}
                    </span>
                    <span className="text-muted-foreground dark:text-slate-400">
                      {idea.angle}
                    </span>
                  </p>
                ) : null}
                {idea.idea ? (
                  <p>
                    <span className="font-medium text-foreground dark:text-slate-200">
                      Concept:{" "}
                    </span>
                    <span className="text-muted-foreground dark:text-slate-400">
                      {idea.idea}
                    </span>
                  </p>
                ) : null}
                {idea.seo_description ? (
                  <p className="text-xs text-muted-foreground dark:text-slate-400">
                    <span className="font-medium text-foreground dark:text-slate-200">
                      SEO:{" "}
                    </span>
                    {idea.seo_description}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={hooksLoadingByIndex[i]}
                    onClick={() => void loadHooks(idea, i)}
                    className="h-9 rounded-full border-fuchsia-500/35 bg-fuchsia-50 px-3 text-xs font-semibold text-fuchsia-700 hover:bg-fuchsia-100 dark:border-fuchsia-400/35 dark:bg-fuchsia-500/10 dark:text-fuchsia-100 dark:hover:bg-fuchsia-500/20"
                  >
                    {hooksLoadingByIndex[i] ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <WandSparkles className="size-3.5" />
                    )}
                    {hooksLoadingByIndex[i] ? "Generating" : "Hooks"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={fullScriptLoadingByIndex[i]}
                    onClick={() => void loadFullScript(idea, i)}
                    className="h-9 rounded-full border-indigo-500/35 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-400/35 dark:bg-indigo-500/10 dark:text-indigo-100 dark:hover:bg-indigo-500/20"
                  >
                    {fullScriptLoadingByIndex[i] ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <FileText className="size-3.5" />
                    )}
                    {fullScriptLoadingByIndex[i] ? "Writing" : "Full script"}
                  </Button>
                </div>
                {hooksErrorByIndex[i] ? (
                  <p className="text-xs text-red-600 dark:text-red-300">
                    {hooksErrorByIndex[i]}
                  </p>
                ) : null}
                {hookListsByIndex[i]?.length ? (
                  <div className="rounded-md border border-fuchsia-500/25 bg-fuchsia-50 p-3 dark:border-fuchsia-400/30 dark:bg-fuchsia-950/30">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-200">
                      Hook variations
                    </p>
                    <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-foreground dark:text-slate-100">
                      {hookListsByIndex[i].map((h, hi) => (
                        <li key={`hook-${i}-${hi}`}>{h}</li>
                      ))}
                    </ol>
                  </div>
                ) : null}
                {fullScriptErrorByIndex[i] ? (
                  <p className="text-xs text-red-600 dark:text-red-300">
                    {fullScriptErrorByIndex[i]}
                  </p>
                ) : null}
                {fullScriptByIndex[i] ? (
                  <div className="rounded-md border border-indigo-500/25 bg-indigo-50 p-3 font-sans dark:border-indigo-400/30 dark:bg-indigo-950/25">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-200">
                      Full script (60-90 seconds)
                    </p>
                    {renderMarkdownLikeContent(fullScriptByIndex[i])}
                  </div>
                ) : null}
                {idea.script ? (
                  <div className="rounded-md border border-border bg-muted/60 p-3 font-sans dark:border-white/10 dark:bg-slate-800/50">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
                      Quick script (30-60s)
                    </p>
                    {renderMarkdownLikeContent(idea.script)}
                  </div>
                ) : null}
                <div className="rounded-md border border-primary/20 bg-primary/10 p-3 dark:border-cyan-400/25 dark:bg-cyan-500/10">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary dark:text-cyan-200">
                    Content Outline
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-foreground dark:text-slate-100">
                    {buildOutline(idea).map((point, oi) => (
                      <li key={`${trend.trend}-${i}-outline-${oi}`}>{point}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-300">
                    Trending hashtags
                  </p>
                  {tagsLoadingByIndex[i] ? (
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: 10 }).map((_, hi) => (
                        <span
                          key={`tag-sk-${i}-${hi}`}
                          className="h-6 w-16 animate-pulse rounded-full bg-muted dark:bg-slate-700/80"
                        />
                      ))}
                    </div>
                  ) : trendingTagsByIndex[i]?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {trendingTagsByIndex[i].map((tag, hi) => (
                        <a
                          key={`${tag}-${hi}`}
                          href={tiktokTagSearchUrl(tag)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/15 dark:border-cyan-400/40 dark:bg-cyan-500/15 dark:text-cyan-100 dark:hover:border-cyan-300/70 dark:hover:bg-cyan-500/25"
                        >
                          {tag.startsWith("#") ? tag : `#${tag}`}
                        </a>
                      ))}
                    </div>
                  ) : tagsErrorByIndex[i] &&
                    idea.hashtags &&
                    idea.hashtags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {idea.hashtags.slice(0, 10).map((tag, hi) => (
                        <a
                          key={`fallback-${tag}-${hi}`}
                          href={tiktokTagSearchUrl(tag)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-full border border-border bg-muted/70 px-2.5 py-1 text-xs font-normal text-muted-foreground hover:border-cyan-500/40 dark:border-slate-500/40 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-cyan-400/40"
                        >
                          {tag.startsWith("#") ? tag : `#${tag}`}
                        </a>
                      ))}
                    </div>
                  ) : tagsErrorByIndex[i] ? (
                    <p className="text-xs text-amber-700 dark:text-amber-200/90">
                      {tagsErrorByIndex[i]}
                    </p>
                  ) : null}
                  {!tagsLoadingByIndex[i] &&
                  trendingTagsByIndex[i]?.length &&
                  idea.hashtags &&
                  idea.hashtags.length > 0 ? (
                    <p className="text-[11px] text-muted-foreground dark:text-slate-500">
                      Ideas pack also suggested:{" "}
                      {idea.hashtags
                        .map((t) => (t.startsWith("#") ? t : `#${t}`))
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
                {onSaveIdea ? (
                  <div className="space-y-3 border-t border-border pt-3 dark:border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-300">
                        Actions
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void setIdeaRating(idea, i, "up")}
                          aria-label="Mark idea as useful"
                          className="inline-flex size-8 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:text-emerald-200"
                        >
                          <ThumbsUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void setIdeaRating(idea, i, "down")}
                          aria-label="Mark idea as not useful"
                          className="inline-flex size-8 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-700 transition-colors hover:bg-amber-500/15 dark:text-amber-100"
                        >
                          <ThumbsDown className="size-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        type="button"
                        disabled={isSavingThisIdea || savedIndexes[i]}
                        onClick={() => void handleSaveIdea(idea, i, "saved")}
                        className="h-10 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950 dark:hover:opacity-90"
                      >
                        {savingIdeaIndex === i ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <BookmarkPlus className="size-4" />
                        )}
                        {savedIndexes[i]
                          ? "Saved"
                          : savingIdeaIndex === i
                            ? "Saving..."
                            : "Save idea"}
                      </Button>
                      <Button
                        type="button"
                        disabled={isSavingThisIdea || calendarSavedIndexes[i]}
                        onClick={() => void handleSaveIdea(idea, i, "calendar")}
                        className={`h-10 rounded-full border border-emerald-500/35 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-300/40 dark:bg-emerald-500/15 dark:text-emerald-100 dark:hover:bg-emerald-500/25 ${
                          calendarSavedIndexes[i] ? "animate-pulse" : ""
                        }`}
                      >
                        {savingCalendarIndex === i ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CalendarPlus className="size-4" />
                        )}
                        {calendarSavedIndexes[i]
                          ? "On calendar"
                          : savingCalendarIndex === i
                            ? "Saving..."
                            : "To calendar"}
                      </Button>
                    </div>
                    {(() => {
                      const key = `${trend.trend}::${idea.optimized_title ?? idea.hook ?? idea.idea}`;
                      const rating = ideaRatings[key];
                      return rating ? (
                        <p className="text-xs text-muted-foreground dark:text-slate-400">
                          {rating === "up"
                            ? "Feedback: thumbs up"
                            : "Feedback: thumbs down"}
                        </p>
                      ) : null;
                    })()}
                    {errorByIndex[i] ? (
                      <p className="text-xs text-red-600 dark:text-red-300">
                        {errorByIndex[i]}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
