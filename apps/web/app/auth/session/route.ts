import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeNext(value: unknown) {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Missing Supabase configuration." }, { status: 500 });
  }

  let body: { access_token?: unknown; refresh_token?: unknown; next?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const access_token = typeof body.access_token === "string" ? body.access_token : "";
  const refresh_token = typeof body.refresh_token === "string" ? body.refresh_token : "";
  const next = safeNext(body.next);

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
