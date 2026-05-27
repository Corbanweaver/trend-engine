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
          className="h-12 flex-1 rounded-lg border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-primary/30 transition focus:ring-2"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="creator-cta h-12 rounded-lg px-6 text-sm font-semibold text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Submitting..." : "Get Early Access"}
        </button>
      </div>
      {message ? (
        <p
          className={`mt-3 text-sm ${
            status === "success" ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
