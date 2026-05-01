import { NICHE_OPTIONS } from "@/lib/niches";

export const TOTAL_ANALYSES_KEY = "trend_dashboard:total_analyses";
export const TREND_HISTORY_LOG_KEY = "trend_dashboard:trend_history_log";

const MAX_HISTORY_ENTRIES = 200;

export type TrendHistoryEntry = {
  at: string;
  niche: string;
};

export type BadgeId = "first_analysis" | "power_user" | "idea_collector";

export type BadgeDefinition = {
  id: BadgeId;
  title: string;
  description: string;
  emoji: string;
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first_analysis",
    title: "First Analysis",
    description: "Run your first trend analysis",
    emoji: "🎯",
  },
  {
    id: "power_user",
    title: "Power User",
    description: "Complete 50 trend analyses",
    emoji: "⚡",
  },
  {
    id: "idea_collector",
    title: "Idea Collector",
    description: "Save 25 ideas to your library",
    emoji: "📚",
  },
];

export function formatNicheDisplay(niche: string): string {
  const t = niche.trim();
  const opt = NICHE_OPTIONS.find(
    (o) => !o.value.startsWith("__") && o.value.toLowerCase() === t.toLowerCase(),
  );
  return opt?.label ?? t;
}

/** Increments lifetime analysis count and appends to the trend history log (browser only). */
export function recordTrendAnalysis(niche: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(TOTAL_ANALYSES_KEY);
    const prev = raw ? Number.parseInt(raw, 10) : 0;
    const nextTotal = Number.isFinite(prev) ? prev + 1 : 1;
    window.localStorage.setItem(TOTAL_ANALYSES_KEY, String(nextTotal));

    const logRaw = window.localStorage.getItem(TREND_HISTORY_LOG_KEY);
    let log: TrendHistoryEntry[] = [];
    if (logRaw) {
      const parsed = JSON.parse(logRaw) as unknown;
      if (Array.isArray(parsed)) log = parsed as TrendHistoryEntry[];
    }
    const entry: TrendHistoryEntry = {
      at: new Date().toISOString(),
      niche: niche.trim(),
    };
    const nextLog = [entry, ...log].slice(0, MAX_HISTORY_ENTRIES);
    window.localStorage.setItem(TREND_HISTORY_LOG_KEY, JSON.stringify(nextLog));
  } catch {
    /* ignore storage errors */
  }
}

export function readTotalAnalyses(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(TOTAL_ANALYSES_KEY);
    if (!raw) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function readTrendHistory(): TrendHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const logRaw = window.localStorage.getItem(TREND_HISTORY_LOG_KEY);
    if (!logRaw) return [];
    const parsed = JSON.parse(logRaw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as TrendHistoryEntry[];
  } catch {
    return [];
  }
}

export function getNicheCounts(history: TrendHistoryEntry[]): { niche: string; count: number }[] {
  const map = new Map<string, { label: string; count: number }>();
  for (const e of history) {
    const key = e.niche.trim().toLowerCase();
    if (!key) continue;
    const prev = map.get(key);
    if (prev) prev.count += 1;
    else map.set(key, { label: e.niche.trim(), count: 1 });
  }
  return [...map.values()]
    .sort((a, b) => b.count - a.count)
    .map(({ label, count }) => ({ niche: label, count }));
}

export function computeEarnedBadgeIds(
  totalAnalyses: number,
  savedIdeasCount: number,
): Set<BadgeId> {
  const earned = new Set<BadgeId>();
  if (totalAnalyses >= 1) earned.add("first_analysis");
  if (totalAnalyses >= 50) earned.add("power_user");
  if (savedIdeasCount >= 25) earned.add("idea_collector");
  return earned;
}
