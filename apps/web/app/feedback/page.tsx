"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type FeedbackRow = {
  id: string;
  user_id: string;
  idea_title: string;
  feedback: "thumbs_up" | "thumbs_down" | "written";
  feedback_text: string | null;
  created_at: string;
};

export default function FeedbackPage() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/idea-feedback/admin", { cache: "no-store" });
        const body = (await res.json()) as { error?: string; feedback?: FeedbackRow[] };
        if (!res.ok) {
          throw new Error(body.error || "Failed to load feedback");
        }
        setRows(body.feedback ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load feedback");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const stats = useMemo(() => {
    let up = 0;
    let down = 0;
    let written = 0;
    for (const row of rows) {
      if (row.feedback === "thumbs_up") up += 1;
      if (row.feedback === "thumbs_down") down += 1;
      if (row.feedback === "written") written += 1;
    }
    return { up, down, written, total: rows.length };
  }, [rows]);

  return (
    <main className="min-h-svh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">User Feedback</h1>
          <Link
            href="/dashboard"
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
          >
            Back to Dashboard
          </Link>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total entries</p>
            <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
          </article>
          <article className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Thumbs up</p>
            <p className="mt-2 text-2xl font-semibold text-blue-600 dark:text-cyan-300">{stats.up}</p>
          </article>
          <article className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Thumbs down</p>
            <p className="mt-2 text-2xl font-semibold text-rose-600 dark:text-amber-300">{stats.down}</p>
          </article>
          <article className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Written feedback</p>
            <p className="mt-2 text-2xl font-semibold">{stats.written}</p>
          </article>
        </section>

        {loading ? <p className="text-sm text-muted-foreground">Loading feedback...</p> : null}
        {error ? (
          <p className="rounded-xl border border-red-300/40 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </p>
        ) : null}

        {!loading && !error ? (
          <section className="space-y-3">
            {rows.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
                No feedback submissions yet.
              </div>
            ) : null}
            {rows.map((row) => (
              <article key={row.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border px-2 py-0.5">{row.feedback}</span>
                  <span>{new Date(row.created_at).toLocaleString()}</span>
                  <span className="truncate">user: {row.user_id}</span>
                </div>
                <p className="mt-2 text-sm font-medium">{row.idea_title}</p>
                {row.feedback_text ? (
                  <p className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 text-sm">
                    {row.feedback_text}
                  </p>
                ) : null}
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}

