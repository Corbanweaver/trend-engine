"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";

import { getApiBaseUrl } from "@/lib/api";
import { trackUiEvent } from "@/lib/telemetry";
import type { TrendIdea, VideoIdea } from "@/lib/trend-ideas-types";

function tiktokTagSearchUrl(tag: string): string {
  const clean = tag.replace(/^#/, "").trim();
  if (!clean) return "https://www.tiktok.com/search";
  return `https://www.tiktok.com/search?q=${encodeURIComponent(`#${clean}`)}`;
}

async function postIdeaEnrichment<T>(
  path: "generate-hooks" | "generate-hashtags" | "generate-full-script",
  body: Record<string, string>,
): Promise<T> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/trend-ideas/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errBody = (await res.json()) as { detail?: unknown };
      if (errBody?.detail != null) {
        detail =
          typeof errBody.detail === "string"
            ? errBody.detail
            : JSON.stringify(errBody.detail);
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function estimateVideoLength(idea: VideoIdea): string {
  const scriptWords = idea.script?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  if (scriptWords > 220) return "90-120 seconds";
  if (scriptWords > 120) return "60-90 seconds";
  return "30-60 seconds";
}

function estimateBestPostTime(ideaIndex: number): string {
  const slots = ["Tuesday 6-9pm", "Wednesday 5-8pm", "Thursday 6-9pm", "Sunday 4-7pm"];
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
      nodes.push(<span key={`text-${key++}`}>{text.slice(lastIndex, start)}</span>);
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
          <li key={`item-${idx}`} className="font-sans text-xs leading-relaxed text-slate-200">
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
      <p key={`p-${key++}`} className="font-sans text-xs leading-relaxed text-slate-200">
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
  onSaveIdea?: (payload: { trend: string; idea: VideoIdea }) => Promise<void>;
}) {
  const [savingIdeaIndex, setSavingIdeaIndex] = useState<number | null>(null);
  const [savingCalendarIndex, setSavingCalendarIndex] = useState<number | null>(null);
  const [savedIndexes, setSavedIndexes] = useState<Record<number, boolean>>({});
  const [calendarSavedIndexes, setCalendarSavedIndexes] = useState<Record<number, boolean>>({});
  const [errorByIndex, setErrorByIndex] = useState<Record<number, string>>({});
  const [ideaRatings, setIdeaRatings] = useState<Record<string, "up" | "down">>({});
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
          setTrendingTagsByIndex((prev) => ({ ...prev, [index]: json.hashtags }));
        } catch (err) {
          setTagsErrorByIndex((prev) => ({
            ...prev,
            [index]:
              err instanceof Error ? err.message : "Could not load trending hashtags.",
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
      const json = await postIdeaEnrichment<{ hooks: string[] }>("generate-hooks", {
        niche: (niche || "fitness").trim() || "fitness",
        trend: trend.trend,
        hook: idea.hook ?? "",
        angle: idea.angle ?? "",
        idea: idea.idea ?? "",
        optimized_title: idea.optimized_title ?? "",
      });
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
        [index]: err instanceof Error ? err.message : "Script generation failed.",
      }));
    } finally {
      setFullScriptLoadingByIndex((prev) => ({ ...prev, [index]: false }));
    }
  };

  const setIdeaRating = async (idea: VideoIdea, index: number, value: "up" | "down") => {
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
          idea_title: idea.optimized_title?.trim() || idea.hook || idea.idea || "Idea",
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
        [index]: err instanceof Error ? err.message : "Failed to save feedback.",
      }));
    }
  };

  const relatedTrends =
    trend && trendIdeas
      ? trendIdeas
          .filter((t) => t.trend !== trend.trend)
          .map((t) => {
            const a = new Set(trend.trend.toLowerCase().split(/\W+/).filter(Boolean));
            const b = new Set(t.trend.toLowerCase().split(/\W+/).filter(Boolean));
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
      await onSaveIdea({ trend: trend.trend, idea });
      if (mode === "saved") setSavedIndexes((prev) => ({ ...prev, [index]: true }));
      else setCalendarSavedIndexes((prev) => ({ ...prev, [index]: true }));
      trackUiEvent({
        area: "idea_panel",
        action: mode === "saved" ? "save_idea_success" : "save_to_calendar_success",
        context: { trend: trend.trend, mode },
      });
    } catch (err) {
      trackUiEvent({
        area: "idea_panel",
        action: mode === "saved" ? "save_idea_failed" : "save_to_calendar_failed",
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
        <p className="text-sm font-medium text-slate-300">
          Select a trend card
        </p>
        <p className="max-w-xs text-xs text-slate-400">
          AI-generated video ideas, hooks, and scripts for that topic appear
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 pr-2">
      <div>
        <h2 className="text-lg font-semibold leading-tight text-slate-100">
          {trend.trend}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {trend.ideas.length} idea{trend.ideas.length === 1 ? "" : "s"} from
          your Trend Engine
        </p>
      </div>

      {relatedTrends.length > 0 ? (
        <div className="rounded-lg border border-white/10 bg-slate-900/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Similar trends
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {relatedTrends.map((t) => (
              <span
                key={t.trend}
                className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-100"
              >
                {t.trend}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {trend.ideas.map((idea, i) => (
          <Card
            key={`${trend.trend}-${i}`}
            className="border-white/10 bg-slate-900/80 text-slate-100 shadow-md shadow-black/20"
          >
            {idea.thumbnail_url ? (
              <div className="relative aspect-video w-full overflow-hidden border-b border-white/10 bg-slate-950">
                {/* Idea-card images are generated by the FastAPI backend via OpenAI. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={idea.thumbnail_url}
                  alt={idea.optimized_title?.trim() || `Idea ${i + 1} thumbnail`}
                  className="absolute inset-0 size-full object-cover"
                />
              </div>
            ) : null}
            <CardHeader className="pb-2">
              <CardTitle className="text-base leading-snug text-slate-100">
                {idea.optimized_title?.trim() || `Idea ${i + 1}`}
              </CardTitle>
              {idea.hook ? (
                <CardDescription className="text-sm font-medium text-slate-200">
                  Hook: {idea.hook}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid gap-2 rounded-md border border-white/10 bg-slate-800/40 p-3 text-xs text-slate-200 sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-slate-100">Video length: </span>
                  {estimateVideoLength(idea)}
                </p>
                <p>
                  <span className="font-semibold text-slate-100">Best post time: </span>
                  {estimateBestPostTime(i)}
                </p>
              </div>
              {idea.angle ? (
                <p>
                  <span className="font-medium text-slate-200">Angle: </span>
                  <span className="text-slate-400">{idea.angle}</span>
                </p>
              ) : null}
              {idea.idea ? (
                <p>
                  <span className="font-medium text-slate-200">Concept: </span>
                  <span className="text-slate-400">{idea.idea}</span>
                </p>
              ) : null}
              {idea.seo_description ? (
                <p className="text-xs text-slate-400">
                  <span className="font-medium text-slate-200">SEO: </span>
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
                  className="h-8 border-fuchsia-400/35 bg-fuchsia-500/10 text-xs font-semibold text-fuchsia-100 hover:bg-fuchsia-500/20"
                >
                  {hooksLoadingByIndex[i] ? "Generating…" : "Generate Hooks"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={fullScriptLoadingByIndex[i]}
                  onClick={() => void loadFullScript(idea, i)}
                  className="h-8 border-indigo-400/35 bg-indigo-500/10 text-xs font-semibold text-indigo-100 hover:bg-indigo-500/20"
                >
                  {fullScriptLoadingByIndex[i] ? "Writing…" : "Write Full Script"}
                </Button>
              </div>
              {hooksErrorByIndex[i] ? (
                <p className="text-xs text-red-300">{hooksErrorByIndex[i]}</p>
              ) : null}
              {hookListsByIndex[i]?.length ? (
                <div className="rounded-md border border-fuchsia-400/30 bg-fuchsia-950/30 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fuchsia-200">
                    Hook variations
                  </p>
                  <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-slate-100">
                    {hookListsByIndex[i].map((h, hi) => (
                      <li key={`hook-${i}-${hi}`}>{h}</li>
                    ))}
                  </ol>
                </div>
              ) : null}
              {fullScriptErrorByIndex[i] ? (
                <p className="text-xs text-red-300">{fullScriptErrorByIndex[i]}</p>
              ) : null}
              {fullScriptByIndex[i] ? (
                <div className="rounded-md border border-indigo-400/30 bg-indigo-950/25 p-3 font-sans">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
                    Full script (60-90 seconds)
                  </p>
                  {renderMarkdownLikeContent(fullScriptByIndex[i])}
                </div>
              ) : null}
              {idea.script ? (
                <div className="rounded-md border border-white/10 bg-slate-800/50 p-3 font-sans">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Quick script (30-60s)
                  </p>
                  {renderMarkdownLikeContent(idea.script)}
                </div>
              ) : null}
              <div className="rounded-md border border-cyan-400/25 bg-cyan-500/10 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">
                  Content Outline
                </p>
                <ul className="list-disc space-y-1 pl-5 text-xs text-slate-100">
                  {buildOutline(idea).map((point, oi) => (
                    <li key={`${trend.trend}-${i}-outline-${oi}`}>{point}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Trending hashtags
                </p>
                {tagsLoadingByIndex[i] ? (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: 10 }).map((_, hi) => (
                      <span
                        key={`tag-sk-${i}-${hi}`}
                        className="h-6 w-16 animate-pulse rounded-full bg-slate-700/80"
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
                        className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-1 text-xs font-medium text-cyan-100 transition-colors hover:border-cyan-300/70 hover:bg-cyan-500/25"
                      >
                        {tag.startsWith("#") ? tag : `#${tag}`}
                      </a>
                    ))}
                  </div>
                ) : tagsErrorByIndex[i] && idea.hashtags && idea.hashtags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {idea.hashtags.slice(0, 10).map((tag, hi) => (
                      <a
                        key={`fallback-${tag}-${hi}`}
                        href={tiktokTagSearchUrl(tag)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-full border border-slate-500/40 bg-slate-800/60 px-2.5 py-1 text-xs font-normal text-slate-200 hover:border-cyan-400/40"
                      >
                        {tag.startsWith("#") ? tag : `#${tag}`}
                      </a>
                    ))}
                  </div>
                ) : tagsErrorByIndex[i] ? (
                  <p className="text-xs text-amber-200/90">{tagsErrorByIndex[i]}</p>
                ) : null}
                {!tagsLoadingByIndex[i] &&
                trendingTagsByIndex[i]?.length &&
                idea.hashtags &&
                idea.hashtags.length > 0 ? (
                  <p className="text-[11px] text-slate-500">
                    Ideas pack also suggested:{" "}
                    {idea.hashtags
                      .map((t) => (t.startsWith("#") ? t : `#${t}`))
                      .join(", ")}
                  </p>
                ) : null}
              </div>
              {onSaveIdea ? (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void setIdeaRating(idea, i, "up")}
                      className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200"
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      onClick={() => void setIdeaRating(idea, i, "down")}
                      className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-100"
                    >
                      👎
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={savingIdeaIndex === i || savedIndexes[i]}
                      onClick={() => void handleSaveIdea(idea, i, "saved")}
                      className="h-8 bg-cyan-400 px-3 text-xs font-semibold text-slate-950 hover:opacity-90 disabled:opacity-60"
                    >
                      {savedIndexes[i]
                        ? "Saved Idea ✔"
                        : savingIdeaIndex === i
                          ? "Saving..."
                          : "Save Idea"}
                    </Button>
                    <Button
                      type="button"
                      disabled={savingCalendarIndex === i || calendarSavedIndexes[i]}
                      onClick={() => void handleSaveIdea(idea, i, "calendar")}
                      className={`h-8 border border-emerald-300/40 bg-emerald-500/15 px-3 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-60 ${
                        calendarSavedIndexes[i] ? "animate-pulse" : ""
                      }`}
                    >
                      {calendarSavedIndexes[i]
                        ? "✅ Saved to Content Calendar"
                        : savingCalendarIndex === i
                          ? "Saving..."
                          : "Save to Content Calendar"}
                    </Button>
                  </div>
                  {(() => {
                    const key = `${trend.trend}::${idea.optimized_title ?? idea.hook ?? idea.idea}`;
                    const rating = ideaRatings[key];
                    return rating ? (
                      <p className="text-xs text-slate-400">
                        {rating === "up" ? "Feedback: thumbs up" : "Feedback: thumbs down"}
                      </p>
                    ) : null;
                  })()}
                  {errorByIndex[i] ? (
                    <p className="text-xs text-red-300">{errorByIndex[i]}</p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
