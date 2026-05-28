import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  hasTrustedOrigin,
  invalidOriginResponse,
  parseLimitedJsonBody,
} from "@/lib/api-request-guards";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SESSION_BODY_LIMIT_BYTES = 8 * 1024;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeNext(value: unknown) {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return invalidOriginResponse();
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Missing Supabase configuration." }, { status: 500 });
  }

  const parsedBody = await parseLimitedJsonBody<{
    access_token?: unknown;
    refresh_token?: unknown;
    next?: unknown;
  }>(request, {
    maxBytes: SESSION_BODY_LIMIT_BYTES,
    invalidMessage: "Invalid JSON.",
    tooLargeMessage: "Session payload is too large.",
  });
  if (!parsedBody.ok) return parsedBody.response;

  const access_token =
    typeof parsedBody.body.access_token === "string"
      ? parsedBody.body.access_token
      : "";
  const refresh_token =
    typeof parsedBody.body.refresh_token === "string"
      ? parsedBody.body.refresh_token
      : "";
  const next = safeNext(parsedBody.body.next);

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "Missing auth tokens." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, next });
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return response;
}
