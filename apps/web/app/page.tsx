import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  CreditCard,
  Film,
  ListChecks,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { ConversionEventTracker } from "@/components/analytics/conversion-event-tracker";
import { EmailWaitlistForm } from "@/components/email-waitlist-form";
import { CreatorCheckoutForm } from "@/components/landing/creator-checkout-form";
import { MobileInstallButton } from "@/components/landing/mobile-install-button";
import { ConversionLink } from "@/components/seo/conversion-link";
import { FreeResourceWidget } from "@/components/seo/free-resource-widget";

export const metadata: Metadata = {
  title:
    "AI Content Idea Generator for TikTok, Instagram, YouTube Shorts, and Pinterest",
  description:
    "Use TrendBoard to find live trends, create short post ideas, generate hooks and scripts, and plan content for TikTok, Instagram, YouTube Shorts, and Pinterest.",
  alternates: {
    canonical: "/",
  },
};

const workflowSteps = [
  {
    icon: Search,
    title: "Type your niche",
    body: "Fitness coach, real estate agent, beauty creator, gaming channel, or anything else.",
  },
  {
    icon: Sparkles,
    title: "Scan live trends",
    body: "TrendBoard checks short-form, search, social, news, and community signals in one run.",
  },
  {
    icon: Film,
    title: "Get post ideas",
    body: "Use the ideas as-is, or turn the best ones into hooks, hashtags, scripts, and calendar notes.",
  },
] as const;

const productOutputs = [
  "Trend ideas matched to your niche",
  "Hooks people can understand fast",
  "Short scripts and talking points",
  "Hashtags and source links",
  "Saved ideas and content calendar",
] as const;

const simpleProof = [
  {
    icon: Play,
    title: "Post faster",
    body: "Stop staring at a blank screen. Start with a ready idea.",
  },
  {
    icon: Bookmark,
    title: "Keep the good ideas",
    body: "Save winners so you can come back when it is time to film.",
  },
  {
    icon: CalendarDays,
    title: "Plan the week",
    body: "Move ideas into a simple calendar instead of rebuilding your plan every day.",
  },
  {
    icon: ShieldCheck,
    title: "Stay in control",
    body: "Credits keep heavy AI and trend scans fair, predictable, and harder to abuse.",
  },
] as const;

const faqItems = [
  {
    q: "What does TrendBoard do?",
    a: "You enter a niche. TrendBoard finds current content angles and turns them into creator-ready post ideas.",
  },
  {
    q: "Do I need to understand AI tools?",
    a: "No. Pick a niche, run a scan, open an idea, and use the buttons for hooks, hashtags, scripts, saving, and scheduling.",
  },
  {
    q: "Which platforms does it watch?",
    a: "TrendBoard combines signals from TikTok, Instagram, YouTube Shorts, Pinterest, Reddit, search, news, and other social sources when available.",
  },
  {
    q: "Why are there credits?",
    a: "Live trend scans and AI writing cost money to run. Credits make usage clear for creators and protect the app from abuse.",
  },
] as const;

const homepageFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/92 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/92 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-[0.08em] text-foreground hover:text-primary sm:tracking-[0.16em]"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground dark:bg-cyan-400 dark:text-slate-950">
            T
          </span>
          <span className="truncate">TrendBoard</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm md:flex">
          <Link
            href="#how-it-works"
            className="font-medium text-muted-foreground hover:text-foreground"
          >
            How it works
          </Link>
          <Link
            href="#free-preview"
            className="font-medium text-muted-foreground hover:text-foreground"
          >
            Free preview
          </Link>
          <Link
            href="/pricing"
            className="font-medium text-muted-foreground hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="font-medium text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
          >
            Open app
          </Link>
        </nav>
        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <MobileInstallButton />
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-3 text-sm font-bold text-primary-foreground shadow-sm dark:bg-cyan-400 dark:text-slate-950"
          >
            Open
          </Link>
        </div>
      </div>
    </header>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary dark:text-cyan-200">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{body}</p>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageFaqJsonLd) }}
      />
      <ConversionEventTracker
        event="landing_page_viewed"
        context={{ page: "home" }}
      />
      <Header />

      <section className="mx-auto flex w-full max-w-[100vw] flex-col items-center justify-center overflow-hidden px-4 pb-12 pt-10 text-center sm:max-w-6xl sm:px-6 sm:pb-16 sm:pt-16">
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-primary dark:border-white/10 dark:bg-slate-950 dark:text-cyan-200">
          <WandSparkles className="size-4" />
          For content creators
        </p>

        <h1 className="mt-6 w-[calc(100vw_-_2rem)] max-w-4xl text-balance text-4xl font-extrabold leading-[1.06] tracking-tight sm:w-full sm:text-6xl">
          Find trends. Turn them into posts.
        </h1>

        <p className="mt-5 w-[calc(100vw_-_2rem)] max-w-2xl text-base leading-7 text-muted-foreground sm:w-full sm:text-lg">
          TrendBoard helps you choose what to make next. Type your niche, scan
          live platforms, and get clear ideas with hooks, scripts, hashtags,
          source links, and calendar notes.
        </p>

        <div className="mt-7 grid w-[calc(100vw_-_2rem)] max-w-md gap-3 sm:w-full sm:max-w-none sm:grid-cols-[auto_auto_auto] sm:justify-center">
          <ConversionLink
            href="/dashboard"
            event="landing_cta_clicked"
            eventContext={{
              page: "home",
              destination: "/dashboard",
              placement: "hero_open_app",
            }}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
          >
            Open the app
            <ArrowRight className="size-4" />
          </ConversionLink>
          <ConversionLink
            href="#free-preview"
            event="landing_cta_clicked"
            eventContext={{
              page: "home",
              destination: "#free-preview",
              placement: "hero_free_preview",
            }}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border bg-card px-7 text-sm font-semibold text-foreground hover:bg-muted dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-900"
          >
            Try free ideas
          </ConversionLink>
          <CreatorCheckoutForm
            placement="home_hero_paid"
            label="Start Creator"
            className="w-full sm:w-auto"
            buttonClassName="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-7 text-sm font-bold text-primary hover:bg-primary/15 dark:border-cyan-300/25 dark:bg-cyan-400/10 dark:text-cyan-100 dark:hover:bg-cyan-400/15"
          />
        </div>

        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CreditCard className="size-4" />
            Free preview
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-4" />
            Credit-protected usage
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="size-4" />
            Save and schedule ideas
          </span>
        </p>

      </section>

      <section
        id="how-it-works"
        className="border-y border-border bg-card/45 px-4 py-16 dark:border-white/10 dark:bg-slate-950/35 sm:px-6"
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="How it works"
            title="Three simple steps"
            body="The app is built so a creator can go from blank page to a useful post idea without learning a complicated workflow."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-2xl border border-border bg-background p-5 dark:border-white/10 dark:bg-slate-900/65"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-cyan-400/10 dark:text-cyan-200">
                    <step.icon className="size-5" />
                  </span>
                  <span className="text-sm font-black text-muted-foreground">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary dark:text-cyan-200">
            What you get
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            A content creation tool, not a pile of random ideas
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            The goal is simple: help creators decide what to post, why it might
            work, and how to turn it into a short video or social post.
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 text-sm font-bold text-foreground hover:bg-muted dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-900"
          >
            See simple pricing
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-3">
          {productOutputs.map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 dark:border-white/10 dark:bg-slate-950/70"
            >
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-cyan-400/10 dark:text-cyan-200">
                <Check className="size-4" strokeWidth={3} />
              </span>
              <p className="text-sm font-semibold leading-6">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
        <FreeResourceWidget kind="hooks" defaultTopic="fitness creators" />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Creator workflow"
          title="Built for making content"
          body="Each feature supports the real job: finding an angle, filming it, and keeping your publishing plan organized."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {simpleProof.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-border bg-card p-5 dark:border-white/10 dark:bg-slate-950/70"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-cyan-400/10 dark:text-cyan-200">
                <item.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/45 px-4 py-16 dark:border-white/10 dark:bg-slate-950/35 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary dark:text-cyan-200">
              Paid plan
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Creator is for people who post every week
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Creator is $19.99/mo for about 20 full trend scans, plus room to
              expand ideas into hooks, hashtags, and scripts. Free is still
              available when you want to test the workflow first.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <CreatorCheckoutForm
              placement="home_paid_section"
              label="Start Creator checkout"
              buttonClassName="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            />
            <Link
              href="/pricing"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-border bg-background px-6 text-sm font-bold text-foreground hover:bg-muted dark:border-white/10 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              Compare plans
            </Link>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6"
      >
        <SectionHeading
          eyebrow="FAQ"
          title="Quick answers"
          body="Short answers for creators who just want to know whether the tool can help them post faster."
        />
        <div className="mt-8 space-y-3">
          {faqItems.map((item) => (
            <details
              key={item.q}
              className="rounded-2xl border border-border bg-card px-5 py-2 dark:border-white/10 dark:bg-slate-950/70"
            >
              <summary className="cursor-pointer py-3 text-sm font-bold">
                {item.q}
              </summary>
              <p className="border-t border-border pb-4 pt-3 text-sm leading-6 text-muted-foreground dark:border-white/10">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-6 text-center dark:border-white/10 dark:bg-slate-950/70 sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight">
            Get creator updates
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Join the list for product updates, new platform support, and useful
            trend research notes.
          </p>
          <EmailWaitlistForm />
        </div>
      </section>

      <footer className="border-t border-border bg-muted/30 px-4 py-8 dark:border-white/10 dark:bg-slate-950/45 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-foreground">TrendBoard</p>
          <nav className="flex flex-wrap gap-4">
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/support" className="hover:text-foreground">
              Support
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
