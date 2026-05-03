import "server-only";

import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type RateLimitRule = {
  key: string;
  action: string;
  limit: number;
  windowSeconds: number;
};

type RateLimitRpcRow = {
  allowed: boolean;
  remaining: number;
  reset_at: string;
  used: number;
};

type RateLimitAllowed = {
  ok: true;
};

type RateLimitBlocked = {
  ok: false;
  action: string;
  limit: number;
  resetAt: string;
  retryAfterSeconds: number;
};

export type RateLimitResult = RateLimitAllowed | RateLimitBlocked;

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();
  return (
    forwardedIp ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

export async function checkRateLimits(
  admin: SupabaseClient,
  rules: RateLimitRule[],
): Promise<RateLimitResult> {
  for (const rule of rules) {
    const { data, error } = await admin
      .rpc("consume_api_rate_limit", {
        p_rate_key: rule.key,
        p_action: rule.action,
        p_limit: rule.limit,
        p_window_seconds: rule.windowSeconds,
      })
      .single();

    if (error) throw error;

    const result = data as RateLimitRpcRow;
    if (!result.allowed) {
      const resetAt = result.reset_at;
      const resetMs = new Date(resetAt).getTime();
      const retryAfterSeconds = Number.isFinite(resetMs)
        ? Math.max(1, Math.ceil((resetMs - Date.now()) / 1000))
        : rule.windowSeconds;

      return {
        ok: false,
        action: rule.action,
        limit: rule.limit,
        resetAt,
        retryAfterSeconds,
      };
    }
  }

  return { ok: true };
}

export function rateLimitResponse(result: RateLimitBlocked) {
  return NextResponse.json(
    {
      error: "Too many requests. Please wait a bit and try again.",
      action: result.action,
      limit: result.limit,
      resetAt: result.resetAt,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    },
  );
}
