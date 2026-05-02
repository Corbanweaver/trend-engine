import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriptionRow = {
  id: string;
  niche: string;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function normalizeNiche(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function createAdminClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
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

  return {
    user,
    db: createAdminClient() ?? userClient,
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

  let niche = "";
  try {
    const body = (await request.json()) as { niche?: unknown };
    niche = normalizeNiche(body.niche);
  } catch {
    return jsonError("Invalid JSON payload.", 400);
  }

  if (!niche) {
    return jsonError("Choose a niche or enter a custom one.", 400);
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
