import "server-only";

import { NextResponse } from "next/server";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

type LimitedJsonBodyResult<T> =
  | { ok: true; body: T }
  | { ok: false; response: NextResponse };

export function hasTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const requestOrigin = new URL(request.url).origin;
    const originHost = new URL(origin).hostname;
    const requestHost = new URL(requestOrigin).hostname;
    const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

    if (localHosts.has(originHost) && localHosts.has(requestHost)) {
      return true;
    }

    return (
      origin === requestOrigin ||
      (configuredSiteUrl ? origin === configuredSiteUrl : false)
    );
  } catch {
    return false;
  }
}

export function invalidOriginResponse() {
  return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
}

export async function parseLimitedJsonBody<T>(
  request: Request,
  {
    maxBytes,
    invalidMessage = "Invalid request body.",
    tooLargeMessage = "Request body is too large.",
  }: {
    maxBytes: number;
    invalidMessage?: string;
    tooLargeMessage?: string;
  },
): Promise<LimitedJsonBodyResult<T>> {
  const declaredLength = request.headers.get("content-length");
  const declaredBytes = declaredLength
    ? Number.parseInt(declaredLength, 10)
    : 0;

  if (Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json({ error: tooLargeMessage }, { status: 413 }),
    };
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: invalidMessage }, { status: 400 }),
    };
  }

  if (new TextEncoder().encode(raw).length > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json({ error: tooLargeMessage }, { status: 413 }),
    };
  }

  try {
    return { ok: true, body: JSON.parse(raw) as T };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: invalidMessage }, { status: 400 }),
    };
  }
}
