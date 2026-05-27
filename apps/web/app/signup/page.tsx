"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { MarketingLogo } from "@/components/marketing/marketing-shell";
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

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);

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
        `${window.location.origin}/auth/callback?next=/analyze`,
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
        "Account created. Check your email to confirm your account, then you will be sent to trend analysis.",
      );
      trackConversionEvent({
        event: "signup_completed",
        context: { method: "email", affiliate },
      });
      window.setTimeout(() => {
        router.push("/login?verify=1");
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
        `${window.location.origin}/auth/callback?next=/analyze`,
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
    <main className="creator-page flex min-h-svh items-center justify-center px-4 py-8 text-foreground">
      <div className="creator-dashboard-shell grid w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-card shadow-sm md:grid-cols-[0.9fr_1.1fr]">
        <aside className="creator-studio-panel border-b border-border p-6 md:border-b-0 md:border-r">
          <div className="mb-8">
            <MarketingLogo />
          </div>
          <p className="text-xs font-semibold uppercase text-primary">
            Free account
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Save the ideas worth filming.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Create an account when you want live trend scans, saved source
            links, hooks, scripts, hashtags, and calendar-ready idea cards.
          </p>
          <ul className="mt-6 flex flex-col gap-3 text-sm text-foreground">
            {signupBenefits.map((benefit) => (
              <li key={benefit} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </aside>

        <section className="p-6">
          <Link
            href="/"
            className="mb-6 block text-xs font-semibold uppercase text-primary md:hidden"
          >
            TrendBoard
          </Link>
          <h2 className="text-2xl font-semibold">Create your account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirm your email, then run your first trend analysis.
          </p>

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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                aria-describedby="password-strength-hint"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none ring-primary/40 focus:ring-2"
              />
              {password ? (
                <div
                  id="password-strength-hint"
                  className="mt-2 flex flex-col gap-1.5"
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
                                  ? "bg-primary/80"
                                  : "bg-emerald-400/90"
                            : "bg-muted-foreground/20"
                        }`}
                      />
                    ))}
                  </div>
                  <p
                    className={`text-xs font-medium tracking-wide ${
                      strength.level <= 1
                        ? "text-rose-700"
                        : strength.level === 2
                          ? "text-amber-700"
                          : strength.level === 3
                            ? "text-primary"
                            : "text-emerald-700"
                    }`}
                  >
                    {strength.label === "Too short"
                      ? "Too short - at least 6 characters"
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
                  Use at least 8 characters with upper and lower case, a number,
                  and a symbol for a strong password.
                </p>
              )}
            </label>

            {error ? (
              <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="creator-cta w-full rounded-md px-4 py-2 font-semibold text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create free account"}
            </button>
          </form>

          {googleAuthEnabled ? (
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              disabled={loading}
              className="creator-outline-cta mt-4 w-full rounded-md border px-4 py-2 font-semibold text-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sign up with Google
            </button>
          ) : null}

          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline"
            >
              Log in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
