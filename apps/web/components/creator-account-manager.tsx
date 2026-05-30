"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  AtSign,
  BarChart3,
  Bell,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  Flame,
  Instagram,
  LayoutList,
  Loader2,
  Lock,
  Search,
  Sparkles,
  Target,
  UserRound,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  buildCreatorManagerPlan,
  type CreatorManagerPlan,
  type CreatorManagerTask,
} from "@/lib/creator-manager";
import { cn } from "@/lib/utils";

type PlatformOption = "Instagram" | "TikTok";

type HandleNicheApiResponse = {
  handle?: string;
  platform?: string | null;
  niche?: string;
  nicheLabel?: string;
  confidence?: "high" | "medium" | "low";
  signals?: string[];
  reasoning?: string;
  sourceCount?: number;
  managerPlan?: CreatorManagerPlan;
  error?: string;
  upgradeUrl?: string;
};

const platformOptions: PlatformOption[] = ["Instagram", "TikTok"];

type ScanAccountOptions = {
  handle?: string;
  platform?: PlatformOption;
};

const ecosystemTools = [
  {
    title: "Analyze",
    body: "Turn the account niche into ranked trend cards.",
    href: "/analyze",
    icon: Sparkles,
  },
  {
    title: "Trending",
    body: "Check what the market is reacting to today.",
    href: "/trending",
    icon: Flame,
  },
  {
    title: "Saved",
    body: "Store scripts, hooks, source links, and ideas.",
    href: "/saved",
    icon: Bookmark,
  },
  {
    title: "Calendar",
    body: "Move strong ideas onto a posting plan.",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    title: "Alerts",
    body: "Watch niches so new signals come back to you.",
    href: "/alerts",
    icon: Bell,
  },
  {
    title: "Analytics",
    body: "Track your research history and saved output.",
    href: "/analytics",
    icon: BarChart3,
  },
] as const;

const defaultPlan = buildCreatorManagerPlan({
  handle: "@yourhandle",
  platform: "Instagram",
  niche: "fitness",
  nicheLabel: "Fitness",
  confidence: "medium",
});

function buildProfileInput(platform: PlatformOption, rawHandle: string) {
  const username = rawHandle.trim().replace(/^@+/, "").split(/[/?#]/)[0];
  if (!username) return rawHandle.trim();
  if (/^https?:\/\//i.test(rawHandle)) return rawHandle.trim();
  if (platform === "Instagram") return `https://www.instagram.com/${username}`;
  return `https://www.tiktok.com/@${username}`;
}

function parsePlatformParam(value: string | null): PlatformOption | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("tiktok")) return "TikTok";
  if (normalized.includes("instagram")) return "Instagram";
  return null;
}

function taskTone(category: CreatorManagerTask["category"]) {
  switch (category) {
    case "Engagement":
      return "text-[#1f7a8c]";
    case "Content":
      return "text-[#e45d7d]";
    case "Distribution":
      return "text-[#244f6a]";
    case "Research":
      return "text-[#8a5a00]";
    case "Profile":
      return "text-[#6b4bbf]";
    default:
      return "text-muted-foreground";
  }
}

export function CreatorAccountManager() {
  const [platform, setPlatform] = useState<PlatformOption>("Instagram");
  const [handle, setHandle] = useState("");
  const [manualNiche, setManualNiche] = useState("fitness");
  const [plan, setPlan] = useState<CreatorManagerPlan>(defaultPlan);
  const [lookup, setLookup] = useState<HandleNicheApiResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const autoScanRef = useRef(false);

  const completedTaskSet = useMemo(
    () => new Set(completedTasks),
    [completedTasks],
  );

  const scanAccount = async (options?: ScanAccountOptions) => {
    const activePlatform = options?.platform ?? platform;
    const rawHandle = options?.handle ?? handle;
    const trimmedHandle = rawHandle.trim();
    const activeManualNiche = manualNiche;

    if (!trimmedHandle) {
      setMessage("Enter an Instagram or TikTok username first.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage(null);
    setLookup(null);
    setCompletedTasks([]);

    try {
      const response = await fetch("/api/niche-from-handle", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: buildProfileInput(activePlatform, trimmedHandle),
        }),
      });
      const data = (await response
        .json()
        .catch(() => ({}))) as HandleNicheApiResponse;

      if (!response.ok) {
        const fallbackPlan = buildCreatorManagerPlan({
          handle: trimmedHandle,
          platform: activePlatform,
          niche: activeManualNiche,
          nicheLabel: activeManualNiche,
          confidence: "low",
        });
        setPlan(fallbackPlan);
        setLookup(data);
        setStatus("error");
        setMessage(
          data.error ??
            "Could not scan that public account yet. A manual manager plan is loaded below.",
        );
        return;
      }

      const nextPlan =
        data.managerPlan ??
        buildCreatorManagerPlan({
          handle: data.handle ?? trimmedHandle,
          platform: data.platform ?? activePlatform,
          niche: data.niche ?? activeManualNiche,
          nicheLabel: data.nicheLabel,
          confidence: data.confidence,
        });

      setPlan(nextPlan);
      setLookup(data);
      setManualNiche(data.niche ?? activeManualNiche);
      setStatus("done");
      setMessage(
        `Loaded a ${nextPlan.nicheLabel} manager plan for ${nextPlan.handle}.`,
      );
    } catch (error) {
      const fallbackPlan = buildCreatorManagerPlan({
        handle: trimmedHandle,
        platform: activePlatform,
        niche: activeManualNiche,
        nicheLabel: activeManualNiche,
        confidence: "low",
      });
      setPlan(fallbackPlan);
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not scan that account. A manual manager plan is loaded below.",
      );
    }
  };

  useEffect(() => {
    if (autoScanRef.current || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const queryHandle = params.get("handle")?.trim();
    const queryPlatform = parsePlatformParam(params.get("platform"));
    const shouldAutoScan = params.get("autoscan") === "1";
    const nextPlatform = queryPlatform ?? platform;

    if (queryPlatform) setPlatform(queryPlatform);
    if (queryHandle) setHandle(queryHandle);

    if (shouldAutoScan && queryHandle) {
      autoScanRef.current = true;
      void scanAccount({
        handle: queryHandle,
        platform: nextPlatform,
      });
    }
    // The effect intentionally reads the initial URL once so a deep link cannot
    // retrigger scans while the user edits the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildManualPlan = () => {
    const niche = manualNiche.trim();
    if (!niche) {
      setMessage("Enter a niche before building a manual plan.");
      setStatus("error");
      return;
    }
    setPlan(
      buildCreatorManagerPlan({
        handle: handle.trim() || "@yourhandle",
        platform,
        niche,
        nicheLabel: niche,
        confidence: "low",
      }),
    );
    setLookup(null);
    setCompletedTasks([]);
    setStatus("done");
    setMessage(`Built a manual manager plan for ${niche}.`);
  };

  const toggleTask = (index: number) => {
    setCompletedTasks((prev) =>
      prev.includes(index)
        ? prev.filter((item) => item !== index)
        : [...prev, index],
    );
  };

  const PlatformIcon = platform === "Instagram" ? Instagram : Video;

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      <section className="creator-studio-panel w-full max-w-full overflow-hidden rounded-2xl border border-border p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-5">
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Creator Manager
              </h1>
              <p className="mt-1 max-w-3xl break-words text-sm leading-6 text-muted-foreground">
                Scan a public Instagram or TikTok account, detect the creator
                niche, then turn it into what to post, what to improve, and what
                to schedule next.
              </p>
            </div>
            <Button asChild className="creator-cta w-full sm:w-auto">
              <Link href="/analyze">
                Run trend analysis
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void scanAccount();
            }}
            className="grid min-w-0 gap-3 lg:grid-cols-[auto_minmax(220px,1fr)_auto]"
          >
            <div
              className="grid min-w-0 grid-cols-2 overflow-hidden rounded-xl border border-border bg-white/80 p-1"
              role="group"
              aria-label="Platform"
            >
              {platformOptions.map((option) => {
                const active = platform === option;
                const Icon = option === "Instagram" ? Instagram : Video;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPlatform(option)}
                    className={cn(
                      "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors",
                      active
                        ? "bg-white text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-pressed={active}
                  >
                    <Icon className="size-4" />
                    {option}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <AtSign className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={handle}
                onChange={(event) => {
                  setHandle(event.target.value);
                  setMessage(null);
                }}
                placeholder="@username or profile URL"
                className="h-12 w-full rounded-xl border border-border bg-white/90 py-0 pl-11 pr-4 text-sm font-semibold text-foreground outline-none placeholder:font-medium placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/35"
              />
            </div>

            <Button
              type="submit"
              disabled={status === "loading"}
              className="creator-cta h-12 rounded-xl px-5 text-sm font-bold text-primary-foreground"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Scanning
                </>
              ) : (
                <>
                  <Search className="size-4" />
                  Scan account
                </>
              )}
            </Button>
          </form>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={manualNiche}
                onChange={(event) => setManualNiche(event.target.value)}
                placeholder="Manual niche fallback"
                className="h-11 w-full rounded-xl border border-border bg-white/80 px-4 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30 sm:max-w-xs"
              />
              <button
                type="button"
                onClick={buildManualPlan}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white/80 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-white"
              >
                Build manual plan
                <ChevronRight className="size-4" />
              </button>
            </div>
            {message ? (
              <div
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm",
                  status === "error"
                    ? "border-amber-300/70 bg-amber-50 text-amber-900"
                    : "border-emerald-300/70 bg-emerald-50 text-emerald-800",
                )}
              >
                <span>{message}</span>
                {lookup?.upgradeUrl ? (
                  <Link
                    href={lookup.upgradeUrl}
                    className="ml-2 inline-flex items-center gap-1 font-bold text-primary"
                  >
                    Upgrade
                    <Lock className="size-3.5" />
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="creator-app-surface w-full max-w-full rounded-2xl border border-border p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
              <PlatformIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Detected manager profile
                </p>
                {plan.confidence ? (
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold capitalize text-primary">
                    {plan.confidence} confidence
                  </span>
                ) : null}
              </div>
              <h2 className="mt-1 text-xl font-semibold text-foreground">
                {plan.nicheLabel}
              </h2>
              <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-muted-foreground">
                {plan.summary}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-xl border border-border bg-white/70 p-3">
              <p className="text-xs text-muted-foreground">Account</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {plan.handle}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white/70 p-3">
              <p className="text-xs text-muted-foreground">Platform</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {plan.platform}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white/70 p-3">
              <p className="text-xs text-muted-foreground">Sources</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {lookup?.sourceCount ?? 0} public signals
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {plan.contentPillars.map((pillar) => (
            <div
              key={pillar.name}
              className="rounded-xl border border-border bg-white/70 p-4"
            >
              <Target className="size-4 text-primary" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                {pillar.name}
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid w-full max-w-full gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Post next
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Specific ideas based on the account niche and strongest content
                angles.
              </p>
            </div>
            <Link
              href="/analyze"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              Analyze niche
              <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-border">
            {plan.postQueue.map((post, index) => (
              <article
                key={`${post.title}-${index}`}
                className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[auto_1fr_auto] sm:items-start"
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg text-sm font-bold text-white",
                    index === 0
                      ? "bg-[#e45d7d]"
                      : index === 1
                        ? "bg-[#1f7a8c]"
                        : index === 2
                          ? "bg-[#f3bd48] text-[#2f2410]"
                          : "bg-[#64c7d4] text-[#12343a]",
                  )}
                >
                  {index + 1}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {post.title}
                    </h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      {post.format}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Hook: {post.hook}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {post.why}
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {post.action}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-sm font-bold text-emerald-700">
                  {post.score}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Do today
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                High-impact actions that make the content plan real.
              </p>
            </div>
            <Clock3 className="size-5 text-primary" />
          </div>

          <div className="mt-4 divide-y divide-border">
            {plan.dailyActions.map((task, index) => {
              const complete = completedTaskSet.has(index);
              return (
                <button
                  key={`${task.task}-${index}`}
                  type="button"
                  onClick={() => toggleTask(index)}
                  className="flex w-full items-center gap-3 py-3 text-left first:pt-0 last:pb-0"
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border",
                      complete
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-white",
                    )}
                  >
                    {complete ? <CheckCircle2 className="size-4" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block break-words text-sm font-semibold text-foreground",
                        complete && "line-through opacity-60",
                      )}
                    >
                      {task.task}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        taskTone(task.category),
                      )}
                    >
                      {task.category}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {task.minutes} min
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid w-full max-w-full gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.75fr)]">
        <div className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                This week&apos;s content
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A practical publishing rhythm to move ideas into the calendar.
              </p>
            </div>
            <Link
              href="/calendar"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              Open calendar
              <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            {plan.weeklySchedule.map((item) => (
              <div
                key={`${item.day}-${item.focus}`}
                className="grid gap-3 border-b border-border bg-white/70 p-3 last:border-b-0 sm:grid-cols-[76px_1fr_auto] sm:items-center"
              >
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {item.day}
                  </p>
                  <p className="text-xs text-muted-foreground">Plan</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {item.focus}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.format}</p>
                </div>
                <span className="w-fit rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid min-w-0 gap-6">
          <div className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-semibold text-foreground">
              Improve the account
            </h2>
            <ul className="mt-4 space-y-3">
              {plan.profileMoves.map((move) => (
                <li
                  key={move}
                  className="flex gap-3 text-sm leading-6 text-muted-foreground"
                >
                  <UserRound className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{move}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-semibold text-foreground">
              Gaps to fill
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {plan.contentGaps.map((gap) => (
                <span
                  key={gap}
                  className="rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-semibold text-foreground"
                >
                  {gap}
                </span>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {plan.trendPrompts.map((prompt) => (
                <p
                  key={prompt}
                  className="rounded-xl bg-muted/50 px-3 py-2 text-sm leading-6 text-muted-foreground"
                >
                  {prompt}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full max-w-full rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Creator ecosystem
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The manager is the control center. These tools handle the work
              around it.
            </p>
          </div>
          <Compass className="size-5 text-primary" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ecosystemTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-xl border border-border bg-white/70 p-4 transition-colors hover:border-primary/35 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <Icon className="size-5 text-primary" />
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">
                  {tool.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {tool.body}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="w-full max-w-full rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-white/70 p-4">
            <LayoutList className="size-5 text-primary" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              Primary goal
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {plan.primaryGoal}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-white/70 p-4 md:col-span-2">
            <p className="text-sm font-semibold text-foreground">
              Audience angle
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {plan.audienceAngle}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
