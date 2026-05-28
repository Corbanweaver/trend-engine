import "server-only";

import { NextResponse } from "next/server";

import { getServerSupabaseAdmin } from "@/lib/server-supabase-admin";
import {
  checkRateLimits,
  getClientIp,
  type RateLimitRule,
} from "@/lib/server-rate-limit";

type StripeRateLimitTarget = "checkout" | "billing_portal";

export async function enforceStripeRateLimit({
  request,
  target,
  userId,
  includeIp = true,
  redirect,
}: {
  request: Request;
  target: StripeRateLimitTarget;
  userId?: string | null;
  includeIp?: boolean;
  redirect: () => NextResponse;
}) {
  const admin = getServerSupabaseAdmin();
  if (!admin) return null;

  const clientIp = getClientIp(request);
  const rules: RateLimitRule[] = [];

  if (includeIp) {
    rules.push({
      key: `ip:${clientIp}`,
      action: `stripe_${target}_ip`,
      limit: target === "checkout" ? 30 : 45,
      windowSeconds: 15 * 60,
    });
  }

  if (userId) {
    rules.push(
      {
        key: `user:${userId}`,
        action: `stripe_${target}`,
        limit: target === "checkout" ? 8 : 12,
        windowSeconds: 15 * 60,
      },
      {
        key: `user:${userId}`,
        action: `stripe_${target}`,
        limit: target === "checkout" ? 40 : 60,
        windowSeconds: 24 * 60 * 60,
      },
    );
  }

  if (!rules.length) return null;

  try {
    const result = await checkRateLimits(admin, rules);
    return result.ok ? null : redirect();
  } catch (error) {
    console.error(`Stripe ${target} rate limit failed:`, error);
    return null;
  }
}
