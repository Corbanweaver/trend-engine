"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getSupabaseClient } from "@/lib/supabase";
import { getSelectableNicheOptions, NICHE_OPTIONS } from "@/lib/niches";
import { trackUiEvent } from "@/lib/telemetry";

type SubscriptionRow = {
  id: string;
  niche: string;
  created_at: string;
};

function nicheLabel(niche: string): string {
  const found = NICHE_OPTIONS.find((o) => o.value === niche);
  return found?.label ?? niche;
}

export default function TrendAlertsPage() {
  const selectable = useMemo(() => getSelectableNicheOptions(), []);
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>(selectable[0]?.value ?? "fitness");
  const [customNiche, setCustomNiche] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    document.title = "Trend Alerts — Trend Engine";
  }, []);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Please log in to manage trend alerts.");
        setRows([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("trend_alert_subscriptions")
        .select("id, niche, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (fetchError) {
        trackUiEvent({
          area: "alerts",
          action: "load_failed",
          level: "error",
          message: fetchError.message,
        });
        setError(fetchError.message);
        setRows([]);
        return;
      }

      setRows((data as SubscriptionRow[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscriptions.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubscriptions();
  }, [loadSubscriptions]);

  const subscribedValues = useMemo(() => new Set(rows.map((r) => r.niche.toLowerCase())), [rows]);

  const addSubscription = async () => {
    const raw =
      preset === "custom"
        ? customNiche.trim()
        : preset.trim();
    if (!raw) {
      setError("Choose a niche or enter a custom one.");
      return;
    }
    const stored = raw.toLowerCase();
    if (subscribedValues.has(stored)) {
      showToast("Already subscribed to this niche");
      return;
    }

    setAdding(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Please log in to add subscriptions.");
        return;
      }

      const { data: inserted, error: insertError } = await supabase
        .from("trend_alert_subscriptions")
        .insert({ user_id: user.id, niche: stored })
        .select("id, niche, created_at")
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          showToast("Already subscribed to this niche");
          return;
        }
        setError(insertError.message);
        return;
      }

      if (inserted) {
        setRows((prev) => [...prev, inserted as SubscriptionRow]);
        showToast("Niche added");
        trackUiEvent({ area: "alerts", action: "subscribe", context: { niche: stored } });
      }
      if (preset === "custom") setCustomNiche("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add subscription.");
    } finally {
      setAdding(false);
    }
  };

  const removeSubscription = async (id: string) => {
    setRemovingId(id);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Please log in.");
        return;
      }

      const { error: deleteError } = await supabase
        .from("trend_alert_subscriptions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      setRows((prev) => prev.filter((r) => r.id !== id));
      showToast("Removed");
      trackUiEvent({ area: "alerts", action: "unsubscribe", context: { id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <main className="min-h-svh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-2xl space-y-6">
        {toast ? (
          <div className="fixed right-4 top-4 z-50 rounded-xl border border-emerald-300/40 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100 shadow-lg">
            {toast}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Trend Alerts</h1>
          <Link
            href="/dashboard"
            className="fluid-transition glass-surface rounded-xl border border-white/20 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="glass-surface rounded-2xl border border-white/10 p-6">
          <p className="text-sm leading-relaxed text-slate-300">
            Subscribe to niches you care about. Each week you&apos;ll get one email with the top three
            trending topics per niche, powered by the same discovery engine as the dashboard. Delivery is
            typically Monday morning (UTC). You can add or remove niches anytime.
          </p>
        </div>

        {loading ? (
          <div className="glass-surface shimmer rounded-2xl border border-white/10 p-5 text-sm text-slate-300">
            Loading subscriptions...
          </div>
        ) : null}

        {error ? (
          <p className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {!loading && !error?.startsWith("Please log in") ? (
          <div className="glass-surface rounded-2xl border border-white/10 p-6 space-y-4">
            <h2 className="text-lg font-medium text-foreground">Add a niche</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
                Niche
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value)}
                  className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
                >
                  {selectable.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                  <option value="custom">Custom…</option>
                </select>
              </label>
              {preset === "custom" ? (
                <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
                  Custom niche name
                  <input
                    type="text"
                    value={customNiche}
                    onChange={(e) => setCustomNiche(e.target.value)}
                    placeholder="e.g. pickleball"
                    className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </label>
              ) : null}
              <button
                type="button"
                disabled={adding}
                onClick={() => void addSubscription()}
                className="fluid-transition rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-500/25 disabled:opacity-50"
              >
                {adding ? "Adding…" : "Subscribe"}
              </button>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <h2 className="text-lg font-medium text-foreground">Your niches</h2>
          {!loading && rows.length === 0 && !error ? (
            <div className="glass-surface rounded-2xl border border-white/10 p-8 text-center">
              <p className="text-sm font-medium text-slate-200">No alerts yet</p>
              <p className="mt-1 text-xs text-slate-400">
                Add at least one niche above to start receiving the weekly digest.
              </p>
            </div>
          ) : null}

          {rows.map((row, index) => (
            <article
              key={row.id}
              className="fluid-transition glass-surface stagger-in flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
              style={{ ["--stagger" as string]: `${Math.min(index, 12)}` }}
            >
              <div>
                <p className="font-medium text-foreground">{nicheLabel(row.niche)}</p>
                <p className="text-xs text-muted-foreground">
                  Added {new Date(row.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                disabled={removingId === row.id}
                onClick={() => void removeSubscription(row.id)}
                className="fluid-transition shrink-0 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/20 disabled:opacity-50"
              >
                {removingId === row.id ? "Removing…" : "Remove"}
              </button>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
