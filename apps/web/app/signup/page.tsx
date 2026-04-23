"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { getSupabaseClient } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-950 px-4 text-slate-100">
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
              className="w-full rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-300/60 focus:ring-2"
            />
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
