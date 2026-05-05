"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AchievementBadges } from "@/components/achievement-badges";
import { AppQuickNav } from "@/components/app-quick-nav";
import { getSupabaseClient } from "@/lib/supabase";
import {
  computeEarnedBadgeIds,
  formatNicheDisplay,
  getNicheCounts,
  readTotalAnalyses,
  readTrendHistory,
} from "@/lib/user-stats";

export default function AnalyticsPage() {
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const totalAnalyses = useMemo(() => (ready ? readTotalAnalyses() : 0), [ready]);
  const history = useMemo(() => (ready ? readTrendHistory() : []), [ready]);
  const nicheRanks = useMemo(() => getNicheCounts(history), [history]);
  const earned = useMemo(
    () => computeEarnedBadgeIds(totalAnalyses, savedCount ?? 0),
    [totalAnalyses, savedCount],
  );

  useEffect(() => {
    document.title = "Analytics — Content Idea Maker";
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoadError(null);
      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          setLoadError("Please log in to view analytics tied to your saved ideas.");
          setSavedCount(0);
          setReady(true);
          return;
        }

        const { count, error: countError } = await supabase
          .from("saved_ideas")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (countError) {
          setLoadError(countError.message);
          setSavedCount(0);
        } else {
          setSavedCount(count ?? 0);
        }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load.");
        setSavedCount(0);
      } finally {
        setReady(true);
      }
    };
    void load();
  }, []);

  return (
    <main className="min-h-svh bg-background px-4 py-8 pb-24 text-foreground lg:pb-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your trend research activity and achievements
            </p>
          </div>
          <Link
            href="/dashboard"
            className="fluid-transition glass-surface rounded-xl border border-border px-3 py-2 text-sm text-foreground hover:bg-muted dark:border-white/20 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Back to Dashboard
          </Link>
        </div>
        <AppQuickNav active="analytics" />

        {loadError ? (
          <p className="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
            {loadError}
          </p>
        ) : null}

        <section className="glass-surface rounded-2xl border border-border p-5">
          <h2 className="text-sm font-medium text-foreground">Overview</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <p className="text-xs text-muted-foreground">Analyses (lifetime)</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {ready ? totalAnalyses : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <p className="text-xs text-muted-foreground">Saved ideas</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {ready && savedCount !== null ? savedCount : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <p className="text-xs text-muted-foreground">History entries</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {ready ? history.length : "—"}
              </p>
            </div>
          </div>
        </section>

        <section className="glass-surface rounded-2xl border border-border p-5">
          <h2 className="text-sm font-medium text-foreground">Most analyzed niches</h2>
          {!ready || nicheRanks.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {ready
                ? "Run “Analyze trends” on the dashboard to build your niche stats."
                : "Loading…"}
            </p>
          ) : (
            <ol className="mt-4 space-y-2">
              {nicheRanks.slice(0, 10).map((row, i) => (
                <li
                  key={`${row.niche}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {i + 1}. {formatNicheDisplay(row.niche)}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {row.count}×
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="glass-surface rounded-2xl border border-border p-5">
          <h2 className="text-sm font-medium text-foreground">Trend history</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Recent analyses from this device (newest first)
          </p>
          {!ready || history.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {ready
                ? "No runs recorded yet — your next analysis will appear here."
                : "Loading…"}
            </p>
          ) : (
            <ul className="mt-4 max-h-[min(50vh,400px)] space-y-2 overflow-y-auto pr-1">
              {history.slice(0, 50).map((entry, i) => (
                <li
                  key={`${entry.at}-${i}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/50 py-2 text-sm last:border-0"
                >
                  <span className="font-medium text-foreground">
                    {formatNicheDisplay(entry.niche)}
                  </span>
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={entry.at}
                  >
                    {new Date(entry.at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass-surface rounded-2xl border border-border p-5">
          <h2 className="text-sm font-medium text-foreground">Achievements</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Badges use lifetime analyses (this device) and total saved ideas in your account.
          </p>
          <div className="mt-4">
            {ready && savedCount !== null ? (
              <AchievementBadges earnedIds={earned} showLocked />
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/profile" className="underline underline-offset-2 hover:text-foreground">
            View profile
          </Link>
        </p>
      </div>
    </main>
  );
}
