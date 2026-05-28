"use client";

import { Copy, Download } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppQuickNav } from "@/components/app-quick-nav";
import { SavedIdeaContent } from "@/components/saved-idea-content";
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
type CalendarEntry = {
  dateKey: string;
  order: number;
  idea: SavedIdea;
};

const PLAN_KEY = "calendar:plans";

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function formatPlanDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function buildCalendarText(entries: CalendarEntry[], month: Date) {
  const monthLabel = month.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  return [
    `TrendBoard content calendar - ${monthLabel}`,
    "",
    ...entries.map(({ dateKey, order, idea }) =>
      [
        `${formatPlanDate(dateKey)} - Post ${order}`,
        `Title: ${idea.idea_title || "Saved idea"}`,
        `Niche: ${idea.niche || "General"}`,
        "",
        idea.idea_content || "",
      ].join("\n"),
    ),
  ].join("\n\n---\n\n");
}

function buildCalendarCsv(entries: CalendarEntry[]) {
  return [
    ["Date", "Post order", "Title", "Niche", "Content"].map(csvCell).join(","),
    ...entries.map(({ dateKey, order, idea }) =>
      [
        formatPlanDate(dateKey),
        order,
        idea.idea_title || "Saved idea",
        idea.niche || "General",
        idea.idea_content || "",
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\n");
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
  const [toast, setToast] = useState<string | null>(null);
  const blockDetailClickUntilRef = useRef(0);

  const closeDetail = useCallback(() => {
    setSelectedIdeaId(null);
  }, []);

  useEffect(() => {
    document.title = "Content Calendar — TrendBoard";
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
          .select(
            "id, idea_title, idea_content, thumbnail_url, niche, created_at",
          )
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
        setError(
          err instanceof Error ? err.message : "Failed to load calendar ideas.",
        );
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

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
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
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const monthEntries = useMemo(() => {
    const lookup = new Map(ideas.map((idea) => [idea.id, idea]));
    return Object.entries(calendarMap)
      .filter(([dateKey]) => dateKey.startsWith(monthKey))
      .flatMap(([dateKey, ids]) =>
        ids
          .map((id, index): CalendarEntry | null => {
            const idea = lookup.get(id);
            return idea ? { dateKey, order: index + 1, idea } : null;
          })
          .filter((entry): entry is CalendarEntry => Boolean(entry)),
      )
      .sort((a, b) => {
        if (a.dateKey === b.dateKey) return a.order - b.order;
        return a.dateKey.localeCompare(b.dateKey);
      });
  }, [calendarMap, ideas, monthKey]);

  const copyMonthPlan = async () => {
    if (!monthEntries.length) {
      showToast("No scheduled ideas this month");
      return;
    }
    try {
      await navigator.clipboard.writeText(buildCalendarText(monthEntries, month));
      trackUiEvent({
        area: "calendar",
        action: "copy_month_plan_success",
        context: { count: monthEntries.length, month: monthKey },
      });
      showToast("Month plan copied");
    } catch (err) {
      trackUiEvent({
        area: "calendar",
        action: "copy_month_plan_failed",
        level: "error",
        message: err instanceof Error ? err.message : "unknown",
      });
      setError(err instanceof Error ? err.message : "Failed to copy plan.");
    }
  };

  const exportMonthCsv = () => {
    if (!monthEntries.length) {
      showToast("No scheduled ideas this month");
      return;
    }
    const blob = new Blob([buildCalendarCsv(monthEntries)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trendboard-calendar-${monthKey}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    trackUiEvent({
      area: "calendar",
      action: "export_month_calendar_csv",
      context: { count: monthEntries.length, month: monthKey },
    });
    showToast("Calendar CSV exported");
  };

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
    showToast("Idea scheduled");
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
    showToast("Removed from calendar");
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

  const selectedIdea = selectedIdeaId
    ? (ideaById.get(selectedIdeaId) ?? null)
    : null;
  const selectedIdeaIsScheduled = selectedIdeaId
    ? Object.values(calendarMap).some((ids) => ids.includes(selectedIdeaId))
    : false;

  return (
    <main className="min-h-svh bg-background p-4 text-foreground">
      <div className="mx-auto max-w-7xl space-y-5">
        {toast ? (
          <div className="fixed right-4 top-4 z-[60] rounded-xl border border-emerald-300/60 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 shadow-lg backdrop-blur dark:border-emerald-300/40 dark:bg-emerald-500/15 dark:text-emerald-100">
            {toast}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Content Calendar
          </h1>
          <Link
            href="/dashboard"
            className="fluid-transition glass-surface rounded-xl border border-border px-3 py-2 text-sm text-foreground hover:bg-muted dark:border-white/20"
          >
            Back to Dashboard
          </Link>
        </div>
        <AppQuickNav active="calendar" />
        <section className="glass-surface flex flex-col gap-3 rounded-2xl border border-border bg-card p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-2 text-sm sm:flex sm:flex-wrap">
            <div className="rounded-xl border border-border bg-muted/60 px-3 py-2 dark:border-white/10">
              <p className="text-[11px] text-muted-foreground">Scheduled</p>
              <p className="font-semibold">{monthEntries.length} this month</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/60 px-3 py-2 dark:border-white/10">
              <p className="text-[11px] text-muted-foreground">Unscheduled</p>
              <p className="font-semibold">{unscheduled.length} ideas</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyMonthPlan()}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <Copy className="size-4" />
              Copy month plan
            </button>
            <button
              type="button"
              onClick={exportMonthCsv}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <Download className="size-4" />
              Export CSV
            </button>
          </div>
        </section>
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          {loading ? (
            <div className="glass-surface shimmer rounded-2xl border border-border p-5 text-sm text-muted-foreground lg:col-span-2 dark:border-white/10 dark:text-slate-300">
              Loading calendar ideas...
            </div>
          ) : null}
          {error ? (
            <div className="rounded-xl border border-red-300/60 bg-red-50 p-4 text-sm text-red-700 lg:col-span-2 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </div>
          ) : null}
          <aside className="glass-surface rounded-2xl border border-border bg-card p-3.5">
            <p className="mb-2 text-sm font-medium">Unscheduled ideas</p>
            <div className="space-y-2">
              {unscheduled.length === 0 ? (
                <div className="rounded-xl border border-border bg-muted p-3 text-xs text-muted-foreground">
                  {ideas.length === 0
                    ? "Save an idea from the dashboard and it will be ready to schedule here."
                    : "All ideas are scheduled. Drag items between dates to reschedule."}
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
                  className="fluid-transition stagger-in spring-pop cursor-grab rounded-xl border border-border bg-muted/70 p-2 text-left text-xs outline-none hover:-translate-y-0.5 hover:border-primary/25 focus-visible:ring-2 focus-visible:ring-ring/60 dark:focus-visible:ring-cyan-400/60 dark:hover:border-cyan-300/30"
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
                  <p className="font-medium">
                    {idea.idea_title || "Saved idea"}
                  </p>
                  <p className="text-muted-foreground">{idea.niche}</p>
                </div>
              ))}
            </div>
          </aside>
          <section className="glass-surface rounded-2xl border border-border bg-card p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
                className="fluid-transition rounded-lg border border-border bg-card px-2 py-1 text-xs hover:bg-muted dark:border-white/15 dark:hover:border-white/30"
              >
                Prev
              </button>
              <h2 className="text-lg font-semibold">
                {month.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <button
                onClick={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
                className="fluid-transition rounded-lg border border-border bg-card px-2 py-1 text-xs hover:bg-muted dark:border-white/15 dark:hover:border-white/30"
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
                    onDragLeave={() =>
                      setDragOverKey((prev) => (prev === key ? null : prev))
                    }
                    onDrop={() => {
                      if (dragIdeaId) assignIdea(key, dragIdeaId);
                      setDragOverKey(null);
                    }}
                    className={`fluid-transition spring-pop min-h-28 rounded-xl border p-1.5 ${
                      dragOverKey === key
                        ? "scale-[1.02] border-cyan-300/55 shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_0_20px_rgba(34,211,238,0.2)]"
                        : ""
                    } ${
                      inMonth
                        ? "border-border bg-muted/60"
                        : "border-border/70 bg-muted/40"
                    }`}
                  >
                    <p className="mb-1 text-[11px] text-muted-foreground">
                      {d.getDate()}
                    </p>
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
                              blockDetailClickUntilRef.current =
                                Date.now() + 250;
                            }}
                            onClick={() => {
                              if (Date.now() < blockDetailClickUntilRef.current)
                                return;
                              setSelectedIdeaId(id);
                            }}
                            className="fluid-transition cursor-grab rounded-lg border border-primary/20 bg-primary/10 px-1.5 py-1 text-left text-[11px] text-accent-foreground hover:border-primary/35 dark:border-cyan-300/25 dark:bg-cyan-500/10 dark:text-cyan-100 dark:hover:border-cyan-300/40"
                          >
                            {idea.thumbnail_url ? (
                              <div className="relative mb-1 aspect-video w-full overflow-hidden rounded border border-border bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={idea.thumbnail_url}
                                  alt={
                                    idea.idea_title || "Saved idea thumbnail"
                                  }
                                  className="absolute inset-0 size-full object-cover"
                                />
                              </div>
                            ) : null}
                            <div className="truncate font-medium">
                              {idea.idea_title || "Saved idea"}
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
            className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-idea-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">
                  {selectedIdea.niche} -{" "}
                  {new Date(selectedIdea.created_at).toLocaleString()}
                </p>
                <h3
                  id="calendar-idea-detail-title"
                  className="mt-0.5 text-base font-semibold leading-snug text-foreground"
                >
                  {selectedIdea.idea_title || "Saved idea"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => closeDetail()}
                className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs text-foreground hover:bg-muted"
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {selectedIdea.thumbnail_url ? (
                <div className="relative mb-3 aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedIdea.thumbnail_url}
                    alt={selectedIdea.idea_title || "Saved idea thumbnail"}
                    className="absolute inset-0 size-full object-cover"
                  />
                </div>
              ) : null}
              <SavedIdeaContent
                content={
                  selectedIdea.idea_content ||
                  "No script/content available for this idea."
                }
                className="rounded-lg border border-border bg-muted/40 p-3 text-sm leading-relaxed text-foreground"
              />
            </div>
            <div className="flex shrink-0 flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:justify-end">
              {selectedIdeaIsScheduled ? (
                <button
                  type="button"
                  onClick={() => {
                    removeFromCalendar(selectedIdea.id);
                    closeDetail();
                  }}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Remove from calendar
                </button>
              ) : null}
              <button
                type="button"
                disabled={deletingIdeaId === selectedIdea.id}
                onClick={() => void deleteIdea(selectedIdea.id)}
                className="rounded-lg border border-red-300/50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-300/40 dark:text-red-100 dark:hover:bg-red-500/20"
              >
                {deletingIdeaId === selectedIdea.id
                  ? "Deleting..."
                  : "Delete idea"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
