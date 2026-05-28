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
import { getCheckoutIntentFromRedirectTarget } from "@/lib/checkout-intent";
import { getPasswordStrength } from "@/lib/password-strength";
import { getSupabaseClient } from "@/lib/supabase";
import { trackConversionEvent } from "@/lib/telemetry";

const googleAuthEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

const signupBenefits = [
  "Save ideas worth filming",
  "Run your first trend scan",
  "No card needed to start",
] as const;

const paidSignupBenefits = [
  "Create the account first",
  "Then continue to Stripe checkout",
  "Credits and saved ideas stay connected",
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
  const checkoutIntent = getCheckoutIntentFromRedirectTarget(redirectTarget);
  const benefits = checkoutIntent ? paidSignupBenefits : signupBenefits;
  const signupButtonLabel = checkoutIntent
    ? `Create account for ${checkoutIntent.planName}`
    : "Create free account";
  const signupLoadingLabel = checkoutIntent
    ? "Creating checkout account..."
    : "Creating account...";

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
        "Account created. Check your email, then come back to continue.",
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
              ? `Create account for ${checkoutIntent.planName}`
              : "Create your free account"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {checkoutIntent
              ? "Create your account so billing, credits, and saved ideas stay together."
              : "Save creator ideas, run trend scans, and come back when it is time to film."}
          </p>

          <ul className="mt-5 grid gap-2 text-sm">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary dark:text-cyan-300" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                aria-describedby="password-strength-hint"
                className="h-12 w-full rounded-xl border border-input bg-background px-3 text-foreground outline-none ring-primary/40 focus:ring-2 dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 dark:ring-cyan-300/60"
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
                    className={`text-xs font-medium ${
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
                      ? "Too short - use at least 6 characters"
                      : strength.label === "Weak"
                        ? "Weak - add length and mix of characters"
                        : strength.label === "Fair"
                          ? "Fair - could be stronger"
                          : strength.label === "Good"
                            ? "Good password"
                            : "Strong password"}
                  </p>
                </div>
              ) : (
                <p
                  id="password-strength-hint"
                  className="mt-1.5 text-xs text-muted-foreground"
                >
                  Use at least 6 characters. 8+ is better.
                </p>
              )}
            </label>

            {error ? (
              <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              {loading ? signupLoadingLabel : signupButtonLabel}
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
                ? `Continue ${checkoutIntent.planName} with Google`
                : "Sign up with Google"}
            </button>
          ) : null}

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={loginHref}
              className="font-semibold text-primary hover:underline dark:text-cyan-300"
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
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 dark:border-white/10 dark:bg-slate-950/70">
            <p className="text-sm text-muted-foreground">Loading signup...</p>
          </div>
        </main>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
