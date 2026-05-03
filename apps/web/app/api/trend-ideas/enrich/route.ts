import { NextResponse } from "next/server";

import { CREDIT_COSTS } from "@/lib/credits";
import { getBackendHeaders, getBackendUrl } from "@/lib/server-api";
import { recordOperationalEvent } from "@/lib/server-events";
import { checkRateLimits, rateLimitResponse } from "@/lib/server-rate-limit";

import {
  isInsufficientCreditsError,
  loadUsage,
  refundCredits,
  spendCredits,
} from "../usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type EnrichmentPath =
  | "generate-hooks"
  | "generate-hashtags"
  | "generate-full-script";

const COST_BY_PATH: Record<EnrichmentPath, number> = {
  "generate-hooks": CREDIT_COSTS.hooks,
  "generate-hashtags": CREDIT_COSTS.hashtags,
  "generate-full-script": CREDIT_COSTS.fullScript,
};

function isEnrichmentPath(value: unknown): value is EnrichmentPath {
  return (
    value === "generate-hooks" ||
    value === "generate-hashtags" ||
    value === "generate-full-script"
  );
}

export async function POST(request: Request) {
  const usage = await loadUsage();
  if (!usage.ok) {
    return NextResponse.json({ error: usage.error }, { status: usage.status });
  }

  let body: { path?: unknown; payload?: unknown };
  try {
    body = (await request.json()) as { path?: unknown; payload?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  if (!isEnrichmentPath(body.path)) {
    return NextResponse.json(
      { error: "Unsupported idea tool." },
      { status: 400 },
    );
  }

  const payload =
    body.payload &&
    typeof body.payload === "object" &&
    !Array.isArray(body.payload)
      ? (body.payload as Record<string, string>)
      : null;
  if (!payload) {
    return NextResponse.json(
      { error: "Missing idea tool payload." },
      { status: 400 },
    );
  }

  const cost = COST_BY_PATH[body.path];
  if (!usage.isAdmin && usage.snapshot.creditsRemaining < cost) {
    return NextResponse.json(
      {
        error: `You need ${cost} credits to run this AI tool.`,
        credits: usage.snapshot,
        requiredCredits: cost,
      },
      { status: 402 },
    );
  }

  if (!usage.isAdmin) {
    const rateLimit = await checkRateLimits(usage.admin, [
      {
        key: `user:${usage.user.id}`,
        action: "idea_enrichment",
        limit: 40,
        windowSeconds: 10 * 60,
      },
      {
        key: `user:${usage.user.id}`,
        action: `idea_enrichment:${body.path}`,
        limit: 200,
        windowSeconds: 24 * 60 * 60,
      },
    ]);
    if (!rateLimit.ok) return rateLimitResponse(rateLimit);
  }

  let charged = false;
  try {
    const reservedCredits = usage.isAdmin
      ? usage.snapshot
      : await spendCredits(usage.admin, usage.user.id, cost);
    charged = !usage.isAdmin;

    const backend = await fetch(getBackendUrl(`/trend-ideas/${body.path}`), {
      method: "POST",
      headers: getBackendHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });

    const data = (await backend.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!backend.ok) {
      const detail = data?.detail ?? data?.error ?? backend.statusText;
      await recordOperationalEvent(usage.admin, {
        level: "error",
        source: "idea_enrichment",
        message: "Backend idea enrichment failed",
        userId: usage.user.id,
        metadata: { path: body.path, status: backend.status, detail },
      });
      await refundCredits(usage.admin, usage.user.id, cost).catch(
        (refundError) =>
          console.error("Failed to refund idea tool credits:", refundError),
      );
      charged = false;
      return NextResponse.json(
        { error: typeof detail === "string" ? detail : JSON.stringify(detail) },
        { status: backend.status },
      );
    }

    return NextResponse.json({ data, credits: reservedCredits });
  } catch (error) {
    if (charged) {
      await refundCredits(usage.admin, usage.user.id, cost).catch(
        (refundError) =>
          console.error("Failed to refund idea tool credits:", refundError),
      );
    }
    if (isInsufficientCreditsError(error)) {
      return NextResponse.json(
        {
          error: `You need ${cost} credits to run this AI tool.`,
          credits: usage.snapshot,
          requiredCredits: cost,
        },
        { status: 402 },
      );
    }
    console.error("Trend idea enrichment route failed:", error);
    await recordOperationalEvent(usage.admin, {
      level: "error",
      source: "idea_enrichment",
      message: error instanceof Error ? error.message : "Idea tool failed",
      userId: usage.user.id,
      metadata: { path: body.path },
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Idea tool failed." },
      { status: 500 },
    );
  }
}
