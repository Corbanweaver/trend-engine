import Link from "next/link";
import {
  Bot,
  CalendarDays,
  Layers,
  LineChart,
  Radio,
  Sparkles,
  Zap,
} from "lucide-react";

import { EmailWaitlistForm } from "@/components/email-waitlist-form";

const howSteps = [
  {
    step: "01",
    title: "Choose your niche",
    body: "Pick a preset category—from breaking news to gaming—or type a custom focus so scans stay relevant.",
  },
  {
    step: "02",
    title: "Scan live signals",
    body: "We pull fresh momentum from TikTok, YouTube Shorts, Reddit, Google Trends, news, and more in one run.",
  },
  {
    step: "03",
    title: "Ship scroll-stopping ideas",
    body: "Get hooks, full scripts, hashtags, SEO blurbs, and thumbnail directions you can film today.",
  },
] as const;

const featureCards = [
  {
    icon: Layers,
    title: "Multi-platform intel",
    body: "See what’s rising across short video, social, and search—not just one feed.",
  },
  {
    icon: Sparkles,
    title: "AI scripts & hooks",
    body: "Every trend ships with punchy hooks and tight 30–60s scripts tuned for Shorts and Reels.",
  },
  {
    icon: Zap,
    title: "Thumbnail direction",
    body: "Optional AI visuals so your packaging matches the angle before you hit record.",
  },
  {
    icon: CalendarDays,
    title: "Save & schedule",
    body: "Bookmark winners and map them on your content calendar without losing context.",
  },
  {
    icon: Radio,
    title: "Live trending pulse",
    body: "Visit the trending hub for a cross-platform snapshot that auto-refreshes for a real-time feel.",
  },
  {
    icon: Bot,
    title: "Creator copilot",
    body: "Ask questions in-app and iterate on ideas without breaking your flow.",
  },
] as const;

export default function Home() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-6rem] h-80 w-80 animate-pulse rounded-full bg-blue-300/30 blur-3xl dark:bg-fuchsia-500/25" />
        <div className="absolute right-[-5rem] top-10 h-96 w-96 animate-pulse rounded-full bg-blue-400/20 blur-3xl dark:bg-cyan-500/20" />
        <div className="absolute bottom-[-7rem] left-1/3 h-96 w-96 animate-pulse rounded-full bg-blue-500/20 blur-3xl dark:bg-indigo-500/20" />
      </div>

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7">
        <Link
          href="/"
          className="fluid-transition text-sm font-semibold tracking-[0.18em] text-foreground hover:text-primary"
        >
          Trend Engine
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/trending"
            className="fluid-transition font-medium text-muted-foreground hover:text-foreground"
          >
            Trending
          </Link>
          <Link
            href="/pricing"
            className="fluid-transition font-medium text-muted-foreground hover:text-foreground"
          >
            Pricing
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto flex min-h-[calc(100svh-5.5rem)] w-full max-w-6xl flex-col items-center justify-center px-6 py-18 text-center">
        <span className="glass-surface hairline-ring rounded-full border border-border bg-card px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary dark:text-cyan-200">
          Trend Engine
        </span>

        <h1 className="mt-8 max-w-5xl text-balance bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-5xl font-extrabold leading-tight text-transparent sm:text-6xl lg:text-7xl dark:from-white dark:via-cyan-100 dark:to-fuchsia-200">
          Turn Trends Into Scroll-Stopping Content
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Discover viral trends and generate AI video ideas instantly
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <a
            href="/dashboard"
            className="fluid-transition inline-flex items-center justify-center rounded-2xl bg-primary px-10 py-4 text-base font-bold text-primary-foreground shadow-[0_0_28px_rgba(59,130,246,0.35)] hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(59,130,246,0.45)] dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-500 dark:text-slate-950"
          >
            Start Finding Trends
          </a>
          <Link
            href="/trending"
            className="fluid-transition inline-flex items-center justify-center rounded-2xl border border-border bg-card px-8 py-4 text-base font-semibold text-foreground hover:bg-muted dark:border-white/15 dark:bg-slate-900/60 dark:hover:bg-slate-800"
          >
            See live trending
          </Link>
        </div>
      </section>

      <section
        id="how-it-works"
        className="relative z-20 mx-auto w-full max-w-6xl px-6 py-20"
      >
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary dark:text-cyan-200">
            How it works
          </span>
          <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            From signal to script in three moves
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Built for creators who want speed without sacrificing depth—one flow,
            many platforms.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {howSteps.map((s) => (
            <div
              key={s.step}
              className="fluid-transition rounded-2xl border border-border bg-card/80 p-8 text-left shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/50"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary dark:text-cyan-300">
                Step {s.step}
              </p>
              <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-20 mx-auto w-full max-w-6xl px-6 py-12">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary dark:text-cyan-200">
            Features
          </span>
          <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Everything you need to ride the wave
          </h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((f) => (
            <div
              key={f.title}
              className="fluid-transition flex flex-col rounded-2xl border border-border bg-gradient-to-br from-card to-card/40 p-6 shadow-sm dark:border-white/10 dark:from-slate-900/80 dark:to-slate-950/60"
            >
              <div className="flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 dark:border-cyan-400/25 dark:bg-cyan-400/10">
                <f.icon className="size-5 text-primary dark:text-cyan-300" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-20 mx-auto w-full max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-border bg-muted/40 px-8 py-12 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex flex-col items-center text-center">
            <LineChart className="size-10 text-primary dark:text-cyan-300" />
            <h2 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Trusted by teams who live in the feed
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Creators and growth leads use Trend Engine to collapse research time
              from hours to minutes—so publishing stays consistent when trends move
              fast.
            </p>
            <div className="mt-10 grid w-full max-w-4xl gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-background/80 px-5 py-6 dark:border-white/10 dark:bg-slate-950/50">
                <p className="text-3xl font-extrabold text-primary dark:text-cyan-200">
                  4.9★
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  Avg. satisfaction
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  From solo creators testing hooks weekly.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background/80 px-5 py-6 dark:border-white/10 dark:bg-slate-950/50">
                <p className="text-3xl font-extrabold text-primary dark:text-cyan-200">
                  12 min
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  Idea-to-outline
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Typical time saved vs. manual trend chasing.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-background/80 px-5 py-6 dark:border-white/10 dark:bg-slate-950/50">
                <p className="text-3xl font-extrabold text-primary dark:text-cyan-200">
                  6+
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  Platforms scanned
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Short video, news, communities, and search signals together.
                </p>
              </div>
            </div>
            <div className="mt-10 grid max-w-4xl gap-4 text-left sm:grid-cols-2">
              <blockquote className="rounded-2xl border border-border bg-card p-5 text-sm italic text-muted-foreground dark:border-white/10 dark:bg-slate-900/60">
                “We replaced three bookmarked dashboards with this. The scripts
                alone paid for the subscription.”
                <footer className="mt-3 text-xs font-semibold not-italic text-foreground">
                  — Lead creator, 260k followers
                </footer>
              </blockquote>
              <blockquote className="rounded-2xl border border-border bg-card p-5 text-sm italic text-muted-foreground dark:border-white/10 dark:bg-slate-900/60">
                “Finally something that feels live—our Slack picks up the trending
                page every morning.”
                <footer className="mt-3 text-xs font-semibold not-italic text-foreground">
                  — Growth manager, consumer brand
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-indigo-950/70 p-8 shadow-[0_0_48px_rgba(59,130,246,0.18)] backdrop-blur-sm sm:p-10">
          <p className="text-center text-2xl font-semibold text-slate-100 sm:text-3xl">
            Join 1,000+ creators discovering viral trends
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-300 sm:text-base">
            Get product updates, early feature access, and weekly trend insights straight to your inbox.
          </p>
          <EmailWaitlistForm />
        </div>
      </section>
    </main>
  );
}
