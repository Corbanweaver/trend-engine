"use client";

export const dynamic = "force-dynamic";

import {
  CalendarPlus,
  Copy,
  Download,
  ExternalLink,
  Search,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SavedIdeaContent } from "@/components/saved-idea-content";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase";
import { trackUiEvent } from "@/lib/telemetry";

type SavedIdea = {
  id: string;
  created_at: string;
  idea_title: string;
  idea_content: string;
  thumbnail_url: string;
  niche: string;
};

const SHARE_BASE_URL = "https://contentideamaker.com";
const PLAN_KEY = "calendar:plans";

type CalendarMap = Record<string, string[]>;
type SortMode = "newest" | "oldest" | "title";

function formatSavedDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getIdeaText(item: SavedIdea) {
  return `${item.idea_title} ${item.idea_content} ${item.niche}`.toLowerCase();
}

export default function SavedIdeasPage() {
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [detailIdea, setDetailIdea] = useState<SavedIdea | null>(null);
  const [query, setQuery] = useState("");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const niches = useMemo(() => {
    const values = new Set(
      ideas
        .map((idea) => idea.niche?.trim())
        .filter((niche): niche is string => Boolean(niche)),
    );
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [ideas]);

  const filteredIdeas = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return ideas
      .filter((item) => {
        const matchesQuery =
          !cleanQuery || getIdeaText(item).includes(cleanQuery);
        const matchesNiche =
          nicheFilter === "all" || item.niche === nicheFilter;
        return matchesQuery && matchesNiche;
      })
      .sort((a, b) => {
        if (sortMode === "oldest") {
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }
        if (sortMode === "title") {
          return (a.idea_title || "Saved idea").localeCompare(
            b.idea_title || "Saved idea",
          );
        }
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
  }, [ideas, nicheFilter, query, sortMode]);

  const closeDetail = useCallback(() => {
    setDetailIdea(null);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("idea")) {
        url.searchParams.delete("idea");
        const next = `${url.pathname}${url.search}${url.hash}`;
        window.history.replaceState({}, "", next);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!detailIdea) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailIdea, closeDetail]);

  useEffect(() => {
    if (loading || ideas.length === 0) return;
    try {
      const id = new URLSearchParams(window.location.search).get("idea");
      if (!id) return;
      const match = ideas.find((i) => i.id === id);
      if (match) setDetailIdea(match);
    } catch {
      /* ignore */
    }
  }, [loading, ideas]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  };

  useEffect(() => {
    document.title = "Saved Ideas - Content Idea Maker";
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
          .select(
            "id, created_at, idea_title, idea_content, thumbnail_url, niche",
          )
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
        setError(
          err instanceof Error ? err.message : "Failed to load saved ideas.",
        );
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
      setDetailIdea((prev) => (prev?.id === ideaId ? null : prev));
      showToast("Idea removed");
    } catch (err) {
      trackUiEvent({
        area: "saved",
        action: "remove_idea_exception",
        level: "error",
        message: err instanceof Error ? err.message : "unknown",
        context: { ideaId },
      });
      setError(
        err instanceof Error ? err.message : "Failed to remove saved idea.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const copyIdea = async (item: SavedIdea) => {
    const shareableLink = `${SHARE_BASE_URL}/saved?idea=${encodeURIComponent(item.id)}`;
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
    const shareUrl = `${SHARE_BASE_URL}/saved?idea=${encodeURIComponent(item.id)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.idea_title,
          text: shareText,
          url: shareUrl,
        });
        showToast("Shared");
        trackUiEvent({
          area: "saved",
          action: "share_native_success",
          context: { ideaId: item.id },
        });
        return;
      } catch {
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

  const saveIdeaToCalendar = (item: SavedIdea) => {
    const d = new Date();
    const dayKey = d.toISOString().slice(0, 10);
    try {
      const raw = window.localStorage.getItem(PLAN_KEY);
      const map = raw ? (JSON.parse(raw) as CalendarMap) : {};
      const existing = new Set(map[dayKey] ?? []);
      existing.add(item.id);
      map[dayKey] = [...existing];
      window.localStorage.setItem(PLAN_KEY, JSON.stringify(map));
      showToast("Saved to Calendar");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save idea to calendar.",
      );
    }
  };

  return (
    <main className="min-h-svh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        {toast ? (
          <div className="fixed right-4 top-4 z-[60] rounded-xl border border-emerald-300/60 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 shadow-lg backdrop-blur dark:border-emerald-300/40 dark:bg-emerald-500/15 dark:text-emerald-100">
            {toast}
          </div>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary dark:text-cyan-200/80">
              Library
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Saved Ideas
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {ideas.length
                ? `${ideas.length} saved idea${ideas.length === 1 ? "" : "s"} ready to reuse.`
                : "Keep your strongest content concepts here for later."}
            </p>
          </div>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/dashboard">
              <ExternalLink aria-hidden="true" />
              Dashboard
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="glass-surface shimmer rounded-2xl border border-border p-5 text-sm text-muted-foreground dark:border-white/10 dark:text-slate-300">
            Loading saved ideas...
          </div>
        ) : null}
        {error ? (
          <p className="rounded-md border border-red-300/60 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </p>
        ) : null}

        {!loading && !error && ideas.length === 0 ? (
          <div className="glass-surface overflow-hidden rounded-2xl border border-border dark:border-white/10">
            <div className="grid gap-0 md:grid-cols-[1.2fr_0.8fr]">
              <div className="p-8 sm:p-10">
                <p className="text-lg font-semibold text-foreground dark:text-slate-100">
                  No saved ideas yet
                </p>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground dark:text-slate-400">
                  Save a concept from the dashboard when it feels worth testing.
                  It will show up here with sharing, download, and calendar
                  actions.
                </p>
                <Button asChild className="mt-5">
                  <Link href="/dashboard">Find Ideas</Link>
                </Button>
              </div>
              <div className="hidden border-l border-border bg-muted/45 p-8 dark:border-white/10 dark:bg-slate-950/35 md:block">
                <div className="space-y-3">
                  {["Hook", "Angle", "Script", "Post plan"].map((label) => (
                    <div
                      key={label}
                      className="rounded-xl border border-border bg-card/70 px-4 py-3 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {!loading && !error && ideas.length > 0 ? (
          <section className="glass-surface rounded-2xl border border-border p-4 dark:border-white/10">
            <div className="grid gap-3 md:grid-cols-[1fr_180px_160px]">
              <label className="relative block">
                <span className="sr-only">Search saved ideas</span>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search titles, scripts, niches..."
                  className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-ring/20 dark:border-white/10 dark:bg-slate-950/40 dark:focus:border-cyan-300/60 dark:focus:ring-cyan-300/20"
                />
              </label>
              <label>
                <span className="sr-only">Filter by niche</span>
                <select
                  value={nicheFilter}
                  onChange={(e) => setNicheFilter(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-ring/20 dark:border-white/10 dark:bg-slate-950/40 dark:focus:border-cyan-300/60 dark:focus:ring-cyan-300/20"
                >
                  <option value="all">All niches</option>
                  {niches.map((niche) => (
                    <option key={niche} value={niche}>
                      {niche}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Sort saved ideas</span>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary/45 focus:ring-2 focus:ring-ring/20 dark:border-white/10 dark:bg-slate-950/40 dark:focus:border-cyan-300/60 dark:focus:ring-cyan-300/20"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="title">Title</option>
                </select>
              </label>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                Showing {filteredIdeas.length} of {ideas.length}
              </span>
              {query || nicheFilter !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setNicheFilter("all");
                  }}
                  className="font-medium text-primary hover:text-primary/80 dark:text-cyan-200 dark:hover:text-cyan-100"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {!loading &&
        !error &&
        ideas.length > 0 &&
        filteredIdeas.length === 0 ? (
          <div className="glass-surface rounded-2xl border border-border p-8 text-center dark:border-white/10">
            <p className="text-sm font-medium text-foreground dark:text-slate-200">
              No matches found
            </p>
            <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">
              Try a different search term or remove the niche filter.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {filteredIdeas.map((item, index) => (
            <article
              key={item.id}
              onClick={() => setDetailIdea(item)}
              className="fluid-transition glass-surface stagger-in group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card/80 text-left shadow-sm hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-xl hover:shadow-slate-900/10 dark:hover:border-cyan-300/35 dark:hover:shadow-black/20"
              style={{ ["--stagger" as string]: `${Math.min(index, 12)}` }}
            >
              {item.thumbnail_url ? (
                <div className="relative aspect-video w-full overflow-hidden border-b border-border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnail_url}
                    alt={item.idea_title || "Saved idea thumbnail"}
                    className="absolute inset-0 size-full object-cover"
                  />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-muted-foreground dark:border-white/10 dark:text-slate-200">
                    {item.niche || "General"}
                  </span>
                  <span>{formatSavedDate(item.created_at)}</span>
                </div>
                <h2 className="text-base font-semibold leading-snug text-foreground">
                  {item.idea_title || "Saved idea"}
                </h2>
                {item.idea_content ? (
                  <div className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                    <SavedIdeaContent content={item.idea_content} />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No script/content available for this idea.
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3 dark:border-white/10">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailIdea(item);
                    }}
                    className="h-8"
                  >
                    Open
                  </Button>
                  <button
                    type="button"
                    aria-label="Copy shareable link"
                    title="Copy shareable link"
                    onClick={(e) => {
                      e.stopPropagation();
                      void copyIdea(item);
                    }}
                    className="fluid-transition inline-flex size-8 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary hover:bg-primary/15 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-100 dark:hover:bg-cyan-500/20"
                  >
                    <Copy aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Download idea text file"
                    title="Download.txt"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadIdeaFile(item);
                    }}
                    className="fluid-transition inline-flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-accent text-accent-foreground hover:bg-accent/80 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-100 dark:hover:bg-indigo-500/20"
                  >
                    <Download aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Share saved idea"
                    title="Share"
                    onClick={(e) => {
                      e.stopPropagation();
                      void shareIdea(item);
                    }}
                    className="fluid-transition inline-flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-100 dark:hover:bg-violet-500/20"
                  >
                    <Share2 aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Save idea to calendar"
                    title="Save to Calendar"
                    onClick={(e) => {
                      e.stopPropagation();
                      saveIdeaToCalendar(item);
                    }}
                    className="fluid-transition inline-flex size-8 items-center justify-center rounded-lg border border-emerald-300/60 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/20"
                  >
                    <CalendarPlus aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove saved idea"
                    title="Remove"
                    disabled={deletingId === item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      void removeIdea(item.id);
                    }}
                    className="fluid-transition ml-auto inline-flex size-8 items-center justify-center rounded-lg border border-red-300/60 bg-red-50 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {detailIdea ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="presentation"
          onClick={() => closeDetail()}
        >
          <div
            className="max-h-[92svh] w-full overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:max-w-3xl sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="saved-idea-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border p-4 dark:border-white/10 sm:p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-muted-foreground dark:border-white/10 dark:text-slate-200">
                    {detailIdea.niche || "General"}
                  </span>
                  <span>{formatSavedDate(detailIdea.created_at)}</span>
                </div>
                <h3
                  id="saved-idea-detail-title"
                  className="mt-2 text-xl font-semibold leading-tight text-foreground"
                >
                  {detailIdea.idea_title || "Saved idea"}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close detail view"
                onClick={() => closeDetail()}
                className="fluid-transition inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
            <div className="max-h-[calc(92svh-170px)] overflow-y-auto p-4 sm:p-5">
              {detailIdea.thumbnail_url ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detailIdea.thumbnail_url}
                    alt={detailIdea.idea_title || "Saved idea thumbnail"}
                    className="absolute inset-0 size-full object-cover"
                  />
                </div>
              ) : null}
              <SavedIdeaContent
                content={
                  detailIdea.idea_content ||
                  "No script/content available for this idea."
                }
                className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground"
              />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border p-4 dark:border-white/10 sm:p-5">
              <Button
                type="button"
                size="sm"
                onClick={() => void copyIdea(detailIdea)}
              >
                <Copy aria-hidden="true" />
                Copy Link
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => downloadIdeaFile(detailIdea)}
              >
                <Download aria-hidden="true" />
                Download
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void shareIdea(detailIdea)}
              >
                <Share2 aria-hidden="true" />
                Share
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => saveIdeaToCalendar(detailIdea)}
              >
                <CalendarPlus aria-hidden="true" />
                Calendar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={deletingId === detailIdea.id}
                onClick={() => void removeIdea(detailIdea.id)}
                className="sm:ml-auto"
              >
                <Trash2 aria-hidden="true" />
                {deletingId === detailIdea.id ? "Removing..." : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
