import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { CREDIT_LIMITS } from "@/lib/credits";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose a Content Buddy plan for trend analyses, niches, saved ideas, and AI thumbnails.",
};

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Try the essentials and explore trends.",
    featured: false,
    features: [
      `${CREDIT_LIMITS.free} monthly credits`,
      "1 full AI-image analysis",
      "Basic niches only",
      "Explore before upgrading",
    ],
    ctaHref: "/signup",
    planKey: "free",
    ctaVariant: "outline" as const,
  },
  {
    name: "Creator",
    price: "$19.99",
    period: "/mo",
    description: "Everything you need to ship ideas consistently.",
    featured: true,
    popularLabel: "Most Popular",
    features: [
      `${CREDIT_LIMITS.creator} monthly credits`,
      "About 20 full AI-image analyses",
      "All niches",
      "Save and organize ideas",
      "AI thumbnails",
    ],
    ctaHref: "/api/stripe/checkout",
    planKey: "creator",
    ctaVariant: "primary" as const,
  },
  {
    name: "Pro",
    price: "$49.99",
    period: "/mo",
    description: "Maximum throughput for teams and power creators.",
    featured: false,
    features: [
      `${CREDIT_LIMITS.pro.toLocaleString()} monthly credits`,
      "About 60 full AI-image analyses",
      "All niches",
      "Saved ideas",
      "AI thumbnails",
      "Priority trend processing",
      "Early access to new features",
    ],
    ctaHref: "/api/stripe/checkout",
    planKey: "pro",
    ctaVariant: "outline" as const,
  },
];

function PricingHeader() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7">
      <Link
        href="/"
        className="fluid-transition text-sm font-semibold tracking-[0.18em] text-foreground hover:text-primary"
      >
        Content Buddy
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
          className="fluid-transition font-medium text-primary hover:text-foreground"
        >
          Pricing
        </Link>
        <Link
          href="/about"
          className="fluid-transition text-muted-foreground hover:text-foreground"
        >
          About
        </Link>
        <Link
          href="/login"
          className="fluid-transition text-muted-foreground hover:text-foreground"
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
    case "missing-resource":
      return "Stripe checkout could not start because a saved Stripe resource could not be found.";
    case "stripe-error":
      return "Stripe checkout could not start because Stripe returned an error.";
    default:
      return "Stripe checkout could not start. Make sure you are signed in and try again, or contact support if it keeps happening.";
  }
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const resolvedSearchParams = await searchParams;
  const checkoutStatus = resolvedSearchParams?.checkout;
  const checkoutReason = resolvedSearchParams?.reason;
  const stripeRequestId = resolvedSearchParams?.request_id;
  const isCheckoutSuccess = checkoutStatus === "success";
  const isCheckoutCancelled = checkoutStatus === "cancelled";
  const isCheckoutError = checkoutStatus === "error";
  const isCheckoutConfigurationError = checkoutStatus === "configuration";
  const isChoosePlanNotice = checkoutStatus === "choose-plan";

  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-6rem] h-80 w-80 animate-pulse rounded-full bg-primary/10 blur-3xl dark:bg-fuchsia-500/25" />
        <div className="absolute right-[-5rem] top-10 h-96 w-96 animate-pulse rounded-full bg-secondary/70 blur-3xl dark:bg-cyan-500/20" />
        <div className="absolute bottom-[-7rem] left-1/3 h-96 w-96 animate-pulse rounded-full bg-primary/5 blur-3xl dark:bg-indigo-500/20" />
      </div>

      <PricingHeader />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full border border-border bg-card px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary dark:border-white/20 dark:bg-white/10 dark:text-cyan-200">
            Pricing
          </span>
          <h1 className="mt-6 text-balance bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl dark:from-white dark:via-cyan-100 dark:to-fuchsia-200">
            Plans that scale with your creativity
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Pick the tier that matches your workflow. Credits reset monthly and
            keep AI image generation fair for everyone.
          </p>
        </div>

        {isCheckoutSuccess ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-5 py-4 text-center text-sm text-emerald-200">
            Checkout complete. Your subscription is now active.
          </div>
        ) : null}

        {isCheckoutCancelled ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-amber-400/40 bg-amber-500/10 px-5 py-4 text-center text-sm text-amber-100">
            Checkout canceled. No charge was made.
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
            Choose a plan below to start checkout.
          </div>
        ) : null}

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:mx-auto lg:grid-cols-3 lg:items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`fluid-transition relative flex flex-col rounded-3xl border p-8 shadow-xl ${
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
                      ? "inline-flex w-full items-center justify-center rounded-2xl bg-primary px-6 py-3.5 text-center text-base font-bold text-primary-foreground shadow-[0_12px_24px_rgba(54,95,125,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_16px_32px_rgba(54,95,125,0.24)] dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-500 dark:text-slate-950 dark:shadow-[0_0_32px_rgba(56,189,248,0.4)] dark:hover:shadow-[0_0_44px_rgba(56,189,248,0.55)]"
                      : "inline-flex w-full items-center justify-center rounded-2xl border border-border bg-card px-6 py-3.5 text-center text-base font-semibold text-foreground transition-all duration-200 hover:border-primary/25 hover:bg-muted dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:border-white/35 dark:hover:bg-white/10"
                  }
                >
                  Get Started
                </Link>
              ) : (
                <form action={plan.ctaHref} method="POST">
                  <input type="hidden" name="plan" value={plan.planKey} />
                  <button
                    type="submit"
                    className={
                      plan.ctaVariant === "primary"
                        ? "inline-flex w-full cursor-pointer items-center justify-center rounded-2xl bg-primary px-6 py-3.5 text-center text-base font-bold text-primary-foreground shadow-[0_12px_24px_rgba(54,95,125,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_16px_32px_rgba(54,95,125,0.24)] dark:bg-gradient-to-r dark:from-cyan-400 dark:to-indigo-500 dark:text-slate-950 dark:shadow-[0_0_32px_rgba(56,189,248,0.4)] dark:hover:shadow-[0_0_44px_rgba(56,189,248,0.55)]"
                        : "inline-flex w-full cursor-pointer items-center justify-center rounded-2xl border border-border bg-card px-6 py-3.5 text-center text-base font-semibold text-foreground transition-all duration-200 hover:border-primary/25 hover:bg-muted dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:border-white/35 dark:hover:bg-white/10"
                    }
                  >
                    Get Started
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Full image analyses cost 30 credits. Smaller AI tools such as hooks,
          hashtags, and scripts use fewer credits.
        </p>

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
    </main>
  );
}
