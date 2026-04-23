"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getSupabaseClient } from "@/lib/supabase";

type SavedIdea = {
  id: string;
  created_at: string;
  niche: string;
  trend: string;
  hook: string;
  angle: string;
  idea: string;
  script: string;
  hashtags: string[] | null;
  optimized_title: string | null;
  seo_description: string | null;
};

export default function SavedIdeasPage() {
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const loadIdeas = async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          setError("Please log in to view saved ideas.");
          setIdeas([]);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("saved_ideas")
          .select(
            "id, created_at, niche, trend, hook, angle, idea, script, hashtags, optimized_title, seo_description",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (fetchError) {
          setError(fetchError.message);
          setIdeas([]);
          return;
        }

        setIdeas((data as SavedIdea[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load saved ideas.");
      } finally {
        setLoading(false);
      }
    };

    void loadIdeas();
  }, []);

  const removeIdea = async (ideaId: string) => {
    setError(null);
    setDeletingId(ideaId);
    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Please log in to remove saved ideas.");
        return;
      }

      const { error: deleteError } = await supabase
        .from("saved_ideas")
        .delete()
        .eq("id", ideaId)
        .eq("user_id", user.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      setIdeas((prev) => prev.filter((idea) => idea.id !== ideaId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove saved idea.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-svh bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Saved Ideas</h1>
          <Link
            href="/dashboard"
            className="rounded-md border border-white/20 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Back to Dashboard
          </Link>
        </div>

        {loading ? <p className="text-sm text-slate-400">Loading saved ideas...</p> : null}
        {error ? (
          <p className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {!loading && !error && ideas.length === 0 ? (
          <p className="text-sm text-slate-400">No saved ideas yet.</p>
        ) : null}

        <div className="space-y-3">
          {ideas.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-white/10 bg-slate-900/80 p-4"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="rounded bg-white/5 px-2 py-1">{item.niche}</span>
                <span className="rounded bg-white/5 px-2 py-1">{item.trend}</span>
                <span>{new Date(item.created_at).toLocaleString()}</span>
              </div>
              <h2 className="text-base font-semibold text-slate-100">
                {item.optimized_title?.trim() || item.hook || "Saved idea"}
              </h2>
              <div className="mt-2">
                <button
                  type="button"
                  disabled={deletingId === item.id}
                  onClick={() => void removeIdea(item.id)}
                  className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingId === item.id ? "Removing..." : "Remove"}
                </button>
              </div>
              {item.hook ? <p className="mt-1 text-sm text-slate-300">Hook: {item.hook}</p> : null}
              {item.angle ? <p className="mt-1 text-sm text-slate-400">Angle: {item.angle}</p> : null}
              <p className="mt-2 text-sm text-slate-300">{item.idea}</p>
              {item.script ? (
                <pre className="mt-3 whitespace-pre-wrap rounded-md border border-white/10 bg-slate-950 p-3 text-xs text-slate-200">
                  {item.script}
                </pre>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
