import "server-only";

import { NextResponse } from "next/server";

type LimitedJsonBodyResult<T> =
  | { ok: true; body: T }
  | { ok: false; response: NextResponse };

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
