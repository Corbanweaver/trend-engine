import { NextResponse } from "next/server";

import {
  hasTrustedOrigin,
  invalidOriginResponse,
  parseLimitedJsonBody,
} from "@/lib/api-request-guards";
import {
  isAllowedConversionEvent,
  recordConversionEvent,
  sanitizeMetadata,
} from "@/lib/conversion-events";
import { checkRateLimits, getClientIp } from "@/lib/server-rate-limit";
import { getServerSupabaseAdmin } from "@/lib/server-supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONVERSION_EVENT_BODY_LIMIT_BYTES = 4 * 1024;

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return invalidOriginResponse();
  }

  const parsedBody = await parseLimitedJsonBody<unknown>(request, {
    maxBytes: CONVERSION_EVENT_BODY_LIMIT_BYTES,
    invalidMessage: "Invalid JSON",
    tooLargeMessage: "Conversion event payload is too large.",
  });
  if (!parsedBody.ok) return parsedBody.response;

  if (!parsedBody.body || typeof parsedBody.body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const payload = parsedBody.body as {
    event?: unknown;
    path?: unknown;
    context?: unknown;
    ts?: unknown;
  };

  if (!isAllowedConversionEvent(payload.event)) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const admin = getServerSupabaseAdmin();
  if (admin) {
    try {
      const ip = getClientIp(request);
      const rateLimit = await checkRateLimits(admin, [
        {
          key: `ip:${ip}`,
          action: "conversion_event",
          limit: 120,
          windowSeconds: 10 * 60,
        },
        {
          key: `ip:${ip}`,
          action: "conversion_event",
          limit: 800,
          windowSeconds: 24 * 60 * 60,
        },
      ]);
      if (!rateLimit.ok) {
        return NextResponse.json(
          {
            error: "Too many conversion events.",
            resetAt: rateLimit.resetAt,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(rateLimit.retryAfterSeconds),
            },
          },
        );
      }
    } catch (error) {
      console.error("Conversion event rate limit failed:", error);
      return NextResponse.json({
        ok: true,
        recorded: false,
        storage: "rate_limit_unavailable",
      });
    }
  }

  const result = await recordConversionEvent({
    event: payload.event,
    metadata: sanitizeMetadata({
      path: typeof payload.path === "string" ? payload.path : undefined,
      clientTs: typeof payload.ts === "string" ? payload.ts : undefined,
      userAgent: request.headers.get("user-agent")?.slice(0, 160),
      ...(payload.context && typeof payload.context === "object"
        ? (payload.context as Record<string, unknown>)
        : {}),
    }),
  });

  return NextResponse.json({ ok: true, ...result });
}
