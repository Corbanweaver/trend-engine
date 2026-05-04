import { NextResponse } from "next/server";

import { CREDIT_COSTS } from "@/lib/credits";
import { getBackendHeaders, getBackendUrl } from "@/lib/server-api";
import { recordOperationalEvent } from "@/lib/server-events";
import {
  checkRateLimits,
  rateLimitResponse,
  type RateLimitRule,
} from "@/lib/server-rate-limit";
import { getOpenAICreditBudget } from "@/lib/credits";

import {
  isInsufficientCreditsError,
  loadUsage,
  refundCredits,
  spendCredits,
} from "../usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const usage = await loadUsage();
  if (!usage.ok) {
    return NextResponse.json({ error: usage.error }, { status: usage.status });
  }

  const cost = CREDIT_COSTS.analysisWithImages;
  if (!usage.isAdmin && usage.snapshot.creditsRemaining < cost) {
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
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const niche = typeof body.niche === "string" ? body.niche.trim() : "";
  if (!niche) {
    return NextResponse.json(
      { error: "Choose a niche to analyze." },
      { status: 400 },
    );
  }

  if (!usage.isAdmin) {
    const globalCostGuard = getOpenAICreditBudget();
    const rules: RateLimitRule[] = [
      {
        key: `user:${usage.user.id}`,
        action: "trend_analysis",
        limit: 8,
        windowSeconds: 15 * 60,
      },
      {
        key: `user:${usage.user.id}`,
        action: "trend_analysis",
        limit: 80,
        windowSeconds: 24 * 60 * 60,
      },
    ];

    if (globalCostGuard.limit > 0) {
      rules.push({
        key: "global:trend-ai-cost",
        action: "trend_ai_cost",
        cost,
        limit: globalCostGuard.limit,
        windowSeconds: globalCostGuard.windowSeconds,
      });
    }

    const rateLimit = await checkRateLimits(usage.admin, rules);
    if (!rateLimit.ok) return rateLimitResponse(rateLimit);
  }

  let charged = false;
  try {
    const reservedCredits = usage.isAdmin
      ? usage.snapshot
      : await spendCredits(usage.admin, usage.user.id, cost, {
          countAnalysis: true,
        });
    charged = !usage.isAdmin;

    const backend = await fetch(getBackendUrl("/trend-ideas/"), {
      method: "POST",
      headers: getBackendHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ niche }),
    });

    const payload = (await backend.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!backend.ok) {
      const detail = payload?.detail ?? payload?.error ?? backend.statusText;
      await recordOperationalEvent(usage.admin, {
        level: "error",
        source: "trend_analysis",
        message: "Backend trend analysis failed",
        userId: usage.user.id,
        metadata: { status: backend.status, detail, niche },
      });
      await refundCredits(usage.admin, usage.user.id, cost, {
        countAnalysis: true,
      }).catch((refundError) =>
        console.error("Failed to refund analysis credits:", refundError),
      );
      charged = false;
      return NextResponse.json(
        { error: typeof detail === "string" ? detail : JSON.stringify(detail) },
        { status: backend.status },
      );
    }

    return NextResponse.json({ ...(payload ?? {}), credits: reservedCredits });
  } catch (error) {
    if (charged) {
      await refundCredits(usage.admin, usage.user.id, cost, {
        countAnalysis: true,
      }).catch((refundError) =>
        console.error("Failed to refund analysis credits:", refundError),
      );
    }
    if (isInsufficientCreditsError(error)) {
      return NextResponse.json(
        {
          error: `You need ${cost} credits to run a full analysis with images.`,
          credits: usage.snapshot,
          requiredCredits: cost,
        },
        { status: 402 },
      );
    }
    console.error("Trend analysis route failed:", error);
    await recordOperationalEvent(usage.admin, {
      level: "error",
      source: "trend_analysis",
      message: error instanceof Error ? error.message : "Trend analysis failed",
      userId: usage.user.id,
      metadata: { niche },
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Trend analysis failed.",
      },
      { status: 500 },
    );
  }
}
