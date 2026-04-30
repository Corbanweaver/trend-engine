"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getSupabaseClient } from "@/lib/supabase";
import { trackUiEvent } from "@/lib/telemetry";

type SavedIdea = {
  id: string;
  idea_title: string;
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

  useEffect(() => {
    document.title = "Content Calendar — Trend Engine";
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
          .select("id, idea_title, niche")
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
          <aside className="glass-surface rounded-2xl border border-white/10 p-3.5">
            <p className="mb-2 text-sm font-medium">Unscheduled ideas</p>
            <div className="space-y-2">
              {unscheduled.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-slate-800/40 p-3 text-xs text-slate-400">
                  All ideas are scheduled. Drag items between dates to reschedule.
                </div>
              ) : null}
              {unscheduled.map((idea, idx) => (
                <div
                  key={idea.id}
                  draggable
                  onDragStart={() => setDragIdeaId(idea.id)}
                  className="fluid-transition stagger-in spring-pop cursor-grab rounded-xl border border-white/10 bg-slate-800/75 p-2 text-xs hover:-translate-y-0.5 hover:border-cyan-300/30"
                  style={{ ["--stagger" as string]: `${Math.min(idx, 10)}` }}
                >
                  <p className="font-medium">{idea.idea_title || "Saved idea"}</p>
                  <p className="text-slate-400">{idea.niche}</p>
                </div>
              ))}
            </div>
          </aside>
          <section className="glass-surface rounded-2xl border border-white/10 p-3.5">
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
                <div key={d} className="px-1 text-xs text-slate-400">
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
                      inMonth ? "border-white/10 bg-slate-800/60" : "border-white/5 bg-slate-900/50"
                    }`}
                  >
                    <p className="mb-1 text-[11px] text-slate-400">{d.getDate()}</p>
                    <div className="space-y-1">
                      {ids.map((id) => {
                        const idea = ideaById.get(id);
                        if (!idea) return null;
                        return (
                          <div
                            key={id}
                            draggable
                            onDragStart={() => setDragIdeaId(id)}
                            className="fluid-transition cursor-grab rounded-lg border border-cyan-300/25 bg-cyan-500/10 px-1.5 py-1 text-[11px] hover:border-cyan-300/40"
                          >
                            {idea.idea_title || "Saved idea"}
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
    </main>
  );
}
