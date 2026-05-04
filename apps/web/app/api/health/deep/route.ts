import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getBackendHeaders, getBackendUrl } from "@/lib/server-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckResult = {
  ok: boolean;
  message?: string;
  latencyMs?: number;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getHealthSecret() {
  return (
    process.env.HEALTHCHECK_SECRET?.trim() ||
    process.env.OPERATIONAL_API_KEY?.trim() ||
    ""
  );
}

function getPresentedSecret(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice("bearer ".length).trim();
  }
  return request.headers.get("x-healthcheck-secret")?.trim() ?? "";
}

function envCheck(): CheckResult {
  const missing = [
    ["NEXT_PUBLIC_SUPABASE_URL", supabaseUrl],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
    ["SUPABASE_SERVICE_ROLE_KEY", supabaseServiceRoleKey],
    ["NEXT_PUBLIC_API_URL or API_URL", process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL],
    ["OPENAI_API_KEY", process.env.OPENAI_API_KEY],
    ["STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY],
    ["STRIPE_CREATOR_PRICE_ID", process.env.STRIPE_CREATOR_PRICE_ID],
    ["STRIPE_PRO_PRICE_ID", process.env.STRIPE_PRO_PRICE_ID],
    ["STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    return {
      ok: false,
      message: `Missing required environment variables: ${missing.join(", ")}`,
    };
  }

  return { ok: true };
}

async function timeCheck(task: () => Promise<CheckResult>): Promise<CheckResult> {
  const started = Date.now();
  try {
    const result = await task();
    return { ...result, latencyMs: Date.now() - started };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      message: error instanceof Error ? error.message : "Unknown check failure",
    };
  }
}

async function supabaseCheck(): Promise<CheckResult> {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { ok: false, message: "Supabase service configuration is missing." };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error } = await supabase
    .from("user_subscriptions")
    .select("user_id", { count: "exact", head: true });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

async function backendCheck(): Promise<CheckResult> {
  const response = await fetch(getBackendUrl("/health"), {
    headers: getBackendHeaders(),
    signal: AbortSignal.timeout(6000),
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      ok: false,
      message: `Backend returned HTTP ${response.status}`,
    };
  }

  return { ok: true };
}

export async function GET(request: Request) {
  const expectedSecret = getHealthSecret();
  if (!expectedSecret) {
    return NextResponse.json(
      {
        status: "unconfigured",
        message: "Set HEALTHCHECK_SECRET or OPERATIONAL_API_KEY to enable deep health checks.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (getPresentedSecret(request) !== expectedSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const checks = {
    env: envCheck(),
    supabase: await timeCheck(supabaseCheck),
    backend: await timeCheck(backendCheck),
  };
  const ok = Object.values(checks).every((check) => check.ok);

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      service: "content-idea-maker-web",
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
