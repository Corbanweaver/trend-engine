"use client";

import { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  AtSign,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Instagram,
  Search,
  Sparkles,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tilt } from "@/components/creator/tilt";
import { buildCreatorManagerPlan } from "@/lib/creator-manager";
import { cn } from "@/lib/utils";

type PlatformOption = "Instagram" | "TikTok";

const platformOptions: Array<{
  label: PlatformOption;
  icon: typeof Instagram;
}> = [
  { label: "Instagram", icon: Instagram },
  { label: "TikTok", icon: Video },
];

const USERNAME_PATTERN = /^@?(?=.{2,30}$)(?=.*[A-Za-z0-9])[A-Za-z0-9._]+$/;

function cleanHandle(value: string) {
  return value.trim();
}

function isSupportedProfileUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const supportedHost =
      host === "instagram.com" ||
      host.endsWith(".instagram.com") ||
      host === "tiktok.com" ||
      host.endsWith(".tiktok.com");
    const hasPath = url.pathname.split("/").some(Boolean);
    return supportedHost && hasPath;
  } catch {
    return false;
  }
}

function isValidHandle(value: string) {
  if (!value) return false;
  if (/^https?:\/\//i.test(value)) return isSupportedProfileUrl(value);
  return USERNAME_PATTERN.test(value);
}

export function HandleScanHero() {
  const router = useRouter();
  const [platform, setPlatform] = useState<PlatformOption>("Instagram");
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showSample, setShowSample] = useState(false);

  const samplePlan = useMemo(
    () =>
      buildCreatorManagerPlan({
        handle: "@fitfuelbyalex",
        platform: "Instagram",
        niche: "fitness",
        nicheLabel: "Fitness",
        confidence: "high",
      }),
    [],
  );

  const submitHandle = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextHandle = cleanHandle(handle);

    if (!isValidHandle(nextHandle)) {
      setError("Enter one public username or profile URL.");
      return;
    }

    const params = new URLSearchParams({
      platform,
      handle: nextHandle,
      autoscan: "1",
    });
    router.push(`/manager?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-7 lg:grid-cols-[1fr_0.62fr]">
        <div className="self-start rounded-2xl border border-border bg-[#f7f8f5] p-6 shadow-sm sm:p-7">
          <form onSubmit={submitHandle} className="space-y-5">
            <div
              className="grid grid-cols-2 gap-1 overflow-hidden rounded-xl border border-border bg-white p-1.5"
              role="group"
              aria-label="Creator platform"
            >
              {platformOptions.map((option) => {
                const active = platform === option.label;
                const Icon = option.icon;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => {
                      setPlatform(option.label);
                      setError(null);
                    }}
                    className={cn(
                      "inline-flex h-12 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors",
                      active
                        ? "bg-[#141a23] text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-pressed={active}
                  >
                    <Icon className="size-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-foreground">
                Creator username
              </span>
              <span className="relative block">
                <AtSign className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={handle}
                  onChange={(event) => {
                    setHandle(event.target.value);
                    setError(null);
                  }}
                  placeholder="@username or profile URL"
                  className="h-[3.25rem] w-full rounded-xl border border-border bg-white py-0 pl-11 pr-4 text-sm font-semibold text-foreground outline-none placeholder:font-medium placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/35"
                  autoComplete="off"
                />
              </span>
            </label>

            {error ? (
              <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {error}
              </p>
            ) : null}

            <div className="grid gap-3.5 pt-1 sm:grid-cols-[1fr_auto]">
              <Button type="submit" size="lg" className="creator-cta h-[3.25rem] text-base">
                <Search className="size-4" />
                Get my plan
              </Button>
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="creator-outline-cta h-[3.25rem] bg-white text-base lg:hidden"
                onClick={() => setShowSample((current) => !current)}
              >
                <Sparkles className="size-4" />
                {showSample ? "Hide sample" : "See sample plan"}
              </Button>
            </div>
          </form>

          <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              Detect the account niche
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              Turn it into post ideas, tasks, and a schedule
            </span>
          </div>
        </div>

        <Tilt className="hidden lg:block">
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft-lg">
            <div className="flex items-center justify-between border-b border-border bg-[#f7f8f5] px-4 py-2.5">
              <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="size-2 rounded-full bg-emerald-500" />
                Creator Manager
              </span>
              <span className="font-[family-name:var(--font-geist-mono)] text-xs text-muted-foreground">
                @fitfuelbyalex · Fitness
              </span>
            </div>
            <div className="grid gap-4 p-4">
          <div className="rounded-xl bg-[#141a23] p-5 text-white shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-white/60">
                  Post next
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  {samplePlan.postQueue[0]?.title}
                </h2>
              </div>
              <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-bold tabular-nums">
                Score {samplePlan.postQueue[0]?.score}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/72">
              Hook: {samplePlan.postQueue[0]?.hook}
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-xl border border-border bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Do today
                </h3>
                <ClipboardList className="size-4 text-primary" />
              </div>
              <div className="mt-3 space-y-3">
                {samplePlan.dailyActions.slice(0, 2).map((task) => (
                  <div key={task.task} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="leading-5 text-muted-foreground">
                      {task.task}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Calendar
                </h3>
                <CalendarDays className="size-4 text-primary" />
              </div>
              <div className="mt-3 space-y-2">
                {samplePlan.weeklySchedule.slice(0, 3).map((item) => (
                  <div
                    key={`${item.day}-${item.focus}`}
                    className="grid grid-cols-[38px_1fr] gap-2 text-sm"
                  >
                    <span className="font-bold text-foreground">
                      {item.day}
                    </span>
                    <span className="truncate text-muted-foreground">
                      {item.format}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            className="h-11 justify-between bg-white"
          >
            <Link href="/manager">
              Open creator manager
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
            </div>
          </div>
        </Tilt>
      </div>

      {showSample ? (
        <div className="mt-4 grid gap-3 border-t border-border pt-4 md:grid-cols-3">
          {samplePlan.contentPillars.map((pillar) => (
            <div
              key={pillar.name}
              className="rounded-xl border border-border bg-[#f7f8f5] p-4"
            >
              <p className="text-sm font-semibold text-foreground">
                {pillar.name}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
