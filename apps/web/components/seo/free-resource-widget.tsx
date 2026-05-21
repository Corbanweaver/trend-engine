"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  GitCompare,
  ListChecks,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SeoPage } from "@/lib/seo-content";
import { trackConversionEvent } from "@/lib/telemetry";

type ResourceKind = NonNullable<SeoPage["resourceKind"]>;

const fitnessIdeas = [
  "One form mistake beginners make",
  "Three warm-up moves before leg day",
  "What I would do if I started over",
  "A simple grocery swap for busy weeks",
  "The exercise people rush too often",
  "A realistic 20-minute workout",
  "How to make progress without chasing soreness",
  "One cue that made this movement click",
  "A beginner-friendly version of a hard exercise",
  "What to track besides body weight",
  "A recovery habit that actually helps",
  "How to build a simple home workout",
  "A fitness myth your niche still hears",
  "A one-week consistency challenge",
  "What to do when motivation drops",
  "How to make cardio less boring",
  "A quick high-protein meal idea",
  "The difference between pain and effort",
  "One mistake with online workout plans",
  "How to choose the right starting weight",
  "A mobility drill before desk work",
  "What I check before changing a routine",
  "A gym confidence tip for beginners",
  "How to restart after missing workouts",
  "A simple way to measure progress",
  "Three mistakes in a common exercise",
  "A realistic morning routine for training days",
  "How to make a workout easier to finish",
  "One thing I wish more clients knew",
  "A weekly plan for busy people",
];

function normalizeTopic(value: string, fallback: string) {
  return value.trim().replace(/\s+/g, " ") || fallback;
}

function hookIdeas(topic: string) {
  return [
    `I used to overthink ${topic} too.`,
    `Here is the part of ${topic} people skip.`,
    `${topic} gets easier when you notice this.`,
    `This is the simplest way to start with ${topic}.`,
    `One honest thing about ${topic}.`,
    `Before you try ${topic}, watch this.`,
    `Most ${topic} advice misses this detail.`,
    `A small ${topic} fix that helped me.`,
  ];
}

function calendarRows(niche: string) {
  return [
    ["Monday", "Teach", `Explain one beginner mistake in ${niche}.`],
    [
      "Tuesday",
      "Proof",
      `Show a quick result, example, or before-and-after for ${niche}.`,
    ],
    ["Wednesday", "Trend", `React to one current ${niche} conversation.`],
    [
      "Thursday",
      "Trust",
      `Share a simple behind-the-scenes note about your ${niche} process.`,
    ],
    ["Friday", "Save", `Make a checklist your ${niche} audience can keep.`],
    [
      "Saturday",
      "Story",
      `Tell a short story about a ${niche} lesson you learned.`,
    ],
    [
      "Sunday",
      "Plan",
      `Ask one question that helps plan next week's ${niche} content.`,
    ],
  ];
}

function trendChecklist(topic: string) {
  return [
    `Is ${topic} showing up on more than one platform?`,
    `Are people asking real questions about ${topic} in comments?`,
    `Can you connect ${topic} to your niche without forcing it?`,
    `Do you have a source, example, or proof point for ${topic}?`,
    `Can the idea be explained in one short video?`,
    `Would your audience care about ${topic} tomorrow?`,
  ];
}

function comparisonRows(topic: string) {
  return [
    [
      "TikTok",
      "Raw hook",
      `Open with the most direct ${topic} moment and show the payoff fast.`,
    ],
    [
      "Instagram Reels",
      "Trust and save",
      `Make ${topic} more polished with text overlays and a useful caption.`,
    ],
    [
      "YouTube Shorts",
      "Search answer",
      `Use ${topic} as a searchable question and answer it clearly.`,
    ],
  ];
}

export function FreeResourceWidget({
  kind,
  defaultTopic,
}: {
  kind: ResourceKind;
  defaultTopic: string;
}) {
  const [topic, setTopic] = useState(defaultTopic);
  const [submittedTopic, setSubmittedTopic] = useState(defaultTopic);
  const [hasGenerated, setHasGenerated] = useState(false);
  const trackedUseRef = useRef(false);
  const cleanTopic = normalizeTopic(topic, defaultTopic);
  const outputTopic = hasGenerated
    ? normalizeTopic(submittedTopic, defaultTopic)
    : cleanTopic;

  const Icon =
    kind === "calendar"
      ? CalendarDays
      : kind === "trend-checklist"
        ? ListChecks
        : kind === "comparison"
          ? GitCompare
          : kind === "fitness-ideas"
            ? CheckCircle2
            : WandSparkles;

  const title =
    kind === "calendar"
      ? "Generate a quick 7-day calendar"
      : kind === "trend-checklist"
        ? "Check if a trend is worth filming"
        : kind === "comparison"
          ? "Adapt one idea by platform"
          : kind === "fitness-ideas"
            ? "Generate free fitness ideas"
            : "Generate free hooks from a topic";

  const description =
    kind === "fitness-ideas"
      ? "Get a useful sample before you create an account. The full app adds live trend context, source links, and save-ready cards."
      : "Get a useful sample before you create an account. No credits or card needed for this preview.";

  const rows = useMemo(() => {
    if (kind === "calendar") return calendarRows(outputTopic);
    if (kind === "trend-checklist") return trendChecklist(outputTopic);
    if (kind === "comparison") return comparisonRows(outputTopic);
    if (kind === "fitness-ideas") return fitnessIdeas;
    return hookIdeas(outputTopic);
  }, [outputTopic, kind]);

  const visibleRows = hasGenerated
    ? rows
    : rows.slice(0, kind === "fitness-ideas" ? 6 : 2);

  const handleGenerate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedTopic(cleanTopic);
    setHasGenerated(true);
    trackConversionEvent({
      event: "free_tool_generated",
      context: {
        resourceKind: kind,
        topicLength: cleanTopic.length,
      },
    });
  };

  return (
    <section
      id="free-preview"
      className="scroll-mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/70 sm:p-8"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-cyan-400/10 dark:text-cyan-200">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary dark:text-cyan-200">
                Free preview
              </p>
              <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <form
          className="w-full rounded-3xl border border-border bg-background p-3 dark:border-white/10 dark:bg-slate-900/70 md:max-w-md"
          onSubmit={handleGenerate}
        >
          {kind !== "fitness-ideas" ? (
            <label className="block">
              <span className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Topic or niche
              </span>
              <input
                value={topic}
                onChange={(event) => {
                  const value = event.target.value;
                  setTopic(value);
                  if (!trackedUseRef.current && value.trim().length >= 3) {
                    trackedUseRef.current = true;
                    trackConversionEvent({
                      event: "free_tool_used",
                      context: { resourceKind: kind },
                    });
                  }
                }}
                className="mt-2 h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/50 dark:border-white/10 dark:bg-slate-950 dark:focus:ring-cyan-300/60"
                placeholder="fitness, real estate, skincare..."
              />
            </label>
          ) : null}
          <button
            type="submit"
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
          >
            {hasGenerated ? "Refresh free preview" : "Generate free ideas"}
            <Sparkles className="size-4" />
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            No credit card. No signup until you want to save or scan deeper.
          </p>
        </form>
      </div>

      {!hasGenerated ? (
        <div className="mt-7 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground dark:border-cyan-300/25 dark:bg-cyan-400/5">
          Enter a niche and generate a small preview first. The full app adds
          live trend signals, source links, saved cards, and deeper analysis.
        </div>
      ) : null}

      <div
        className={cn(
          "mt-7 grid gap-3",
          kind === "fitness-ideas"
            ? "sm:grid-cols-2 lg:grid-cols-3"
            : "lg:grid-cols-2",
        )}
      >
        {visibleRows.map((row, index) => {
          if (Array.isArray(row)) {
            const [label, format, idea] = row;
            return (
              <div
                key={`${label}-${format}`}
                className="rounded-2xl border border-border bg-muted/35 p-4 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary dark:text-cyan-200">
                  {label}
                </p>
                <h3 className="mt-2 text-sm font-semibold">{format}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {idea}
                </p>
              </div>
            );
          }
          return (
            <div
              key={row}
              className="flex gap-3 rounded-2xl border border-border bg-muted/35 p-4 text-sm leading-6 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary dark:text-cyan-300" />
              <span>
                {kind === "fitness-ideas" ? `${index + 1}. ` : null}
                {row}
              </span>
            </div>
          );
        })}
      </div>

      {hasGenerated ? (
        <div className="mt-7 rounded-3xl border border-primary/20 bg-primary/5 p-5 dark:border-cyan-300/25 dark:bg-cyan-400/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">
                Want the live trend version?
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Create a free account to run real scans, save source links, and
                turn the best ideas into calendar-ready cards.
              </p>
            </div>
            <Link
              href={`/signup?from=free-preview&resource=${kind}`}
              onClick={() => {
                trackConversionEvent({
                  event: "signup_prompt_clicked",
                  context: { resourceKind: kind },
                });
              }}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Save and scan deeper
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
