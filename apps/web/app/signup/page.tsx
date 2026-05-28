"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import {
  affiliateToSignupMetadata,
  appendAffiliateToUrl,
  captureAffiliateAttribution,
} from "@/lib/affiliate-attribution";
import { getPasswordStrength } from "@/lib/password-strength";
import { getSupabaseClient } from "@/lib/supabase";
import { trackConversionEvent } from "@/lib/telemetry";

const googleAuthEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

const signupBenefits = [
  "Start with a free account",
  "No credit card required",
  "Run your first trend scan after confirming email",
  "Upgrade only when you need more monthly credits",
] as const;

function safeRedirectTarget(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);
  const redirectTarget = safeRedirectTarget(
    searchParams.get("next") ?? searchParams.get("redirect"),
  );
  const encodedRedirectTarget = encodeURIComponent(redirectTarget);
  const loginHref = `/login?redirect=${encodedRedirectTarget}`;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const affiliate = captureAffiliateAttribution();
      trackConversionEvent({
        event: "signup_clicked",
        context: { method: "email", affiliate },
      });
      const supabase = getSupabaseClient();
      const callbackUrl = appendAffiliateToUrl(
        `${window.location.origin}/auth/callback?next=${encodedRedirectTarget}`,
        affiliate,
      );
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callbackUrl,
          data: affiliateToSignupMetadata(affiliate),
        },
      });
      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(
        "Account created. Check your email to confirm your account, then you will continue where you left off.",
      );
      trackConversionEvent({
        event: "signup_completed",
        context: { method: "email", affiliate },
      });
      window.setTimeout(() => {
        router.push(`/login?verify=1&redirect=${encodedRedirectTarget}`);
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const affiliate = captureAffiliateAttribution();
      trackConversionEvent({
        event: "signup_google_clicked",
        context: { method: "google", affiliate },
      });
      const supabase = getSupabaseClient();
      const callbackUrl = appendAffiliateToUrl(
        `${window.location.origin}/auth/callback?next=${encodedRedirectTarget}`,
        affiliate,
      );
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      });
      if (oauthError) setError(oauthError.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-up failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-8 text-foreground">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:border-white/10 dark:bg-slate-900 md:grid-cols-[0.9fr_1.1fr]">
        <aside className="border-b border-border bg-muted/40 p-6 dark:border-white/10 dark:bg-white/[0.04] md:border-b-0 md:border-r">
          <Link
            href="/"
            className="mb-8 block text-xs font-semibold uppercase tracking-[0.2em] text-primary dark:text-cyan-300"
          >
            TrendBoard
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary dark:text-cyan-300">
            Free account
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Save the ideas worth filming.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground dark:text-slate-400">
            Create an account when you want live trend scans, saved source
            links, hooks, scripts, hashtags, and calendar-ready idea cards.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-foreground">
            {signupBenefits.map((benefit) => (
              <li key={benefit} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary dark:text-cyan-300" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </aside>

        <section className="p-6">
          <Link
            href="/"
            className="mb-6 block text-xs font-semibold uppercase tracking-[0.2em] text-primary dark:text-cyan-300 md:hidden"
          >
            TrendBoard
          </Link>
          <h2 className="text-2xl font-semibold">Create your account</h2>
          <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
            Confirm your email, then run your first trend analysis.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground dark:text-slate-300">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none ring-primary/40 focus:ring-2 dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 dark:ring-cyan-300/60"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground dark:text-slate-300">
                Password
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                aria-describedby="password-strength-hint"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none ring-primary/40 focus:ring-2 dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 dark:ring-cyan-300/60"
              />
              {password ? (
                <div
                  id="password-strength-hint"
                  className="mt-2 space-y-1.5"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((segment) => (
                      <div
                        key={segment}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                          segment <= strength.level
                            ? strength.level <= 1
                              ? "bg-rose-400/90"
                              : strength.level === 2
                                ? "bg-amber-400/90"
                                : strength.level === 3
                                  ? "bg-primary/80 dark:bg-cyan-400/90"
                                  : "bg-emerald-400/90"
                            : "bg-muted-foreground/20 dark:bg-slate-700/80"
                        }`}
                      />
                    ))}
                  </div>
                  <p
                    className={`text-xs font-medium tracking-wide ${
                      strength.level <= 1
                        ? "text-rose-700 dark:text-rose-300/90"
                        : strength.level === 2
                          ? "text-amber-700 dark:text-amber-200/90"
                          : strength.level === 3
                            ? "text-primary dark:text-cyan-200/90"
                            : "text-emerald-700 dark:text-emerald-200/90"
                    }`}
                  >
                    {strength.label === "Too short"
                      ? "Too short — at least 6 characters"
                      : strength.label === "Weak"
                        ? "Weak — add length and mix of characters"
                        : strength.label === "Fair"
                          ? "Fair — could be stronger"
                          : strength.label === "Good"
                            ? "Good password"
                            : "Strong password"}
                  </p>
                </div>
              ) : (
                <p
                  id="password-strength-hint"
                  className="mt-1.5 text-xs text-muted-foreground dark:text-slate-500"
                >
                  Use at least 8 characters with upper and lower case, a number,
                  and a symbol for a strong password.
                </p>
              )}
            </label>

            {error ? (
              <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950 dark:hover:opacity-90"
            >
              {loading ? "Creating account..." : "Create free account"}
            </button>
          </form>

          {googleAuthEnabled ? (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              disabled={loading}
              className="mt-4 w-full rounded-md border border-border bg-card px-4 py-2 font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Sign up with Google
            </button>
          ) : null}

          <p className="mt-4 text-sm text-muted-foreground dark:text-slate-400">
            Already have an account?{" "}
            <Link
              href={loginHref}
              className="text-primary hover:underline dark:text-cyan-300"
            >
              Log in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center bg-background px-4 text-foreground">
          <div className="glass-surface w-full max-w-md rounded-xl border border-border bg-card p-6 dark:border-white/10 dark:bg-slate-900">
            <p className="text-sm text-muted-foreground dark:text-slate-300">
              Loading signup...
            </p>
          </div>
        </main>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
