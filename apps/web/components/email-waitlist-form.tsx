"use client";

import { FormEvent, useState } from "react";

type SubmitState = "idle" | "loading" | "success" | "error";

export function EmailWaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setStatus("error");
      setMessage("Please enter a valid email.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/email-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const body = (await response.json()) as { error?: string; ok?: boolean };
      if (!response.ok) {
        throw new Error(body.error || "Failed to join waitlist.");
      }

      setStatus("success");
      setMessage("You are in. We will reach out soon.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Failed to join waitlist.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-8 w-full max-w-xl">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          autoComplete="email"
          required
          className="h-12 flex-1 rounded-xl border border-cyan-300/25 bg-slate-900/70 px-4 text-sm text-slate-100 placeholder:text-slate-400 outline-none ring-cyan-300/40 transition focus:ring-2"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-12 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_12px_24px_rgba(54,95,125,0.2)] transition hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_16px_32px_rgba(54,95,125,0.24)] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-500 dark:text-slate-950 dark:shadow-[0_0_24px_rgba(56,189,248,0.35)] dark:hover:shadow-[0_0_36px_rgba(99,102,241,0.45)]"
        >
          {status === "loading" ? "Submitting..." : "Get Early Access"}
        </button>
      </div>
      {message ? (
        <p
          className={`mt-3 text-sm ${
            status === "success" ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
