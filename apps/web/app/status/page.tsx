import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "System Status",
  description: "Production health and support status for TrendBoard.",
};

export default function StatusPage() {
  return (
    <main className="min-h-svh bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.18em] text-foreground hover:text-primary"
          >
            TrendBoard
          </Link>
          <Link
            href="/support"
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            Contact support
          </Link>
        </header>

        <section className="rounded-3xl border border-border bg-card p-8 shadow-sm dark:border-white/10 dark:bg-slate-950/60 sm:p-10">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl border border-emerald-400/35 bg-emerald-500/10">
              <CheckCircle2 className="size-6 text-emerald-500 dark:text-emerald-300" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary dark:text-cyan-200">
                Status
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
                Production checks are active
              </h1>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-muted-foreground">
            TrendBoard has a public health endpoint, protected deep health
            checks, and a scheduled production monitor. If something feels wrong
            inside the app, support can use the operational event stream and
            provider dashboards to investigate.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 dark:border-white/10 dark:bg-slate-950/45">
            <Activity className="size-6 text-primary dark:text-cyan-300" />
            <h2 className="mt-4 text-base font-semibold">Public health</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The site exposes a lightweight health check for uptime monitoring.
            </p>
            <a
              href="/api/health"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Open health endpoint
              <ExternalLink className="size-3.5" />
            </a>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 dark:border-white/10 dark:bg-slate-950/45">
            <ShieldCheck className="size-6 text-primary dark:text-cyan-300" />
            <h2 className="mt-4 text-base font-semibold">
              Protected deep checks
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Deeper Supabase, Stripe, OpenAI, and backend checks require a
              private health secret.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 dark:border-white/10 dark:bg-slate-950/45">
            <CheckCircle2 className="size-6 text-primary dark:text-cyan-300" />
            <h2 className="mt-4 text-base font-semibold">Support path</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Billing, login, credits, and analysis-quality issues route through
              the support page.
            </p>
            <Link
              href="/support"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Get help
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
