import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api";
import { CREDIT_COSTS } from "@/lib/credits";

import { loadUsage, spendCredits } from "../usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const usage = await loadUsage();
  if (!usage.ok) {
    return NextResponse.json({ error: usage.error }, { status: usage.status });
  }

  const cost = CREDIT_COSTS.analysisWithImages;
  if (usage.snapshot.creditsRemaining < cost) {
    return NextResponse.json(
      {
        error: `You need ${cost} credits to run a full analysis with images.`,
        credits: usage.snapshot,
        requiredCredits: cost,
      },
      { status: 402 },
    );
  }

  let body: { niche?: unknown };
  try {
    body = (await request.json()) as { niche?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const niche = typeof body.niche === "string" ? body.niche.trim() : "";
  if (!niche) {
    return NextResponse.json({ error: "Choose a niche to analyze." }, { status: 400 });
  }

  try {
    const backend = await fetch(`${getApiBaseUrl()}/trend-ideas/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ niche }),
    });

    const payload = (await backend.json().catch(() => null)) as Record<string, unknown> | null;
    if (!backend.ok) {
      const detail = payload?.detail ?? payload?.error ?? backend.statusText;
      return NextResponse.json(
        { error: typeof detail === "string" ? detail : JSON.stringify(detail) },
        { status: backend.status },
      );
    }

    const credits = await spendCredits(usage.admin, usage.user.id, usage.snapshot, cost, {
      countAnalysis: true,
    });

    return NextResponse.json({ ...(payload ?? {}), credits });
  } catch (error) {
    console.error("Trend analysis route failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Trend analysis failed." },
      { status: 500 },
    );
  }
}
