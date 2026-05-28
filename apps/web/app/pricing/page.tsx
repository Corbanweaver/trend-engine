import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CreditCard,
  LineChart,
  LockKeyhole,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";

import { AffiliateCheckoutFields } from "@/components/affiliate-checkout-fields";
import { ResumeCheckoutForm } from "@/components/resume-checkout-form";
import { CREDIT_COSTS, CREDIT_LIMITS } from "@/lib/credits";

export const metadata: Metadata = {
  title: "Pricing for Live Creator Trend Scans",
  description:
    "Choose a TrendBoard plan for live trend scans across TikTok, Instagram, X, Bluesky, Threads, Pinterest, YouTube Shorts, Reddit, search, and news.",
};

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Try the essentials and explore trends.",
    bestFor: "Testing the workflow",
    outcome: "1 live trend scan to see whether the ideas fit your niche.",
    featured: false,
    features: [
      `${CREDIT_LIMITS.free} monthly credits`,
      "1 full trend analysis",
      "Basic niches only",
      "Explore before upgrading",
    ],
    ctaHref: "/signup",
    planKey: "free",
    ctaLabel: "Try for free",
    ctaVariant: "outline" as const,
  },
  {
    name: "Creator",
    price: "$19.99",
    period: "/mo",
    description: "Everything you need to ship ideas consistently.",
    bestFor: "Solo creators posting weekly",
    outcome:
      "Roughly 20 full scans each month, plus room for hooks, scripts, and hashtags.",
    featured: true,
    popularLabel: "Most Popular",
    features: [
      `${CREDIT_LIMITS.creator} monthly credits`,
      "About 20 full trend analyses",
      "Full cross-platform source coverage",
      "All niches",
      "Save and organize ideas",
      "Organic source thumbnails",
    ],
    ctaHref: "/api/stripe/checkout",
    planKey: "creator",
    ctaLabel: "Start Creator",
    ctaVariant: "primary" as const,
  },
  {
    name: "Pro",
    price: "$49.99",
    period: "/mo",
    description: "Maximum throughput for teams and power creators.",
    bestFor: "Agencies, teams, and daily creators",
    outcome:
      "Roughly 60 full scans each month for testing more niches and angles.",
    featured: false,
    features: [
      `${CREDIT_LIMITS.pro.toLocaleString()} monthly credits`,
      "About 60 full trend analyses",
      "Full cross-platform source coverage",
      "All niches",
      "Saved ideas",
      "Organic source thumbnails",
      "Priority trend processing",
      "Early access to new features",
    ],
    ctaHref: "/api/stripe/checkout",
    planKey: "pro",
    ctaLabel: "Start Pro",
    ctaVariant: "outline" as const,
  },
];

const buyerSignals = [
  {
    icon: LineChart,
    title: "Pay for better decisions",
    body: "Each scan ranks live momentum so creators can spend less time guessing what to film next.",
  },
  {
    icon: Sparkles,
    title: "Expand only the winners",
    body: "Idea cards stay short first. Hooks, hashtags, and scripts only use credits when you ask for them.",
  },
  {
    icon: Timer,
    title: "Move faster every week",
    body: "Save source links, hashtags, hooks, and calendar notes together so research does not disappear.",
  },
] as const;

const creditExamples = [
  {
    label: "Full trend scan",
    cost: CREDIT_COSTS.analysis,
    note: "Finds current topics and creates idea cards for one niche.",
  },
  {
    label: "Hook variations",
    cost: CREDIT_COSTS.hooks,
    note: "Adds extra openings only for the ideas worth testing.",
  },
  {
    label: "Full script",
    cost: CREDIT_COSTS.fullScript,
    note: "Turns one chosen idea into a fuller spoken outline.",
  },
] as const;

const trustChecks = [
  { icon: CreditCard, label: "Secure Stripe checkout" },
  { icon: BadgeCheck, label: "Cancel through billing anytime" },
  { icon: LockKeyhole, label: "Credits prevent overuse and keep costs fair" },
  { icon: Zap, label: "Built around fast creator workflows" },
] as const;

const sourceCoverageGroups = [
  {
    title: "Short-form platforms",
    sources: ["TikTok", "Instagram Reels", "YouTube Shorts", "Threads"],
    note: "Catch fast-moving creator formats before they become generic.",
  },
  {
    title: "Social conversation",
    sources: ["X", "Bluesky", "Reddit", "Hacker News"],
    note: "See what people are arguing about, asking, and repeating.",
  },
  {
    title: "Search and discovery",
    sources: ["Pinterest", "Google Trends", "Google News", "Web search"],
    note: "Balance viral signals with searchable, evergreen demand.",
  },
] as const;

const paidScanProof = [
  "Ranks topics by momentum, freshness, engagement, and cross-platform evidence.",
  "Keeps source links attached so creators can verify the angle before filming.",
  "Turns research into idea cards, hooks, hashtags, scripts, and saved calendar notes.",
] as const;

const pricingFaqItems = [
  {
    q: "Can I try TrendBoard before paying?",
    a: "Yes. The free plan and public resources let you explore the workflow before upgrading to higher monthly credits.",
  },
  {
    q: "Why does TrendBoard use credits?",
    a: "Credits keep heavier trend scans predictable, fair, and harder to abuse while still giving paid creators enough room to work.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel through billing management, and paid access continues through the current billing period.",
  },
];

const pricingFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: pricingFaqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

function PricingHeader() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-7">
      <Link
        href="/"
        className="fluid-transition text-sm font-semibold tracking-[0.18em] text-foreground hover:text-primary"
      >
        TrendBoard
      </Link>
      <nav className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:w-auto sm:justify-end">
        <Link
          href="/trending"
          className="fluid-transition font-medium text-muted-foreground hover:text-foreground"
        >
          Trending
        </Link>
        <Link
          href="/pricing"
          className="fluid-transition font-medium text-primary hover:text-foreground"
        >
          Pricing
        </Link>
        <Link
          href="/about"
          className="fluid-transition hidden text-muted-foreground hover:text-foreground sm:inline"
        >
          About
        </Link>
        <Link
          href="/login"
          className="fluid-transition hidden text-muted-foreground hover:text-foreground sm:inline"
        >
          Sign in
        </Link>
        <Link
          href="/dashboard"
          className="fluid-transition glass-surface rounded-xl border border-border bg-card px-4 py-2 font-semibold text-foreground hover:bg-muted"
        >
          Open app
        </Link>
      </nav>
    </header>
  );
}

type PricingPageProps = {
  searchParams?: Promise<{
    checkout?: string;
    plan?: string;
    reason?: string;
    request_id?: string;
  }>;
};

function checkoutErrorMessage(reason: string | undefined) {
  switch (reason) {
    case "stripe-auth":
      return "Stripe checkout could not start because the live Stripe secret key is invalid or not loaded in the web app.";
    case "stripe-permission":
      return "Stripe checkout could not start because the Stripe key does not have permission to create Checkout Sessions.";
    case "missing-price":
      return "Stripe checkout could not start because one of the configured live price IDs could not be found.";
    case "missing-customer":
      return "Stripe checkout could not start because the saved Stripe customer could not be found.";
    case "stripe-account":
      return "Stripe checkout could not start because the Stripe account is not fully ready for live charges.";
    case "invalid-url":
      return "Stripe checkout could not start because a redirect URL is invalid.";
    case "invalid-request":
      return "Stripe checkout could not start because Stripe rejected the checkout session request.";
    case "request-too-large":
      return "Checkout could not start because the submitted form was too large. Please refresh the page and try again.";
    case "unsupported-form":
      return "Checkout could not start because the browser sent an unsupported form format. Please refresh the page and try again.";
    case "missing-resource":
      return "Stripe checkout could not start because a saved Stripe resource could not be found.";
    case "stripe-error":
      return "Stripe checkout could not start because Stripe returned an error.";
    case "rate-limited":
      return "Too many checkout attempts were started in a short period. Please wait a few minutes and try again.";
    case "invalid-origin":
      return "Checkout must be started from the TrendBoard website. Please refresh and try again.";
    default:
      return "Stripe checkout could not start. Make sure you are signed in and try again, or contact support if it keeps happening.";
  }
}

function getPaidPlan(plan: string | undefined) {
  const paidPlan = plans.find(
    (item) => item.planKey === plan && item.planKey !== "free",
  );
  return paidPlan as
    | (typeof plans)[number] & { planKey: "creator" | "pro" }
    | undefined;
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const resolvedSearchParams = await searchParams;
  const checkoutStatus = resolvedSearchParams?.checkout;
  const resumeCheckoutPlan = getPaidPlan(resolvedSearchParams?.plan);
  const checkoutReason = resolvedSearchParams?.reason;
  const stripeRequestId = resolvedSearchParams?.request_id;
  const isCheckoutSuccess = checkoutStatus === "success";
  const isCheckoutCancelled = checkoutStatus === "cancelled";
  const isCheckoutError = checkoutStatus === "error";
  const isCheckoutConfigurationError = checkoutStatus === "configuration";
  const isChoosePlanNotice = checkoutStatus === "choose-plan";
  const shouldResumeCheckout = isChoosePlanNotice && resumeCheckoutPlan;
  const shouldRetryCancelledCheckout =
    isCheckoutCancelled && resumeCheckoutPlan;

  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqJsonLd) }}
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-6rem] h-80 w-80 animate-pulse rounded-full bg-primary/10 blur-3xl dark:bg-fuchsia-500/25" />
        <div className="absolute right-[-5rem] top-10 h-96 w-96 animate-pulse rounded-full bg-secondary/70 blur-3xl dark:bg-cyan-500/20" />
        <div className="absolute bottom-[-7rem] left-1/3 h-96 w-96 animate-pulse rounded-full bg-primary/5 blur-3xl dark:bg-indigo-500/20" />
      </div>

      <PricingHeader />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-36 pt-6 sm:pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full border border-border bg-card px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary dark:border-white/20 dark:bg-white/10 dark:text-cyan-200">
            Pricing
          </span>
          <h1 className="mt-6 text-balance bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-3xl font-extrabold text-transparent sm:text-5xl dark:from-white dark:via-cyan-100 dark:to-fuchsia-200">
            Plans that scale with your creativity
          </h1>
          <p className="mx-auto mt-4 max-w-xs text-base leading-relaxed text-muted-foreground sm:max-w-xl sm:text-lg">
            Pick the tier that matches your workflow. Credits reset monthly and
            keep heavier trend scans fair for everyone.
          </p>
          <div className="mx-auto mt-7 flex w-full max-w-72 flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row">
            <form
              action="/api/stripe/checkout"
              method="POST"
              className="w-full sm:w-auto"
            >
              <input type="hidden" name="plan" value="creator" />
              <AffiliateCheckoutFields />
              <button
                type="submit"
                className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-[0_12px_24px_rgba(54,95,125,0.2)] transition hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 sm:w-auto"
              >
                Start Creator checkout
                <ArrowRight className="size-4" />
              </button>
            </form>
            <Link
              href="#plans"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition hover:bg-muted dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-900 sm:w-auto"
            >
              Compare all plans
            </Link>
          </div>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-muted-foreground sm:max-w-sm">
            Creator is $19.99/mo for about 20 full trend analyses.
          </p>
          <div className="mx-auto mt-6 flex max-w-xs flex-wrap justify-center gap-2 sm:max-w-none">
            {trustChecks.map((item) => (
              <span
                key={item.label}
                className="inline-flex max-w-full items-center gap-2 whitespace-normal rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs font-semibold text-muted-foreground shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                <item.icon className="size-3.5 shrink-0 text-primary dark:text-cyan-300" />
                <span className="min-w-0 break-words">{item.label}</span>
              </span>
            ))}
          </div>
        </div>

        {isCheckoutSuccess ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-5 py-4 text-center text-sm text-emerald-200">
            Checkout complete. Your subscription is now active.
          </div>
        ) : null}

        {isCheckoutCancelled ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-amber-400/40 bg-amber-500/10 px-5 py-4 text-center text-sm text-amber-100">
            {shouldRetryCancelledCheckout ? (
              <>
                <p className="text-balance leading-6">
                  Checkout canceled. No charge was made. You can reopen{" "}
                  {resumeCheckoutPlan.name} checkout when you are ready.
                </p>
                <ResumeCheckoutForm
                  plan={resumeCheckoutPlan.planKey}
                  planName={resumeCheckoutPlan.name}
                  autoSubmit={false}
                />
              </>
            ) : (
              "Checkout canceled. No charge was made."
            )}
          </div>
        ) : null}

        {isCheckoutError ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-red-400/40 bg-red-500/10 px-5 py-4 text-center text-sm text-red-100">
            {checkoutErrorMessage(checkoutReason)}
            {stripeRequestId ? (
              <span className="mt-2 block text-xs text-red-100/80">
                Stripe request ID: {stripeRequestId}
              </span>
            ) : null}
          </div>
        ) : null}

        {isCheckoutConfigurationError ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-red-400/40 bg-red-500/10 px-5 py-4 text-center text-sm text-red-100">
            Stripe checkout is not fully configured yet. Please contact support
            if this keeps happening.
          </div>
        ) : null}

        {isChoosePlanNotice ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-amber-400/40 bg-amber-500/10 px-5 py-4 text-center text-sm text-amber-100">
            {shouldResumeCheckout ? (
              <>
                <p className="text-balance leading-6">
                  Sign-in complete. Continuing to {resumeCheckoutPlan.name}{" "}
                  checkout.
                </p>
                <ResumeCheckoutForm
                  plan={resumeCheckoutPlan.planKey}
                  planName={resumeCheckoutPlan.name}
                />
              </>
            ) : (
              "Choose a plan below to start checkout."
            )}
          </div>
        ) : null}

        <section className="mx-auto mt-12 max-w-5xl rounded-3xl border border-primary/20 bg-card/90 p-6 shadow-sm dark:border-cyan-300/25 dark:bg-slate-950/70 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary dark:text-cyan-200">
                Why paid creators upgrade
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground dark:text-white">
                One paid scan checks the places your next idea can spread
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground dark:text-slate-400">
                Free is for testing the workflow. Creator and Pro are built for
                repeat research, source-backed decisions, and faster publishing.
              </p>
              <ul className="mt-5 space-y-3 text-sm text-foreground dark:text-slate-200">
                {paidScanProof.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-cyan-500/15 dark:text-cyan-300">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="#plans"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
              >
                Compare plans
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid gap-3">
              {sourceCoverageGroups.map((group) => (
                <div
                  key={group.title}
                  className="rounded-2xl border border-border bg-background p-4 dark:border-white/10 dark:bg-slate-900/70"
                >
                  <h3 className="text-sm font-bold text-foreground dark:text-white">
                    {group.title}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.sources.map((source) => (
                      <span
                        key={source}
                        className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground dark:text-slate-400">
                    {group.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div
          id="plans"
          className="mx-auto mt-16 grid max-w-5xl scroll-mt-24 gap-8 lg:mx-auto lg:grid-cols-3 lg:items-stretch"
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`fluid-transition relative flex flex-col rounded-3xl border p-8 shadow-xl ${
                resumeCheckoutPlan?.planKey === plan.planKey
                  ? "ring-2 ring-primary/55 ring-offset-2 ring-offset-background dark:ring-cyan-300/70"
                  : ""
              } ${
                plan.featured
                  ? "z-[1] border-primary/30 bg-card shadow-[0_18px_44px_-20px_rgba(54,95,125,0.35)] lg:-translate-y-2 lg:scale-[1.02] dark:border-cyan-400/40 dark:bg-slate-950/80 dark:shadow-[0_0_60px_-12px_rgba(34,211,238,0.35)]"
                  : "glass-surface border-border bg-card backdrop-blur-sm hover:border-primary/25 dark:border-white/10 dark:bg-slate-950/50 dark:hover:border-white/20"
              }`}
            >
              {plan.featured && plan.popularLabel ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-lg dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-500 dark:text-slate-950">
                    {plan.popularLabel}
                  </span>
                </div>
              ) : null}

              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground dark:text-white">
                  {plan.name}
                </h2>
                <p className="mt-2 min-h-[3rem] text-sm leading-relaxed text-muted-foreground dark:text-slate-400">
                  {plan.description}
                </p>
                <div className="mt-4 rounded-2xl border border-border bg-muted/45 p-3 text-sm dark:border-white/10 dark:bg-white/[0.04]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-slate-400">
                    Best for
                  </p>
                  <p className="mt-1 font-semibold text-foreground dark:text-white">
                    {plan.bestFor}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground dark:text-slate-400">
                    {plan.outcome}
                  </p>
                </div>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-foreground dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground dark:text-slate-400">
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="mb-8 flex flex-1 flex-col gap-3 text-sm text-foreground dark:text-slate-200">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-cyan-500/15 dark:text-cyan-300">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {plan.planKey === "free" ? (
                <Link
                  href={plan.ctaHref}
                  className={
                    plan.ctaVariant === "primary"
                      ? "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-center text-base font-bold text-primary-foreground shadow-[0_12px_24px_rgba(54,95,125,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_16px_32px_rgba(54,95,125,0.24)] dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-500 dark:text-slate-950 dark:shadow-[0_0_32px_rgba(56,189,248,0.4)] dark:hover:shadow-[0_0_44px_rgba(56,189,248,0.55)]"
                      : "inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-3.5 text-center text-base font-semibold text-foreground transition-all duration-200 hover:border-primary/25 hover:bg-muted dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:border-white/35 dark:hover:bg-white/10"
                  }
                >
                  {plan.ctaLabel}
                  <ArrowRight className="size-4" />
                </Link>
              ) : (
                <form action={plan.ctaHref} method="POST">
                  <input type="hidden" name="plan" value={plan.planKey} />
                  <AffiliateCheckoutFields />
                  <button
                    type="submit"
                    className={
                      plan.ctaVariant === "primary"
                        ? "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-center text-base font-bold text-primary-foreground shadow-[0_12px_24px_rgba(54,95,125,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_16px_32px_rgba(54,95,125,0.24)] dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-500 dark:text-slate-950 dark:shadow-[0_0_32px_rgba(56,189,248,0.4)] dark:hover:shadow-[0_0_44px_rgba(56,189,248,0.55)]"
                        : "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-3.5 text-center text-base font-semibold text-foreground transition-all duration-200 hover:border-primary/25 hover:bg-muted dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:border-white/35 dark:hover:bg-white/10"
                    }
                  >
                    {resumeCheckoutPlan?.planKey === plan.planKey
                      ? `Continue ${plan.name}`
                      : plan.ctaLabel}
                    <ArrowRight className="size-4" />
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>

        <section className="mx-auto mt-12 grid max-w-5xl gap-4 lg:grid-cols-3">
          {buyerSignals.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-border bg-card/85 p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/55"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 dark:border-cyan-300/25 dark:bg-cyan-400/10">
                <item.icon className="size-5 text-primary dark:text-cyan-300" />
              </div>
              <h2 className="mt-4 text-base font-bold text-foreground dark:text-white">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-slate-400">
                {item.body}
              </p>
            </div>
          ))}
        </section>

        <section className="mx-auto mt-10 max-w-5xl rounded-3xl border border-border bg-card/90 p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/70 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary dark:text-cyan-200">
                How credits work
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground dark:text-white">
                Predictable for customers, safer for your costs
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground dark:text-slate-400">
                Trend scans are the expensive part. Credits let creators buy a
                clear monthly workflow while keeping the app protected from
                runaway usage.
              </p>
            </div>
            <div className="grid gap-3">
              {creditExamples.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-background p-4 dark:border-white/10 dark:bg-slate-900/70"
                >
                  <div>
                    <p className="font-semibold text-foreground dark:text-white">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground dark:text-slate-400">
                      {item.note}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-100">
                    {item.cost} credits
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary dark:text-cyan-200">
              Pricing FAQ
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
              Pick the plan that fits your pace
            </h2>
          </div>
          <div className="mt-8 space-y-3">
            {pricingFaqItems.map((item) => (
              <details
                key={item.q}
                className="rounded-2xl border border-border bg-card px-5 py-2 dark:border-white/10 dark:bg-slate-950/55"
              >
                <summary className="cursor-pointer py-3 text-sm font-semibold">
                  {item.q}
                </summary>
                <p className="border-t border-border pb-4 pt-3 text-sm leading-6 text-muted-foreground dark:border-white/10">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <nav className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/support" className="hover:text-foreground">
            Support
          </Link>
          <Link href="/status" className="hover:text-foreground">
            Status
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
        </nav>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/94 py-3 shadow-[0_-12px_32px_rgba(15,23,42,0.14)] backdrop-blur dark:border-white/10 dark:bg-slate-950/94 sm:hidden">
        <div className="mx-auto max-w-sm" style={{ width: "calc(100vw - 24px)" }}>
          <form action="/api/stripe/checkout" method="POST">
            <input type="hidden" name="plan" value="creator" />
            <AffiliateCheckoutFields />
            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold text-primary-foreground dark:bg-cyan-400 dark:text-slate-950"
            >
              Start Creator
              <ArrowRight className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
