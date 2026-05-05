import { NextResponse } from "next/server";

import { getBackendHeaders, getBackendUrl } from "@/lib/server-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DEFAULT_NICHES = [
  "fitness",
  "beauty",
  "food",
  "fashion",
  "business",
  "relationships",
  "travel",
];
const DEFAULT_PLATFORMS = ["youtube", "tiktok", "instagram", "pinterest", "x", "reddit"];

function csvEnv(name: string, fallback: string[]): string[] {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headers = getBackendHeaders({ "Content-Type": "application/json" });
  const response = await fetch(getBackendUrl("/trending/refresh-cache"), {
    method: "POST",
    headers,
    body: JSON.stringify({
      niches: csvEnv("TREND_CACHE_NICHES", DEFAULT_NICHES),
      platforms: csvEnv("TREND_CACHE_PLATFORMS", DEFAULT_PLATFORMS),
      max_results: Math.min(Math.max(intEnv("TREND_CACHE_MAX_RESULTS", 8), 1), 25),
    }),
  });

  const text = await response.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text.slice(0, 500) };
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: "Trend cache refresh failed", status: response.status, body },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, body });
}
