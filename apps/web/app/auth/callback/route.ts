import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function safeNext(value: string | null) {
  if (value?.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = safeNext(requestUrl.searchParams.get("next"));
  const response = NextResponse.redirect(new URL(next, requestUrl.origin));

  if ((!code && !tokenHash) || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/login?auth=callback-error", requestUrl.origin));
  }

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

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      return response;
    }

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash ?? "",
      type: type === "recovery" ? "recovery" : "email",
    });
    if (error) throw error;
    return response;
  } catch (error) {
    console.error("Supabase auth callback failed:", error);
    const fallback = type === "recovery" ? "/forgot-password?reset=error" : "/login?auth=callback-error";
    return NextResponse.redirect(new URL(fallback, requestUrl.origin));
  }
}
