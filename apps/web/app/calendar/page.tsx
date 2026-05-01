"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getSupabaseClient } from "@/lib/supabase";
import { trackUiEvent } from "@/lib/telemetry";

type SavedIdea = {
  id: string;
  idea_title: string;
  idea_content: string;
  thumbnail_url: string;
  created_at: string;
  niche: string;
};

type CalendarMap = Record<string, string[]>;

const PLAN_KEY = "calendar:plans";

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function CalendarPage() {
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarMap, setCalendarMap] = useState<CalendarMap>({});
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [dragIdeaId, setDragIdeaId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [deletingIdeaId, setDeletingIdeaId] = useState<string | null>(null);
  const blockDetailClickUntilRef = useRef(0);

  const closeDetail = useCallback(() => {
    setSelectedIdeaId(null);
  }, []);

  useEffect(() => {
    document.title = "Content Calendar — Trend Engine";
  }, []);

  useEffect(() => {
    if (!selectedIdeaId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIdeaId, closeDetail]);

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
            area: "calendar",
            action: "load_ideas_unauthorized",
            level: "warn",
          });
          setError("Please log in to manage your content calendar.");
          setIdeas([]);
          return;
        }
        const { data, error: fetchError } = await supabase
          .from("saved_ideas")
          .select("id, idea_title, idea_content, thumbnail_url, niche, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (fetchError) {
          trackUiEvent({
            area: "calendar",
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
          area: "calendar",
          action: "load_ideas_exception",
          level: "error",
          message: err instanceof Error ? err.message : "unknown",
        });
        setError(err instanceof Error ? err.message : "Failed to load calendar ideas.");
      } finally {
        setLoading(false);
      }
    };
    void loadIdeas();
    try {
      const raw = window.localStorage.getItem(PLAN_KEY);
      if (raw) setCalendarMap(JSON.parse(raw) as CalendarMap);
    } catch {
      /* ignore */
    }
  }, []);

  const saveMap = (next: CalendarMap) => {
    setCalendarMap(next);
    try {
      window.localStorage.setItem(PLAN_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const days = useMemo(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const startWeekday = (start.getDay() + 6) % 7;
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - startWeekday);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [month]);

  const ideaById = new Map(ideas.map((i) => [i.id, i]));
  const scheduled = new Set(Object.values(calendarMap).flat());
  const unscheduled = ideas.filter((i) => !scheduled.has(i.id));

  const assignIdea = (dateKey: string, ideaId: string) => {
    const next: CalendarMap = { ...calendarMap };
    Object.keys(next).forEach((k) => {
      next[k] = next[k].filter((id) => id !== ideaId);
      if (!next[k].length) delete next[k];
    });
    next[dateKey] = [...(next[dateKey] ?? []), ideaId];
    saveMap(next);
    trackUiEvent({
      area: "calendar",
      action: "assign_idea_to_date",
      context: { dateKey, ideaId },
    });
  };

  const removeFromCalendar = (ideaId: string) => {
    const next: CalendarMap = { ...calendarMap };
    Object.keys(next).forEach((k) => {
      next[k] = next[k].filter((id) => id !== ideaId);
      if (!next[k].length) delete next[k];
    });
    saveMap(next);
    trackUiEvent({
      area: "calendar",
      action: "remove_idea_from_calendar",
      context: { ideaId },
    });
  };

  const deleteIdea = async (ideaId: string) => {
    setDeletingIdeaId(ideaId);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Please log in to delete calendar ideas.");
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
      removeFromCalendar(ideaId);
      if (selectedIdeaId === ideaId) setSelectedIdeaId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete idea.");
    } finally {
      setDeletingIdeaId(null);
    }
  };

  const selectedIdea = selectedIdeaId ? ideaById.get(selectedIdeaId) ?? null : null;

  return (
    <main className="min-h-svh bg-background p-4 text-foreground">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Content Calendar</h1>
          <Link
            href="/dashboard"
            className="fluid-transition glass-surface rounded-xl border border-white/20 px-3 py-2 text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          {loading ? (
            <div className="glass-surface shimmer rounded-2xl border border-white/10 p-5 text-sm text-slate-300 lg:col-span-2">
              Loading calendar ideas...
            </div>
          ) : null}
          {error ? (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200 lg:col-span-2">
              {error}
            </div>
          ) : null}
          <aside className="glass-surface rounded-2xl border border-border bg-card p-3.5">
            <p className="mb-2 text-sm font-medium">Unscheduled ideas</p>
            <div className="space-y-2">
              {unscheduled.length === 0 ? (
                <div className="rounded-xl border border-border bg-muted p-3 text-xs text-muted-foreground">
                  All ideas are scheduled. Drag items between dates to reschedule.
                </div>
              ) : null}
              {unscheduled.map((idea, idx) => (
                <div
                  key={idea.id}
                  draggable
                  onDragStart={() => setDragIdeaId(idea.id)}
                  onDragEnd={() => {
                    blockDetailClickUntilRef.current = Date.now() + 250;
                  }}
                  onClick={() => {
                    if (Date.now() < blockDetailClickUntilRef.current) return;
                    setSelectedIdeaId(idea.id);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedIdeaId(idea.id);
                    }
                  }}
                  className="fluid-transition stagger-in spring-pop cursor-grab rounded-xl border border-border bg-muted/70 p-2 text-left text-xs outline-none hover:-translate-y-0.5 hover:border-blue-300 focus-visible:ring-2 focus-visible:ring-cyan-400/60 dark:hover:border-cyan-300/30"
                  style={{ ["--stagger" as string]: `${Math.min(idx, 10)}` }}
                >
                  {idea.thumbnail_url ? (
                    <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-md border border-border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={idea.thumbnail_url}
                        alt={idea.idea_title || "Saved idea thumbnail"}
                        className="absolute inset-0 size-full object-cover"
                      />
                    </div>
                  ) : null}
                  <p className="font-medium">{idea.idea_title || "Saved idea"}</p>
                  <p className="text-muted-foreground">{idea.niche}</p>
                </div>
              ))}
            </div>
          </aside>
          <section className="glass-surface rounded-2xl border border-border bg-card p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                className="fluid-transition rounded-lg border border-white/15 px-2 py-1 text-xs hover:border-white/30"
              >
                Prev
              </button>
              <h2 className="text-lg font-semibold">
                {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </h2>
              <button
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                className="fluid-transition rounded-lg border border-white/15 px-2 py-1 text-xs hover:border-white/30"
              >
                Next
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="px-1 text-xs text-muted-foreground">
                  {d}
                </div>
              ))}
              {days.map((d) => {
                const key = dayKey(d);
                const inMonth = d.getMonth() === month.getMonth();
                const ids = calendarMap[key] ?? [];
                return (
                  <div
                    key={key}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverKey(key);
                    }}
                    onDragLeave={() => setDragOverKey((prev) => (prev === key ? null : prev))}
                    onDrop={() => {
                      if (dragIdeaId) assignIdea(key, dragIdeaId);
                      setDragOverKey(null);
                    }}
                    className={`fluid-transition spring-pop min-h-28 rounded-xl border p-1.5 ${
                      dragOverKey === key
                        ? "scale-[1.02] border-cyan-300/55 shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_0_20px_rgba(34,211,238,0.2)]"
                        : ""
                    } ${
                      inMonth ? "border-border bg-muted/60" : "border-border/70 bg-muted/40"
                    }`}
                  >
                    <p className="mb-1 text-[11px] text-muted-foreground">{d.getDate()}</p>
                    <div className="space-y-1">
                      {ids.map((id) => {
                        const idea = ideaById.get(id);
                        if (!idea) return null;
                        return (
                          <div
                            key={id}
                            draggable
                            onDragStart={() => setDragIdeaId(id)}
                            onDragEnd={() => {
                              blockDetailClickUntilRef.current = Date.now() + 250;
                            }}
                            onClick={() => {
                              if (Date.now() < blockDetailClickUntilRef.current) return;
                              setSelectedIdeaId(id);
                            }}
                            className="fluid-transition cursor-grab rounded-lg border border-blue-200 bg-blue-50/80 px-1.5 py-1 text-left text-[11px] text-blue-900 hover:border-blue-300 dark:border-cyan-300/25 dark:bg-cyan-500/10 dark:text-cyan-100 dark:hover:border-cyan-300/40"
                          >
                            {idea.thumbnail_url ? (
                              <div className="relative mb-1 aspect-video w-full overflow-hidden rounded border border-border bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={idea.thumbnail_url}
                                  alt={idea.idea_title || "Saved idea thumbnail"}
                                  className="absolute inset-0 size-full object-cover"
                                />
                              </div>
                            ) : null}
                            <div className="flex items-center justify-between gap-1">
                              <span className="min-w-0 flex-1 truncate font-medium">
                                {idea.idea_title || "Saved idea"}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromCalendar(id);
                                }}
                                className="shrink-0 rounded border border-border px-1 text-[10px] text-foreground hover:bg-muted"
                              >
                                Remove
                              </button>
                              <button
                                type="button"
                                disabled={deletingIdeaId === id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void deleteIdea(id);
                                }}
                                className="shrink-0 rounded border border-red-300/40 px-1 text-[10px] text-red-100 hover:bg-red-500/20 disabled:opacity-60"
                              >
                                {deletingIdeaId === id ? "..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
      {selectedIdea ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={() => closeDetail()}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-border bg-card p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-idea-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {selectedIdea.niche} · {new Date(selectedIdea.created_at).toLocaleString()}
                </p>
                <h3
                  id="calendar-idea-detail-title"
                  className="mt-1 text-lg font-semibold text-foreground"
                >
                  {selectedIdea.idea_title || "Saved idea"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => closeDetail()}
                className="rounded-lg border border-border px-2 py-1 text-xs text-foreground hover:bg-muted"
              >
                Close
              </button>
            </div>
            {selectedIdea.thumbnail_url ? (
              <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedIdea.thumbnail_url}
                  alt={selectedIdea.idea_title || "Saved idea thumbnail"}
                  className="absolute inset-0 size-full object-cover"
                />
              </div>
            ) : null}
            <div className="mt-4 max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
              {selectedIdea.idea_content || "No script/content available for this idea."}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
