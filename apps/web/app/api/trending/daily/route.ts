import { NextResponse } from "next/server";

import { getBackendHeaders, getBackendUrl } from "@/lib/server-api";
import type { DailyTrendingResponse } from "@/lib/daily-trending-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const response = await fetch(getBackendUrl("/trending/daily"), {
    method: "GET",
    headers: getBackendHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Unable to load live trends." },
      {
        status:
          response.status >= 400 && response.status < 600
            ? response.status
            : 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  try {
    const data = (await response.json()) as DailyTrendingResponse;
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Trend source returned invalid JSON." },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
