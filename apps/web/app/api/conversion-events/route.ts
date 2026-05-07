import { NextResponse } from "next/server";

import {
  isAllowedConversionEvent,
  recordConversionEvent,
  sanitizeMetadata,
} from "@/lib/conversion-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

function hasTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const requestOrigin = new URL(request.url).origin;
  const originHost = new URL(origin).hostname;
  const requestHost = new URL(requestOrigin).hostname;
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (localHosts.has(originHost) && localHosts.has(requestHost)) {
    return true;
  }

  return origin === requestOrigin || (siteUrl ? origin === siteUrl : false);
}

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const payload = body as {
    event?: unknown;
    path?: unknown;
    context?: unknown;
    ts?: unknown;
  };

  if (!isAllowedConversionEvent(payload.event)) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  await recordConversionEvent({
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

  return NextResponse.json({ ok: true });
}
