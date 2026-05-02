import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function safeNext(value: string | null) {
  if (value?.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

function getOtpType(value: string | null): EmailOtpType {
  if (
    value === "signup" ||
    value === "invite" ||
    value === "magiclink" ||
    value === "recovery" ||
    value === "email_change" ||
    value === "email"
  ) {
    return value;
  }
  return "signup";
}

function fragmentFallbackHtml(next: string) {
  const safeDestination = JSON.stringify(next);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Confirming account...</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #07111f; color: #e6f7ff; font-family: system-ui, sans-serif; }
      main { width: min(92vw, 28rem); border: 1px solid rgba(148, 163, 184, .25); border-radius: 16px; padding: 24px; background: rgba(15, 23, 42, .86); box-shadow: 0 24px 80px rgba(0,0,0,.35); }
      p { color: #9fb4c7; line-height: 1.5; }
    </style>
  </head>
  <body>
    <main>
      <h1>Confirming your account...</h1>
      <p id="message">Finishing secure sign-in. This should only take a moment.</p>
    </main>
    <script>
      (async () => {
        const destination = ${safeDestination};
        const message = document.getElementById("message");
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const type = params.get("type");
        const next = type === "recovery" ? "/reset-password" : destination;
        if (!access_token || !refresh_token) {
          window.location.replace("/login?auth=callback-error");
          return;
        }
        try {
          const response = await fetch("/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token, refresh_token, next })
          });
          if (!response.ok) throw new Error("Could not create session");
          const body = await response.json();
          window.location.replace(body.next || next);
        } catch (error) {
          if (message) message.textContent = "That link could not be confirmed. Please request a new email link.";
          window.setTimeout(() => window.location.replace("/login?auth=callback-error"), 1200);
        }
      })();
    </script>
  </body>
</html>`;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = safeNext(requestUrl.searchParams.get("next"));
  const response = NextResponse.redirect(new URL(next, requestUrl.origin));

  if (!code && !tokenHash) {
    return new NextResponse(fragmentFallbackHtml(next), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
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
      type: getOtpType(type),
    });
    if (error) throw error;
    return response;
  } catch (error) {
    console.error("Supabase auth callback failed:", error);
    const fallback = type === "recovery" ? "/forgot-password?reset=error" : "/login?auth=callback-error";
    return NextResponse.redirect(new URL(fallback, requestUrl.origin));
  }
}
