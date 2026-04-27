"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, LogOut, Search, Sparkles } from "lucide-react";
import type { User } from "@supabase/supabase-js";

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
import { getSupabaseClient } from "@/lib/supabase";
import type {
  TrendIdea,
  TrendIdeasResponse,
  VideoIdea,
} from "@/lib/trend-ideas-types";
import { computeEngagementRaw, engagementHeat } from "@/lib/trend-metrics";
import { cn } from "@/lib/utils";

const TREND_RESULTS_STORAGE_KEY = "trend_dashboard:last_results";

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

type PlatformChip = "All" | "TikTok" | "YouTube" | "Reddit" | "Instagram" | "Twitter";

const PLATFORM_CHIPS: PlatformChip[] = [
  "All",
  "TikTok",
  "YouTube",
  "Reddit",
  "Instagram",
  "Twitter",
];

const platformIconStyles: Record<string, string> = {
  TikTok: "bg-pink-500/20 text-pink-200 border-pink-400/40",
  YouTube: "bg-red-500/20 text-red-200 border-red-400/40",
  Reddit: "bg-orange-500/20 text-orange-200 border-orange-400/40",
  Instagram: "bg-purple-500/20 text-purple-200 border-purple-400/40",
  Twitter: "bg-sky-500/20 text-sky-200 border-sky-400/40",
};

const platformGlyph: Record<string, string> = {
  TikTok: "♪",
  YouTube: "▶",
  Reddit: "R",
  Instagram: "◎",
  Twitter: "X",
};

function getPlatformBadges(trend: TrendIdea): string[] {
  const badges: string[] = [];
  const hasTaggedInstagram = trend.instagram_posts.some(
    (p) => (p as { platform?: string }).platform === "instagram",
  );
  const hasTaggedYoutube = trend.example_videos.some(
    (v) => (v as { platform?: string }).platform === "youtube",
  );
  if (trend.tiktok_videos.length > 0) badges.push("TikTok");
  if (trend.example_videos.length > 0 || hasTaggedYoutube) badges.push("YouTube");
  if (trend.reddit_posts.length > 0) badges.push("Reddit");
  if (trend.instagram_posts.length > 0 || hasTaggedInstagram) badges.push("Instagram");
  if (trend.web_results.length > 0 || trend.hackernews_stories.length > 0) {
    badges.push("Twitter");
  }
  if (badges.length === 0) badges.push("Reddit");
  return [...new Set(badges)].slice(0, 5);
}

function getCardVisual(trend: TrendIdea) {
  const youtubeThumb = trend.example_videos.find(
    (v) => typeof v.thumbnail === "string" && v.thumbnail,
  )?.thumbnail as string | undefined;
  const tiktokCover = trend.tiktok_videos.find(
    (v) => typeof v.cover === "string" && v.cover,
  )?.cover as string | undefined;
  return youtubeThumb || tiktokCover || null;
}

function TrendCard({
  trend,
  index,
  selected,
  onSelect,
}: {
  trend: TrendIdea;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const raw = computeEngagementRaw(trend);
  const heat = engagementHeat(raw);
  const platformBadges = getPlatformBadges(trend);
  const visual = getCardVisual(trend);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleCardMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 5;
    const rotateX = (0.5 - py) * 5;
    setTilt({ x: rotateX, y: rotateY });
  };

  const resetCardTilt = () => setTilt({ x: 0, y: 0 });

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseMove={handleCardMove}
      onMouseLeave={resetCardTilt}
      style={{ animationDelay: `${Math.min(index, 10) * 70}ms` }}
      className={cn(
        "mb-4 w-full break-inside-avoid text-left transition-all duration-200 motion-safe:animate-card-in",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
      )}
    >
      <Card
        className={cn(
          "group relative cursor-pointer overflow-hidden border-white/10 bg-gradient-to-br from-slate-900/95 to-slate-950/95 text-slate-100 shadow-lg shadow-black/30",
          "transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-cyan-300/40 hover:shadow-cyan-500/20",
          selected &&
            "ring-2 ring-cyan-300/80 shadow-[0_0_0_1px_rgba(56,189,248,0.5),0_0_36px_rgba(56,189,248,0.28)]",
        )}
        style={{
          transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        {selected ? (
          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.22),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.18),transparent_55%)]" />
        ) : null}
        <div className="relative h-32 overflow-hidden border-b border-white/10">
          {visual ? (
            // Using API-provided thumbnails when available.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={visual}
              alt={trend.trend}
              className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.35),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(244,114,182,0.3),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(99,102,241,0.25),transparent_40%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5">
            {platformBadges.slice(0, 3).map((badge) => (
              <span
                key={`${trend.trend}-${badge}-glyph`}
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold",
                  platformIconStyles[badge],
                )}
              >
                {platformGlyph[badge]}
              </span>
            ))}
          </div>
        </div>
        <CardHeader className="space-y-3 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {platformBadges.map((badge) => (
                <span
                  key={`${trend.trend}-${badge}`}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                    platformIconStyles[badge],
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
          <ChevronRight className="ml-1 size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
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
          <Sparkles className="size-8 text-cyan-300" />
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

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: PlatformChip;
  active: boolean;
  onClick: () => void;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setOffset({ x: px * 8, y: py * 8 });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
        active
          ? "border-cyan-300/70 bg-cyan-400/20 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:text-white",
      )}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
    >
      {label}
    </button>
  );
}

export function TrendDashboard() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [nicheKey, setNicheKey] = useState("fitness");
  const [customNiche, setCustomNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrendIdeasResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<PlatformChip>("All");
  const [signingOut, setSigningOut] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userAvatar, setUserAvatar] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(TREND_RESULTS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as TrendIdeasResponse;
      if (parsed?.trend_ideas && Array.isArray(parsed.trend_ideas)) {
        setData(parsed);
      }
    } catch {
      /* ignore malformed cache */
    }
  }, []);

  const effectiveNiche =
    nicheKey === "custom"
      ? (customNiche.trim() || "fitness")
      : nicheKey;

  const selectedTrend =
    data && selectedIndex !== null
      ? (data.trend_ideas[selectedIndex] ?? null)
      : null;

  const sheetOpen = isMobile && selectedIndex !== null;

  const filteredTrends = (data?.trend_ideas ?? []).filter((trend) => {
    const labels = getPlatformBadges(trend);
    const matchesPlatform =
      platformFilter === "All" || labels.includes(platformFilter);
    const q = query.trim().toLowerCase();
    const matchesQuery =
      q.length === 0 ||
      trend.trend.toLowerCase().includes(q) ||
      trend.ideas.some(
        (idea) =>
          idea.idea.toLowerCase().includes(q) ||
          idea.hook.toLowerCase().includes(q) ||
          (idea.optimized_title ?? "").toLowerCase().includes(q),
      );
    return matchesPlatform && matchesQuery;
  });

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedIndex(null);
    try {
      const res = await fetchTrendIdeas(effectiveNiche);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [effectiveNiche]);

  useEffect(() => {
    try {
      if (data) {
        window.localStorage.setItem(TREND_RESULTS_STORAGE_KEY, JSON.stringify(data));
      } else {
        window.localStorage.removeItem(TREND_RESULTS_STORAGE_KEY);
      }
    } catch {
      /* ignore storage errors */
    }
  }, [data]);

  const signOut = useCallback(async () => {
    setSigningOut(true);
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }, [router]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const setUserState = (user: User | null) => {
      setUserEmail(user?.email ?? "");
      setUserAvatar((user?.user_metadata?.avatar_url as string | undefined) ?? "");
    };

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserState(user);
    };

    void loadUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserState(session?.user ?? null);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const saveIdea = useCallback(
    async ({ trend, idea }: { trend: string; idea: VideoIdea }) => {
      const supabase = getSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("You must be logged in to save ideas.");
      }

      const { error: insertError } = await supabase.from("saved_ideas").insert({
        user_id: user.id,
        idea_title: idea.optimized_title?.trim() || idea.hook || trend || "Saved idea",
        idea_content: idea.script?.trim() || idea.idea,
        niche: effectiveNiche,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }
    },
    [effectiveNiche],
  );

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-slate-950 text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(circle at 10% 10%, rgba(34,211,238,0.14), transparent 40%), radial-gradient(circle at 85% 18%, rgba(244,114,182,0.14), transparent 36%), radial-gradient(circle at 50% 90%, rgba(99,102,241,0.12), transparent 42%)",
        }}
      />
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
          <Link
            href="/saved"
            className="rounded-md border border-white/15 bg-slate-900/70 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800"
          >
            Saved Ideas
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200">
            {userAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userAvatar}
                alt="User avatar"
                className="size-6 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-6 items-center justify-center rounded-full bg-cyan-400/20 text-[10px] font-semibold text-cyan-200">
                {userEmail ? userEmail.slice(0, 1).toUpperCase() : "U"}
              </div>
            )}
            <span className="max-w-[180px] truncate">{userEmail || "Logged in user"}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={signingOut}
            onClick={signOut}
            className="h-9 border-white/20 bg-slate-900/70 text-slate-100 hover:bg-slate-800"
          >
            {signingOut ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="size-4" />
                Logout
              </>
            )}
          </Button>
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
                <option
                  key={o.value}
                  value={o.value}
                  disabled={o.value.startsWith("__group_")}
                >
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
            {loading ? (
              <p className="w-full text-xs text-slate-400 sm:w-auto">
                This may take a moment while we scan live trends across platforms.
              </p>
            ) : null}
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 pb-4">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trends, hooks, or idea titles..."
              className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/80 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_CHIPS.map((chip) => {
              const active = platformFilter === chip;
              return (
                <FilterChip
                  key={chip}
                  label={chip}
                  active={active}
                  onClick={() => setPlatformFilter(chip)}
                />
              );
            })}
          </div>
        </div>
      </header>

      {error ? (
        <div className="mx-4 mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-0 flex-1">
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
            filteredTrends.length > 0 ? (
              <div className="mx-auto max-w-[1100px] columns-1 gap-4 sm:columns-2 xl:columns-3">
                {filteredTrends.map((trend, index) => {
                  const realIndex = data.trend_ideas.findIndex(
                    (t) => t.trend === trend.trend,
                  );
                  return (
                    <TrendCard
                      key={`${trend.trend}-${index}`}
                      trend={trend}
                      index={index}
                      selected={selectedIndex === realIndex}
                      onSelect={() => setSelectedIndex(realIndex)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
                <p className="text-sm font-medium text-slate-200">
                  No trends match this filter
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Try another platform chip or clear your search terms.
                </p>
              </div>
            )
          ) : null}
        </div>

        <aside
          className={cn(
            "hidden w-[min(420px,40vw)] shrink-0 border-l border-white/10 bg-slate-900/70 lg:block",
            "transition-all duration-300",
            selectedTrend
              ? "translate-x-0 opacity-100"
              : "translate-x-2 opacity-90",
          )}
        >
          <ScrollArea className="h-[calc(100vh-57px)]">
            <IdeaPanel trend={selectedTrend} onSaveIdea={saveIdea} />
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
          <IdeaPanel trend={selectedTrend} onSaveIdea={saveIdea} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
