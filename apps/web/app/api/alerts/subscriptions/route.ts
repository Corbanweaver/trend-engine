import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { parseLimitedJsonBody } from "@/lib/api-request-guards";
import { checkRateLimits, rateLimitResponse } from "@/lib/server-rate-limit";
import { getServerSupabaseAdmin } from "@/lib/server-supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriptionRow = {
  id: string;
  niche: string;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ALERT_BODY_LIMIT_BYTES = 512;
const MAX_NICHE_LENGTH = 80;
const MAX_ALERT_SUBSCRIPTIONS = 20;

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function normalizeNiche(value: unknown): string {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").toLowerCase()
    : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function createUserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Route handlers can set cookies; ignore if Next.js calls this in a read-only context.
        }
      },
    },
  });
}

async function getAuthorizedClients() {
  const userClient = await createUserClient();
  if (!userClient) {
    return {
      error: jsonError(
        "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
        500,
      ),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return { error: jsonError("Please log in to manage trend alerts.", 401) };
  }

  const admin = getServerSupabaseAdmin();
  return {
    user,
    db: admin ?? userClient,
    admin,
  };
}

export async function GET() {
  const auth = await getAuthorizedClients();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.db
    .from("trend_alert_subscriptions")
    .select("id, niche, created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load trend alert subscriptions:", error);
    return jsonError("Unable to load trend alert subscriptions.", 500);
  }

  return NextResponse.json({ subscriptions: (data as SubscriptionRow[]) ?? [] });
}

export async function POST(request: Request) {
  const auth = await getAuthorizedClients();
  if ("error" in auth) return auth.error;

  const parsedBody = await parseLimitedJsonBody<{ niche?: unknown }>(request, {
    maxBytes: ALERT_BODY_LIMIT_BYTES,
    invalidMessage: "Invalid JSON payload.",
    tooLargeMessage: "Alert subscription payload is too large.",
  });
  if (!parsedBody.ok) return parsedBody.response;

  const payload =
    parsedBody.body &&
    typeof parsedBody.body === "object" &&
    !Array.isArray(parsedBody.body)
      ? parsedBody.body
      : null;
  const niche = normalizeNiche(payload?.niche);

  if (auth.admin) {
    const rateLimit = await checkRateLimits(auth.admin, [
      {
        key: `user:${auth.user.id}`,
        action: "trend_alert_subscription",
        limit: 10,
        windowSeconds: 60 * 60,
      },
      {
        key: `user:${auth.user.id}`,
        action: "trend_alert_subscription",
        limit: 30,
        windowSeconds: 24 * 60 * 60,
      },
    ]);
    if (!rateLimit.ok) return rateLimitResponse(rateLimit);
  }

  if (!niche) {
    return jsonError("Choose a niche or enter a custom one.", 400);
  }
  if (niche.length > MAX_NICHE_LENGTH) {
    return jsonError(
      `Keep alert niches under ${MAX_NICHE_LENGTH} characters.`,
      400,
    );
  }

  const { data: existing, error: existingLookupError } = await auth.db
    .from("trend_alert_subscriptions")
    .select("id, niche, created_at")
    .eq("user_id", auth.user.id)
    .eq("niche", niche)
    .maybeSingle<SubscriptionRow>();

  if (existingLookupError) {
    console.error(
      "Failed to check existing trend alert subscription:",
      existingLookupError,
    );
    return jsonError("Unable to save trend alert subscription.", 500);
  }

  if (existing) {
    return NextResponse.json({
      subscription: existing,
      duplicate: true,
    });
  }

  const { count, error: countError } = await auth.db
    .from("trend_alert_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", auth.user.id);

  if (countError) {
    console.error("Failed to count trend alert subscriptions:", countError);
    return jsonError("Unable to save trend alert subscription.", 500);
  }

  if ((count ?? 0) >= MAX_ALERT_SUBSCRIPTIONS) {
    return jsonError(
      `You can track up to ${MAX_ALERT_SUBSCRIPTIONS} alert niches at a time.`,
      400,
    );
  }

  const { data: inserted, error } = await auth.db
    .from("trend_alert_subscriptions")
    .insert({ user_id: auth.user.id, niche })
    .select("id, niche, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: existing, error: existingError } = await auth.db
        .from("trend_alert_subscriptions")
        .select("id, niche, created_at")
        .eq("user_id", auth.user.id)
        .eq("niche", niche)
        .single();

      if (!existingError && existing) {
        return NextResponse.json({
          subscription: existing as SubscriptionRow,
          duplicate: true,
        });
      }

      return jsonError("Already subscribed to this niche.", 409);
    }

    console.error("Failed to save trend alert subscription:", error);
    return jsonError("Unable to save trend alert subscription.", 500);
  }

  return NextResponse.json({ subscription: inserted as SubscriptionRow });
}

export async function DELETE(request: Request) {
  const auth = await getAuthorizedClients();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim();
  if (!id) {
    return jsonError("Missing subscription id.", 400);
  }
  if (!isUuid(id)) {
    return jsonError("Invalid subscription id.", 400);
  }

  const { error } = await auth.db
    .from("trend_alert_subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) {
    console.error("Failed to delete trend alert subscription:", error);
    return jsonError("Unable to remove trend alert subscription.", 500);
  }

  return NextResponse.json({ ok: true });
}
