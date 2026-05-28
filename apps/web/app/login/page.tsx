"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { getCheckoutIntentFromRedirectTarget } from "@/lib/checkout-intent";
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
      : "/dashboard";
  const signupHref = `/signup?redirect=${encodeURIComponent(
    safeRedirectTarget,
  )}`;
  const checkoutIntent =
    getCheckoutIntentFromRedirectTarget(safeRedirectTarget);
  const submitLabel = checkoutIntent ? "Continue checkout" : "Log in";
  const loadingLabel = checkoutIntent
    ? "Continuing checkout..."
    : "Logging in...";

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
    <main className="min-h-svh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md flex-col justify-center">
        <Link
          href="/"
          className="mb-5 flex w-fit items-center gap-2 text-sm font-semibold tracking-[0.08em] text-foreground hover:text-primary"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground dark:bg-cyan-400 dark:text-slate-950">
            T
          </span>
          <span>TrendBoard</span>
        </Link>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
          <h1 className="text-3xl font-extrabold tracking-tight">
            {checkoutIntent
              ? `Continue ${checkoutIntent.planName}`
              : "Log in to TrendBoard"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {checkoutIntent
              ? "Sign in so Stripe can attach this plan to your TrendBoard account."
              : "Open your saved ideas, trend scans, scripts, calendar, and billing."}
          </p>

          {verifyPrompt ? (
            <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
              Check your email to confirm your account, then log in.
            </p>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-muted-foreground">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-xl border border-input bg-background px-3 text-foreground outline-none ring-primary/40 focus:ring-2 dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 dark:ring-cyan-300/60"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-muted-foreground">
                Password
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-xl border border-input bg-background px-3 text-foreground outline-none ring-primary/40 focus:ring-2 dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 dark:ring-cyan-300/60"
              />
            </label>

            {error ? (
              <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </p>
            ) : null}
            {status ? (
              <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                {status}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              {loading ? loadingLabel : submitLabel}
            </button>
          </form>

          {googleAuthEnabled ? (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              disabled={loading}
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              {checkoutIntent
                ? "Continue checkout with Google"
                : "Sign in with Google"}
            </button>
          ) : null}

          <Link
            href="/forgot-password"
            className="mt-4 block text-center text-sm font-semibold text-primary hover:underline dark:text-cyan-300"
          >
            Forgot password?
          </Link>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link
              href={signupHref}
              className="font-semibold text-primary hover:underline dark:text-cyan-300"
            >
              Create a free account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center bg-background px-4 text-foreground">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 dark:border-white/10 dark:bg-slate-950/70">
            <p className="text-sm text-muted-foreground">Loading login...</p>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
