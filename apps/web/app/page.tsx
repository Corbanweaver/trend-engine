import Link from "next/link";
import {
  Bot,
  CalendarDays,
  Instagram,
  Layers,
  LineChart,
  Radio,
  Sparkles,
  Star,
  Youtube,
  Zap,
} from "lucide-react";

import { EmailWaitlistForm } from "@/components/email-waitlist-form";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";

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

const testimonials = [
  {
    quote:
      "I post six Shorts a week for two channels. Trend Engine cut my research nights from three hours to under twenty minutes—the hooks alone are scary good.",
    name: "Maya Chen",
    handle: "@mayashorts",
    role: "Food & lifestyle · 480k subs",
    initials: "MC",
  },
  {
    quote:
      "Our editor used to screenshot Reddit and Discord all morning. Now we open the trending hub, pick two angles, and we’re scripting by lunch. Game changer for a tiny team.",
    name: "Jordan Wells",
    handle: "@jwtechbits",
    role: "Tech reviews · 210k subs",
    initials: "JW",
  },
  {
    quote:
      "I’m allergic to generic AI fluff. The scripts actually sound like my voice because they’re tied to what’s literally blowing up that day—not last month’s memes.",
    name: "Sam Ortiz",
    handle: "@samfitruns",
    role: "Fitness creator · 1.1M TikTok",
    initials: "SO",
  },
] as const;

const faqItems = [
  {
    q: "Which platforms does Trend Engine scan?",
    a: "We aggregate momentum signals from short-form video, community discussions, news, and search—so you see a cross-platform picture instead of one siloed feed.",
  },
  {
    q: "How fresh is the trend data?",
    a: "Trending views refresh on a short cadence designed for daily publishing. Saved ideas keep the snapshot so you always know what context you planned against.",
  },
  {
    q: "Is there a free plan?",
    a: "You can explore core flows and see how ideas are generated before upgrading. Paid plans unlock higher limits and the full copilot experience—see Pricing for details.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Subscriptions are billed in advance but you can cancel whenever you like; access continues through the end of the paid period.",
  },
  {
    q: "Do you train models on my scripts or niche inputs?",
    a: "We process your requests to deliver answers and ideas. We don’t use your content to advertise other customers’ channels or sell your niche data.",
  },
] as const;

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-6rem] h-80 w-80 animate-pulse rounded-full bg-primary/10 blur-3xl dark:bg-fuchsia-500/25" />
        <div className="absolute right-[-5rem] top-10 h-96 w-96 animate-pulse rounded-full bg-secondary/70 blur-3xl dark:bg-cyan-500/20" />
        <div className="absolute bottom-[-7rem] left-1/3 h-96 w-96 animate-pulse rounded-full bg-primary/5 blur-3xl dark:bg-indigo-500/20" />
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
            href="#features"
            className="fluid-transition font-medium text-muted-foreground hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="fluid-transition font-medium text-muted-foreground hover:text-foreground"
          >
            How it works
          </Link>
          <Link
            href="/trending"
            className="fluid-transition font-medium text-muted-foreground hover:text-foreground"
          >
            Trending
          </Link>
          <Link
            href="#faq"
            className="fluid-transition font-medium text-muted-foreground hover:text-foreground"
          >
            FAQ
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
            className="fluid-transition inline-flex items-center justify-center rounded-2xl bg-primary px-10 py-4 text-base font-bold text-primary-foreground shadow-[0_12px_28px_rgba(54,95,125,0.2)] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_16px_36px_rgba(54,95,125,0.24)] dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-500 dark:text-slate-950"
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

      <HowItWorksSection steps={howSteps} />

      <section
        id="features"
        className="relative z-20 mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-12"
      >
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary dark:text-cyan-200">
            Features
          </span>
          <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Everything you need to ride the wave
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Six pillars that keep research, ideation, and packaging in one loop.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((f) => (
            <div
              key={f.title}
              className="spring-pop group fluid-transition flex flex-col rounded-2xl border border-border bg-gradient-to-br from-card to-card/40 p-6 shadow-sm hover:-translate-y-1 hover:border-primary/25 hover:shadow-md dark:border-white/10 dark:from-slate-900/80 dark:to-slate-950/60 dark:hover:border-cyan-400/20"
            >
              <div className="flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 transition-transform duration-300 group-hover:scale-105 dark:border-cyan-400/25 dark:bg-cyan-400/10">
                <f.icon className="size-5 text-primary transition-transform duration-300 group-hover:rotate-6 dark:text-cyan-300" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="testimonials"
        className="relative z-20 mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-16"
      >
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary dark:text-cyan-200">
            Social proof
          </span>
          <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Creators who ship on deadlines
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Independent voices—from niche labs to faceless edits—use Trend Engine to
            publish while topics are still hot.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.handle}
              className="flex h-full flex-col rounded-2xl border border-border bg-card/90 p-6 text-left shadow-sm dark:border-white/10 dark:bg-slate-900/55"
            >
              <div className="flex gap-1 text-amber-500 dark:text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-4 fill-current"
                    aria-hidden
                  />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                <span className="text-foreground">“</span>
                {t.quote}
                <span className="text-foreground">”</span>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5 dark:border-white/10">
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary dark:bg-cyan-400/15 dark:text-cyan-200"
                  aria-hidden
                >
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {t.name}
                  </p>
                  <p className="truncate text-xs text-primary dark:text-cyan-300">
                    {t.handle}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-border bg-muted/40 px-6 py-8 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-center sm:gap-10">
            <div className="flex items-center gap-2">
              <LineChart className="size-8 text-primary dark:text-cyan-300" />
              <div className="text-left">
                <p className="text-2xl font-extrabold text-foreground">4.9★</p>
                <p className="text-xs text-muted-foreground">
                  Avg. from weekly creators
                </p>
              </div>
            </div>
            <div className="hidden h-10 w-px bg-border sm:block dark:bg-white/15" />
            <div className="text-sm text-muted-foreground sm:max-w-xs sm:text-left">
              Teams report cutting manual trend chasing by over an hour per upload
              cycle once hooks and scripts live in the same place.
            </div>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="relative z-20 mx-auto w-full max-w-3xl scroll-mt-24 px-6 py-16"
      >
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary dark:text-cyan-200">
            FAQ
          </span>
          <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Questions, answered
          </h2>
        </div>
        <div className="mt-10 flex flex-col gap-3">
          {faqItems.map((item) => (
            <details
              key={item.q}
              className="group fluid-transition rounded-2xl border border-border bg-card/80 px-5 py-1 open:border-primary/25 open:bg-card dark:border-white/10 dark:bg-slate-900/45 dark:open:border-cyan-400/25"
            >
              <summary className="cursor-pointer list-none py-4 pr-2 text-left text-sm font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-3">
                  {item.q}
                  <span className="mt-0.5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="border-t border-border pb-4 pt-0 text-sm leading-relaxed text-muted-foreground dark:border-white/10">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="relative z-20 mx-auto w-full max-w-6xl px-6 pb-8">
        <div className="rounded-3xl border border-border bg-card/85 p-8 shadow-[0_16px_42px_rgba(34,39,47,0.08)] backdrop-blur-sm dark:border-cyan-300/20 dark:bg-gradient-to-br dark:from-slate-950/90 dark:via-slate-900/90 dark:to-indigo-950/70 dark:shadow-[0_0_48px_rgba(59,130,246,0.18)] sm:p-10">
          <p className="text-center text-2xl font-semibold text-foreground dark:text-slate-100 sm:text-3xl">
            Join 1,000+ creators discovering viral trends
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground dark:text-slate-300 sm:text-base">
            Get product updates, early feature access, and weekly trend insights
            straight to your inbox.
          </p>
          <EmailWaitlistForm />
        </div>
      </section>

      <footer className="relative z-20 border-t border-border bg-muted/30 dark:border-white/10 dark:bg-slate-950/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-14 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="text-sm font-semibold tracking-[0.18em] text-foreground">
              Trend Engine
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Trend intelligence and AI-assisted ideas for creators who cannot afford
              to miss the moment.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:flex sm:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Product
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-sm">
                <li>
                  <Link
                    href="#features"
                    className="fluid-transition text-muted-foreground hover:text-foreground"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#how-it-works"
                    className="fluid-transition text-muted-foreground hover:text-foreground"
                  >
                    How it works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="fluid-transition text-muted-foreground hover:text-foreground"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/trending"
                    className="fluid-transition text-muted-foreground hover:text-foreground"
                  >
                    Trending hub
                  </Link>
                </li>
                <li>
                  <Link
                    href="#faq"
                    className="fluid-transition text-muted-foreground hover:text-foreground"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Social
              </p>
              <ul className="mt-4 flex flex-col gap-3 text-sm">
                <li>
                  <a
                    href="https://x.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fluid-transition inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="size-4" />
                    X
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fluid-transition inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Youtube className="size-4" />
                    YouTube
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fluid-transition inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Instagram className="size-4" />
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-border py-6 dark:border-white/10">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Trend Engine. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
