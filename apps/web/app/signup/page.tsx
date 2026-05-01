"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { getPasswordStrength } from "@/lib/password-strength";
import { getSupabaseClient } from "@/lib/supabase";

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
      const supabase = getSupabaseClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess("Account created. Check your email to confirm your account.");
      window.setTimeout(() => {
        router.push("/login?verify=1");
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-slate-900 p-6">
        <h1 className="text-2xl font-semibold">Sign up</h1>
        <p className="mt-1 text-sm text-slate-400">Create your account.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-300/60 focus:ring-2"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              aria-describedby="password-strength-hint"
              className="w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-300/60 focus:ring-2"
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
                                ? "bg-cyan-400/90"
                                : "bg-emerald-400/90"
                          : "bg-slate-700/80"
                      }`}
                    />
                  ))}
                </div>
                <p
                  className={`text-xs font-medium tracking-wide ${
                    strength.level <= 1
                      ? "text-rose-300/90"
                      : strength.level === 2
                        ? "text-amber-200/90"
                        : strength.level === 3
                          ? "text-cyan-200/90"
                          : "text-emerald-200/90"
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
              <p id="password-strength-hint" className="mt-1.5 text-xs text-slate-500">
                Use at least 8 characters with upper and lower case, a number, and a symbol for a
                strong password.
              </p>
            )}
          </label>

          {error ? (
            <p className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              {success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-300 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
