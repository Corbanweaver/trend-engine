"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getSupabaseClient } from "@/lib/supabase";
import { trackUiEvent } from "@/lib/telemetry";

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
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  };

  useEffect(() => {
    document.title = "Saved Ideas — Trend Engine";
  }, []);

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
          trackUiEvent({
            area: "saved",
            action: "load_ideas_unauthorized",
            level: "warn",
          });
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
          trackUiEvent({
            area: "saved",
            action: "load_ideas_failed",
            level: "error",
            message: fetchError.message,
          });
          setError(fetchError.message);
          setIdeas([]);
          return;
        }

        setIdeas((data as SavedIdea[]) ?? []);
      } catch (err) {
        trackUiEvent({
          area: "saved",
          action: "load_ideas_exception",
          level: "error",
          message: err instanceof Error ? err.message : "unknown",
        });
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
        trackUiEvent({
          area: "saved",
          action: "remove_idea_unauthorized",
          level: "warn",
        });
        setError("Please log in to remove saved ideas.");
        return;
      }

      const { error: deleteError } = await supabase
        .from("saved_ideas")
        .delete()
        .eq("id", ideaId)
        .eq("user_id", user.id);

      if (deleteError) {
        trackUiEvent({
          area: "saved",
          action: "remove_idea_failed",
          level: "error",
          message: deleteError.message,
          context: { ideaId },
        });
        setError(deleteError.message);
        return;
      }

      setIdeas((prev) => prev.filter((idea) => idea.id !== ideaId));
    } catch (err) {
      trackUiEvent({
        area: "saved",
        action: "remove_idea_exception",
        level: "error",
        message: err instanceof Error ? err.message : "unknown",
        context: { ideaId },
      });
      setError(err instanceof Error ? err.message : "Failed to remove saved idea.");
    } finally {
      setDeletingId(null);
    }
  };

  const copyIdea = async (item: SavedIdea) => {
    const shareableLink = `${window.location.origin}/saved?idea=${encodeURIComponent(item.id)}`;
    try {
      await navigator.clipboard.writeText(shareableLink);
      showToast("Shareable link copied");
      trackUiEvent({
        area: "saved",
        action: "copy_idea_success",
        context: { ideaId: item.id },
      });
    } catch (err) {
      trackUiEvent({
        area: "saved",
        action: "copy_idea_failed",
        level: "error",
        message: err instanceof Error ? err.message : "unknown",
        context: { ideaId: item.id },
      });
      setError(err instanceof Error ? err.message : "Failed to copy idea.");
    }
  };

  const downloadIdeaFile = (item: SavedIdea) => {
    const content = [
      `${item.idea_title || "Saved idea"}`,
      `Niche: ${item.niche}`,
      `Saved: ${new Date(item.created_at).toLocaleString()}`,
      "",
      item.idea_content || "",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(item.idea_title || "trend-idea").slice(0, 40).replace(/[^\w-]+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    trackUiEvent({
      area: "saved",
      action: "txt_download_started",
      context: { ideaId: item.id },
    });
    showToast("Idea file downloaded");
  };

  const shareIdea = async (item: SavedIdea) => {
    const shareText = `${item.idea_title}\nNiche: ${item.niche}\n\n${item.idea_content}`;
    const shareUrl = `${window.location.origin}/saved`;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.idea_title, text: shareText, url: shareUrl });
        showToast("Shared");
        trackUiEvent({
          area: "saved",
          action: "share_native_success",
          context: { ideaId: item.id },
        });
        return;
      } catch {
        // fall through to clipboard
        trackUiEvent({
          area: "saved",
          action: "share_native_cancel_or_fail",
          level: "warn",
          context: { ideaId: item.id },
        });
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      showToast("Shared copy ready");
      trackUiEvent({
        area: "saved",
        action: "share_clipboard_success",
        context: { ideaId: item.id },
      });
    } catch (err) {
      trackUiEvent({
        area: "saved",
        action: "share_clipboard_failed",
        level: "error",
        message: err instanceof Error ? err.message : "unknown",
        context: { ideaId: item.id },
      });
      setError(err instanceof Error ? err.message : "Failed to share idea.");
    }
  };

  return (
    <main className="min-h-svh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-5xl space-y-6">
        {toast ? (
          <div className="fixed right-4 top-4 z-50 rounded-xl border border-emerald-300/40 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100 shadow-lg">
            {toast}
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Saved Ideas</h1>
          <Link
            href="/dashboard"
            className="fluid-transition glass-surface rounded-xl border border-white/20 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="glass-surface shimmer rounded-2xl border border-white/10 p-5 text-sm text-slate-300">
            Loading saved ideas...
          </div>
        ) : null}
        {error ? (
          <p className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {!loading && !error && ideas.length === 0 ? (
          <div className="glass-surface rounded-2xl border border-white/10 p-8 text-center">
            <p className="text-sm font-medium text-slate-200">No saved ideas yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Save your best ideas from the dashboard and they will appear here.
            </p>
          </div>
        ) : null}

        <div className="space-y-3">
          {ideas.map((item, index) => (
            <article
              key={item.id}
              className="fluid-transition glass-surface stagger-in rounded-2xl border border-white/10 p-5"
              style={{ ["--stagger" as string]: `${Math.min(index, 12)}` }}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="rounded bg-white/5 px-2 py-1">{item.niche}</span>
                <span>{new Date(item.created_at).toLocaleString()}</span>
              </div>
              <h2 className="text-base font-semibold text-slate-100">{item.idea_title || "Saved idea"}</h2>
              <div className="mt-2">
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => void copyIdea(item)}
                    className="fluid-transition rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-500/20"
                  >
                    Copy shareable link
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadIdeaFile(item)}
                    className="fluid-transition rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-100 hover:bg-indigo-500/20"
                  >
                    Download .txt
                  </button>
                  <button
                    type="button"
                    onClick={() => void shareIdea(item)}
                    className="fluid-transition rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-100 hover:bg-violet-500/20"
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => void removeIdea(item.id)}
                    className="fluid-transition rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === item.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
              {item.idea_content ? (
                <div className="mt-3 whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-950/75 p-3.5 font-sans text-sm leading-relaxed text-slate-200">
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
