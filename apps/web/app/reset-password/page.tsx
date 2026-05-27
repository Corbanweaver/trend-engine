"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { MarketingLogo } from "@/components/marketing/marketing-shell";
import { getSupabaseClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyingLink, setVerifyingLink] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyResetSession() {
      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, ""),
      );
      const searchParams = new URLSearchParams(window.location.search);
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const errorDescription =
        searchParams.get("error_description") ?? searchParams.get("error");

      if (errorDescription) {
        setError(errorDescription);
        return;
      }

      if (!access_token && !refresh_token && !code && !tokenHash) {
        try {
          const supabase = getSupabaseClient();
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (active && !session) {
            setError(
              "This reset link is missing its secure token. Please request a fresh password reset email.",
            );
          }
        } catch {
          if (active) {
            setError(
              "Account features are not configured in this preview. Request a reset from the live site.",
            );
          }
        }
        return;
      }

      setVerifyingLink(true);
      setError(null);
      setMessage("Verifying your reset link...");

      try {
        const supabase = getSupabaseClient();
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (tokenHash) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (verifyError) throw verifyError;
        } else {
          if (!access_token || !refresh_token)
            throw new Error("That reset link is missing its secure tokens.");
          const response = await fetch("/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token,
              refresh_token,
              next: "/reset-password",
            }),
          });
          if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error(
              body?.error || "That reset link could not be verified.",
            );
          }
        }

        window.history.replaceState(null, "", window.location.pathname);
        if (active) setMessage("Reset link verified. Choose a new password.");
      } catch (err) {
        if (active) {
          setMessage(null);
          setError(
            err instanceof Error
              ? err.message
              : "That reset link could not be verified.",
          );
        }
      } finally {
        if (active) setVerifyingLink(false);
      }
    }

    void verifyResetSession();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setMessage("Password updated. Redirecting to your dashboard...");
      window.setTimeout(() => {
        router.replace("/analyze");
        router.refresh();
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update password.",
      );
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
        <h1 className="text-2xl font-semibold">Choose a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter a new password for your TrendBoard account.
        </p>
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">
              New password
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                className="w-full rounded-md border border-input bg-background px-3 py-2 pr-11 text-foreground outline-none ring-primary/40 focus:ring-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </label>
          {error ? (
            <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading || verifyingLink}
            className="creator-cta w-full rounded-md px-4 py-2 font-semibold text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifyingLink
              ? "Verifying..."
              : loading
                ? "Updating..."
                : "Update password"}
          </button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Need a new reset link?{" "}
          <Link
            href="/forgot-password"
            className="text-primary hover:underline"
          >
            Start over
          </Link>
        </p>
      </div>
    </main>
  );
}
