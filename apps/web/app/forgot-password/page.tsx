"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { getSupabaseClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      setCooldownSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (resetError) {
        if (resetError.message.toLowerCase().includes("rate")) {
          setCooldownSeconds(60);
          setError("Please wait about a minute before requesting another reset email. Supabase limits repeated password reset emails for security.");
        } else {
          setError(resetError.message);
        }
        return;
      }
      setCooldownSeconds(60);
      setMessage("Check your email for a secure password reset link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 text-foreground">
      <div className="glass-surface w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
          Enter your email and we will send a secure reset link.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground dark:text-slate-300">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground outline-none ring-primary/40 focus:ring-2 dark:border-white/15 dark:bg-slate-950 dark:text-slate-100 dark:ring-cyan-300/60"
            />
          </label>
          {error ? (
            <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              {message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading || cooldownSeconds > 0}
            className="w-full rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-400 dark:text-slate-950"
          >
            {loading ? "Sending..." : cooldownSeconds > 0 ? `Try again in ${cooldownSeconds}s` : "Send reset link"}
          </button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground dark:text-slate-400">
          Remembered it?{" "}
          <Link href="/login" className="text-primary hover:underline dark:text-cyan-300">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
