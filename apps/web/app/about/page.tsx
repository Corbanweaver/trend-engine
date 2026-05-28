import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Search, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "TrendBoard helps content creators find live trends and turn them into post ideas, hooks, scripts, hashtags, and content plans.",
};

const steps = [
  {
    icon: Search,
    title: "Find what people care about",
    body: "Scan social, search, community, and news signals for topics that are moving now.",
  },
  {
    icon: Sparkles,
    title: "Turn trends into posts",
    body: "Get simple idea cards with hooks, scripts, hashtags, source links, and next steps.",
  },
  {
    icon: CalendarDays,
    title: "Save the ideas worth filming",
    body: "Keep strong ideas organized so you can film today or plan the week.",
  },
] as const;

function Header() {
  return (
    <header className="border-b border-border bg-background/95 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/95 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-[0.08em] text-foreground hover:text-primary sm:tracking-[0.16em]"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground dark:bg-cyan-400 dark:text-slate-950">
            T
          </span>
          <span className="truncate">TrendBoard</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-5">
          <Link
            href="/pricing"
            className="hidden font-medium text-muted-foreground hover:text-foreground sm:inline"
          >
            Pricing
          </Link>
          <Link
            href="/support"
            className="hidden font-medium text-muted-foreground hover:text-foreground sm:inline"
          >
            Support
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
          >
            Open app
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <Header />

      <section className="mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6 sm:pt-16">
        <div className="max-w-3xl">
          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            TrendBoard helps creators decide what to post next.
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Instead of staring at a blank screen, type your niche and get trend
            backed ideas you can turn into short videos, posts, and content
            plans.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Open TrendBoard
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border bg-card px-6 text-sm font-bold text-foreground hover:bg-muted dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-900"
            >
              See pricing
            </Link>
          </div>
        </div>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.title}
              className="rounded-2xl border border-border bg-card p-5 dark:border-white/10 dark:bg-slate-950/70"
            >
              <step.icon className="size-6 text-primary dark:text-cyan-300" />
              <h2 className="mt-4 text-base font-bold">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {step.body}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-border bg-card p-6 dark:border-white/10 dark:bg-slate-950/70 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Built for content creators, not researchers.
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              The useful part is the workflow: find a signal, understand why it
              matters, turn it into a post angle, and save it before the idea
              disappears.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
