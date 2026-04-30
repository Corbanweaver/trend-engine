 "use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";

import type { TrendIdea, VideoIdea } from "@/lib/trend-ideas-types";

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
  onSaveIdea,
}: {
  trend: TrendIdea | null;
  onSaveIdea?: (payload: { trend: string; idea: VideoIdea }) => Promise<void>;
}) {
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [savedIndexes, setSavedIndexes] = useState<Record<number, boolean>>({});
  const [errorByIndex, setErrorByIndex] = useState<Record<number, string>>({});

  useEffect(() => {
    setSavingIndex(null);
    setSavedIndexes({});
    setErrorByIndex({});
  }, [trend?.trend]);

  const handleSaveIdea = async (idea: VideoIdea, index: number) => {
    if (!trend || !onSaveIdea) return;
    setErrorByIndex((prev) => ({ ...prev, [index]: "" }));
    setSavingIndex(index);
    try {
      await onSaveIdea({ trend: trend.trend, idea });
      setSavedIndexes((prev) => ({ ...prev, [index]: true }));
    } catch (err) {
      setErrorByIndex((prev) => ({
        ...prev,
        [index]: err instanceof Error ? err.message : "Failed to save idea.",
      }));
    } finally {
      setSavingIndex(null);
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
          your Content Engine
        </p>
      </div>

      <div className="space-y-3">
        {trend.ideas.map((idea, i) => (
          <Card
            key={`${trend.trend}-${i}`}
            className="border-white/10 bg-slate-900/80 text-slate-100 shadow-md shadow-black/20"
          >
            {idea.thumbnail_url ? (
              <div className="relative h-40 overflow-hidden border-b border-white/10">
                {/* Thumbnails are generated by backend via Replicate Flux */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={idea.thumbnail_url}
                  alt={idea.optimized_title?.trim() || `Idea ${i + 1} thumbnail`}
                  className="h-full w-full object-cover"
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
              {idea.script ? (
                <div className="rounded-md border border-white/10 bg-slate-800/50 p-3 font-sans">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Script
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
              {idea.hashtags && idea.hashtags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {idea.hashtags.map((tag, hi) => (
                    <Badge
                      key={`${tag}-${hi}`}
                      variant="secondary"
                      className="border border-cyan-400/30 bg-cyan-500/10 font-normal text-cyan-200"
                    >
                      {tag.startsWith("#") ? tag : `#${tag}`}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {onSaveIdea ? (
                <div className="space-y-2 pt-1">
                  <Button
                    type="button"
                    disabled={savingIndex === i || savedIndexes[i]}
                    onClick={() => void handleSaveIdea(idea, i)}
                    className="h-8 bg-cyan-400 px-3 text-xs font-semibold text-slate-950 hover:opacity-90 disabled:opacity-60"
                  >
                    {savedIndexes[i]
                      ? "Saved"
                      : savingIndex === i
                        ? "Saving..."
                        : "Save Idea"}
                  </Button>
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
