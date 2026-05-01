"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AchievementBadges } from "@/components/achievement-badges";
import { getSupabaseClient } from "@/lib/supabase";
import { computeEarnedBadgeIds, readTotalAnalyses } from "@/lib/user-stats";

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAnalyses = useMemo(() => (ready ? readTotalAnalyses() : 0), [ready]);
  const earned = useMemo(
    () => computeEarnedBadgeIds(totalAnalyses, savedCount ?? 0),
    [totalAnalyses, savedCount],
  );

  useEffect(() => {
    document.title = "Profile — Trend Engine";
  }, []);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          setError("Please log in to view your profile.");
          setEmail(null);
          setAvatar(null);
          setSavedCount(0);
          setReady(true);
          return;
        }
        setEmail(user.email ?? null);
        setAvatar((user.user_metadata?.avatar_url as string | undefined) ?? null);

        const { count, error: countError } = await supabase
          .from("saved_ideas")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (countError) {
          setError(countError.message);
          setSavedCount(0);
        } else {
          setSavedCount(count ?? 0);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load profile.");
        setSavedCount(0);
      } finally {
        setReady(true);
      }
    };
    void load();
  }, []);

  return (
    <main className="min-h-svh bg-background px-4 py-8 pb-24 text-foreground lg:pb-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <Link
            href="/dashboard"
            className="fluid-transition glass-surface rounded-xl border border-white/20 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Back to Dashboard
          </Link>
        </div>

        {error ? (
          <p className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <section className="glass-surface flex flex-col items-center gap-4 rounded-2xl border border-border p-8 text-center sm:flex-row sm:items-center sm:text-left">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              className="size-20 shrink-0 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex size-20 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-2xl font-semibold text-foreground">
              {email ? email.slice(0, 1).toUpperCase() : "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-foreground">
              {email ?? "Signed out"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {ready ? (
                <>
                  <span className="tabular-nums">{totalAnalyses}</span> analyses on this device
                  {" · "}
                  <span className="tabular-nums">{savedCount ?? 0}</span> saved ideas
                </>
              ) : (
                "Loading…"
              )}
            </p>
            <p className="mt-3">
              <Link
                href="/analytics"
                className="text-sm font-medium text-primary underline underline-offset-2 hover:opacity-90"
              >
                Open analytics
              </Link>
            </p>
          </div>
        </section>

        <section className="glass-surface rounded-2xl border border-border p-5">
          <h2 className="text-sm font-medium text-foreground">Badges</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Milestones across your account and this browser
          </p>
          <div className="mt-4">
            {ready && savedCount !== null ? (
              <AchievementBadges earnedIds={earned} showLocked />
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
