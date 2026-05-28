import { NextResponse } from "next/server";

import { parseLimitedJsonBody } from "@/lib/api-request-guards";
import { CREDIT_COSTS } from "@/lib/credits";
import { getBackendHeaders, getBackendUrl } from "@/lib/server-api";
import { recordOperationalEvent } from "@/lib/server-events";
import {
  checkRateLimits,
  getClientIp,
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

const ENRICHMENT_BODY_LIMIT_BYTES = 12 * 1024;

type EnrichmentPayload = {
  niche: string;
  trend: string;
  hook: string;
  angle: string;
  idea: string;
  optimized_title: string;
  script: string;
};

function isEnrichmentPath(value: unknown): value is EnrichmentPath {
  return (
    value === "generate-hooks" ||
    value === "generate-hashtags" ||
    value === "generate-full-script"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readTextField(
  record: Record<string, unknown>,
  field: keyof EnrichmentPayload,
  maxLength: number,
  {
    required = false,
    fallback = "",
    label = field,
  }: {
    required?: boolean;
    fallback?: string;
    label?: string;
  } = {},
): { ok: true; value: string } | { ok: false; response: NextResponse } {
  const raw = record[field];
  if (raw == null) {
    if (required) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: `Missing ${label} context.` },
          { status: 400 },
        ),
      };
    }
    return { ok: true, value: fallback };
  }

  if (typeof raw !== "string") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `${label} must be text.` },
        { status: 400 },
      ),
    };
  }

  const value = raw.trim();
  if (required && !value) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Missing ${label} context.` },
        { status: 400 },
      ),
    };
  }

  if (value.length > maxLength) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `${label} must stay under ${maxLength} characters.` },
        { status: 400 },
      ),
    };
  }

  return { ok: true, value };
}

function validatePayload(
  value: unknown,
): { ok: true; payload: EnrichmentPayload } | { ok: false; response: NextResponse } {
  if (!isRecord(value)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing idea tool payload." },
        { status: 400 },
      ),
    };
  }

  const niche = readTextField(value, "niche", 80, { fallback: "fitness" });
  if (!niche.ok) return niche;
  const trend = readTextField(value, "trend", 160, {
    required: true,
    label: "trend",
  });
  if (!trend.ok) return trend;
  const hook = readTextField(value, "hook", 500, { label: "hook" });
  if (!hook.ok) return hook;
  const angle = readTextField(value, "angle", 1200, { label: "angle" });
  if (!angle.ok) return angle;
  const idea = readTextField(value, "idea", 2000, {
    required: true,
    label: "idea",
  });
  if (!idea.ok) return idea;
  const optimizedTitle = readTextField(value, "optimized_title", 160, {
    label: "title",
  });
  if (!optimizedTitle.ok) return optimizedTitle;
  const script = readTextField(value, "script", 6000, { label: "script" });
  if (!script.ok) return script;

  return {
    ok: true,
    payload: {
      niche: niche.value,
      trend: trend.value,
      hook: hook.value,
      angle: angle.value,
      idea: idea.value,
      optimized_title: optimizedTitle.value,
      script: script.value,
    },
  };
}

export async function POST(request: Request) {
  const usage = await loadUsage();
  if (!usage.ok) {
    return NextResponse.json({ error: usage.error }, { status: usage.status });
  }

  const parsedBody = await parseLimitedJsonBody<{
    path?: unknown;
    payload?: unknown;
  }>(request, {
    maxBytes: ENRICHMENT_BODY_LIMIT_BYTES,
    invalidMessage: "Invalid request body.",
    tooLargeMessage: "Idea tool requests must stay under 12 KB.",
  });
  if (!parsedBody.ok) return parsedBody.response;

  if (!isEnrichmentPath(parsedBody.body.path)) {
    return NextResponse.json(
      { error: "Unsupported idea tool." },
      { status: 400 },
    );
  }

  const payloadResult = validatePayload(parsedBody.body.payload);
  if (!payloadResult.ok) return payloadResult.response;

  const path = parsedBody.body.path;
  const payload = payloadResult.payload;
  const cost = COST_BY_PATH[path];
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
    const globalCostGuard = getOpenAICreditBudget();
    const clientIp = getClientIp(request);
    const rules: RateLimitRule[] = [
      {
        key: `user:${usage.user.id}`,
        action: "idea_enrichment",
        limit: 40,
        windowSeconds: 10 * 60,
      },
      {
        key: `user:${usage.user.id}`,
        action: `idea_enrichment:${path}`,
        limit: 200,
        windowSeconds: 24 * 60 * 60,
      },
      {
        key: `ip:${clientIp}`,
        action: "idea_enrichment_ip",
        limit: 160,
        windowSeconds: 10 * 60,
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
      : await spendCredits(usage.admin, usage.user.id, cost);
    charged = !usage.isAdmin;

    const backend = await fetch(getBackendUrl(`/trend-ideas/${path}`), {
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
        metadata: { path, status: backend.status, detail },
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
      metadata: { path },
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Idea tool failed." },
      { status: 500 },
    );
  }
}
