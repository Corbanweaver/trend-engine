import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  checkRateLimits,
  getClientIp,
  rateLimitResponse,
} from "@/lib/server-rate-limit";
import { recordOperationalEvent } from "@/lib/server-events";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase service role configuration" },
      { status: 500 },
    );
  }

  let email = "";
  try {
    const body = (await request.json()) as { email?: string };
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email address" },
      { status: 400 },
    );
  }

  const ip = getClientIp(request);
  const rateLimit = await checkRateLimits(supabase, [
    {
      key: `ip:${ip}`,
      action: "email_waitlist",
      limit: 8,
      windowSeconds: 60 * 60,
    },
    {
      key: `ip:${ip}`,
      action: "email_waitlist",
      limit: 30,
      windowSeconds: 24 * 60 * 60,
    },
  ]);
  if (!rateLimit.ok) return rateLimitResponse(rateLimit);

  const { error } = await supabase.from("email_waitlist").insert({ email });
  if (error) {
    const duplicateKeyViolationCode = "23505";
    if (error.code === duplicateKeyViolationCode) {
      return NextResponse.json({ ok: true });
    }
    console.error("Failed to insert waitlist email:", error);
    await recordOperationalEvent(supabase, {
      level: "error",
      source: "email_waitlist",
      message: error.message,
      metadata: { code: error.code, ip },
    });
    return NextResponse.json(
      { error: "Unable to save waitlist email" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
