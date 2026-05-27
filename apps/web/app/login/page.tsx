"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { MarketingLogo } from "@/components/marketing/marketing-shell";
import { getSupabaseClient } from "@/lib/supabase";

const googleAuthEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const verifyPrompt = searchParams.get("verify") === "1";
  const redirectTarget =
    searchParams.get("next") ?? searchParams.get("redirect");
  const safeRedirectTarget =
    redirectTarget?.startsWith("/") && !redirectTarget.startsWith("//")
      ? redirectTarget
      : "/analyze";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        },
      );
      if (authError) {
        setError(authError.message);
        return;
      }

      if (!data.session) {
        setError("Sign in did not create a session. Please try again.");
        return;
      }

      setStatus("Login successful. Redirecting...");
      router.replace(safeRedirectTarget);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Login failed: ${err.message}`
          : "Login failed due to an unexpected error.",
      );
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            safeRedirectTarget,
          )}`,
        },
      });
      if (oauthError) setError(oauthError.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="creator-page flex min-h-svh items-center justify-center px-4 py-8 text-foreground">
      <div className="creator-studio-panel w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <MarketingLogo />
        </div>
        <h1 className="text-2xl font-semibold">Log in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Access your saved ideas, alerts, billing, and creator dashboard.
        </p>
        {verifyPrompt ? (
          <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Please check your email to confirm your account.
          </p>
        ) : null}

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none ring-primary/40 focus:ring-2"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              Password
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none ring-primary/40 focus:ring-2"
            />
          </label>

          {error ? (
            <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {status ? (
            <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {status}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="creator-cta w-full rounded-md px-4 py-2 font-semibold text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-3">
          {googleAuthEnabled ? (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              disabled={loading}
              className="creator-outline-cta w-full rounded-md border px-4 py-2 font-semibold text-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sign in with Google
            </button>
          ) : null}
          <Link
            href="/forgot-password"
            className="block text-center text-sm text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          No account?{" "}
          <Link
            href="/signup"
            className="text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="creator-page flex min-h-svh items-center justify-center px-4 text-foreground">
          <div className="creator-studio-panel w-full max-w-md rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              Loading login...
            </p>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
