import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Compass, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how Content Buddy helps creators turn live trend signals into scripts, hooks, hashtags, and idea cards.",
};

const principles = [
  "Creator workflows should be fast enough to use before a trend cools off.",
  "AI output should include useful context, not just generic content ideas.",
  "Saved ideas should keep source links, scripts, hashtags, and calendar context together.",
];

export default function AboutPage() {
  return (
    <main className="min-h-svh bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-[0.18em] text-foreground hover:text-primary"
          >
            Content Buddy
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/support" className="hover:text-foreground">
              Support
            </Link>
            <Link href="/dashboard" className="hover:text-foreground">
              Open app
            </Link>
          </nav>
        </header>

        <section className="rounded-3xl border border-border bg-card p-8 shadow-sm dark:border-white/10 dark:bg-slate-950/60 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary dark:text-cyan-200">
            About
          </p>
          <h1 className="mt-4 max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            Built for creators who need sharper ideas while the topic is still
            moving.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
            Content Buddy gathers live momentum signals, turns them into
            short-form video angles, and keeps the full creative brief together
            so you can move from research to publishing without rebuilding the
            context from scratch.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              Start an analysis
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/status"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              View system status
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 dark:border-white/10 dark:bg-slate-950/45">
            <Compass className="size-6 text-primary dark:text-cyan-300" />
            <h2 className="mt-4 text-base font-semibold">
              Live signal research
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The app combines public trend signals across search, social,
              communities, news, and video sources when they are available.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 dark:border-white/10 dark:bg-slate-950/45">
            <Sparkles className="size-6 text-primary dark:text-cyan-300" />
            <h2 className="mt-4 text-base font-semibold">AI creative briefs</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Each analysis can produce hooks, scripts, hashtags, thumbnail
              direction, source links, and polished idea card images.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 dark:border-white/10 dark:bg-slate-950/45">
            <CheckCircle2 className="size-6 text-primary dark:text-cyan-300" />
            <h2 className="mt-4 text-base font-semibold">
              Built for launch discipline
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Credits, billing, alerts, saved ideas, and calendar planning are
              designed around real creator workflows.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-muted/45 p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <h2 className="text-lg font-semibold">Product principles</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            {principles.map((item) => (
              <li key={item} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary dark:text-cyan-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
