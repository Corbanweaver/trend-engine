"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getSupabaseClient } from "@/lib/supabase";

type SavedIdea = {
  id: string;
  created_at: string;
  idea_title: string;
  idea_content: string;
  niche: string;
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
          .select("id, created_at, idea_title, idea_content, niche")
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

  const copyIdea = async (item: SavedIdea) => {
    const payload = `${item.idea_title || "Saved idea"}\n\n${item.idea_content || ""}`;
    try {
      await navigator.clipboard.writeText(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to copy idea.");
    }
  };

  const downloadIdeaAsPdf = (item: SavedIdea) => {
    const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!win) {
      setError("Popup blocked. Allow popups to download as PDF.");
      return;
    }
    const escapedTitle = (item.idea_title || "Saved idea")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const escapedBody = (item.idea_content || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");
    win.document.write(`
      <html>
        <head>
          <title>${escapedTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            h1 { margin: 0 0 12px; font-size: 24px; }
            .meta { color: #475569; margin-bottom: 16px; font-size: 13px; }
            .content { white-space: normal; line-height: 1.6; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>${escapedTitle}</h1>
          <div class="meta">Niche: ${item.niche} · Saved: ${new Date(item.created_at).toLocaleString()}</div>
          <div class="content">${escapedBody}</div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
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
                <span>{new Date(item.created_at).toLocaleString()}</span>
              </div>
              <h2 className="text-base font-semibold text-slate-100">{item.idea_title || "Saved idea"}</h2>
              <div className="mt-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copyIdea(item)}
                    className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-500/20"
                  >
                    Copy to clipboard
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadIdeaAsPdf(item)}
                    className="rounded-md border border-indigo-400/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-100 hover:bg-indigo-500/20"
                  >
                    Download as PDF
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => void removeIdea(item.id)}
                    className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === item.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
              {item.idea_content ? (
                <div className="mt-3 whitespace-pre-wrap rounded-md border border-white/10 bg-slate-950 p-3 font-sans text-sm leading-relaxed text-slate-200">
                  {item.idea_content}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
