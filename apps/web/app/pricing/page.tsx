import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CreditCard,
  FileText,
  LineChart,
  LockKeyhole,
  ShieldCheck,
  Timer,
  TrendingUp,
} from "lucide-react";

import { AffiliateCheckoutFields } from "@/components/affiliate-checkout-fields";
import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing/marketing-shell";
import { Badge } from "@/components/ui/badge";
import { CREDIT_COSTS, CREDIT_LIMITS } from "@/lib/credits";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose a TrendBoard plan for organic video ideas, Trend Radar scans, source-backed video packs, saved ideas, and creator content planning.",
};

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Test the radar before paying.",
    bestFor: "Testing one niche",
    outcome: "1 full Trend Radar scan to see whether the organic video ideas fit your workflow.",
    featured: false,
    features: [
      `${CREDIT_LIMITS.free} monthly credits`,
      "1 full Trend Radar scan",
      "Basic niches",
      "Free preview tools",
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
    description: "Enough room for a consistent solo creator workflow.",
    bestFor: "Solo creators posting weekly",
    outcome:
      "Roughly 20 full scans each month, plus room for hooks, scripts, and hashtags.",
    featured: true,
    popularLabel: "Recommended",
    features: [
      `${CREDIT_LIMITS.creator} monthly credits`,
      "About 20 full Trend Radar scans",
      "All niches",
      "Saved ideas",
      "Source links and organic video packs",
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
    description: "More scans for teams, agencies, and daily publishing.",
    bestFor: "Agencies and power creators",
    outcome:
      "Roughly 60 full scans each month for testing more niches, platforms, and angles.",
    featured: false,
    features: [
      `${CREDIT_LIMITS.pro.toLocaleString()} monthly credits`,
      "About 60 full Trend Radar scans",
      "All niches",
      "Saved ideas",
      "Source links and organic video packs",
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
    title: "Pay for clearer posting windows",
    body: "Each scan ranks wave score, platform fit, and saturation risk so you can post before a topic cools off.",
  },
  {
    icon: FileText,
    title: "Package the winners fast",
    body: "Turn a promising wave into organic video hooks, shot lists, captions, hashtags, and planning notes.",
  },
  {
    icon: Timer,
    title: "Keep creator research organized",
    body: "Save source links, proof points, organic video packs, and calendar notes together.",
  },
] as const;

const creditExamples = [
  {
    label: "Trend Radar scan",
    cost: CREDIT_COSTS.analysis,
    note: "Finds rising waves and creates organic video idea cards for one niche.",
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
  { icon: LockKeyhole, label: "Credits keep usage predictable" },
  { icon: ShieldCheck, label: "Support path for account issues" },
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
    q: "Do unused credits roll over?",
    a: "Monthly plan credits are designed around the current billing period. If rollover support changes, the pricing page should say that clearly before checkout.",
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

function StatusNotice({
  checkoutStatus,
  checkoutReason,
  stripeRequestId,
}: {
  checkoutStatus?: string;
  checkoutReason?: string;
  stripeRequestId?: string;
}) {
  if (checkoutStatus === "success") {
    return (
      <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-center text-sm text-emerald-800">
        Checkout complete. Your subscription is now active.
      </div>
    );
  }

  if (checkoutStatus === "cancelled") {
    return (
      <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-center text-sm text-amber-800">
        Checkout canceled. No charge was made.
      </div>
    );
  }

  if (checkoutStatus === "error") {
    return (
      <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-800">
        {checkoutErrorMessage(checkoutReason)}
        {stripeRequestId ? (
          <span className="mt-2 block text-xs text-red-700">
            Stripe request ID: {stripeRequestId}
          </span>
        ) : null}
      </div>
    );
  }

  if (checkoutStatus === "configuration") {
    return (
      <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-800">
        Stripe checkout is not fully configured yet. Please contact support if
        this keeps happening.
      </div>
    );
  }

  if (checkoutStatus === "choose-plan") {
    return (
      <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-center text-sm text-amber-800">
        Choose a plan below to start checkout.
      </div>
    );
  }

  return null;
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const resolvedSearchParams = await searchParams;
  const checkoutStatus = resolvedSearchParams?.checkout;
  const checkoutReason = resolvedSearchParams?.reason;
  const stripeRequestId = resolvedSearchParams?.request_id;

  return (
    <main className="creator-page min-h-svh text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqJsonLd) }}
      />

      <MarketingHeader currentPath="/pricing" />

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
            Plans for creators who want better organic video ideas
          </h1>
          <p className="mt-4 text-lg leading-7 text-muted-foreground">
            Pick the monthly credit level that matches how often you scan
            trends, package organic videos, and publish while the window is open.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {trustChecks.map((item) => (
              <Badge
                key={item.label}
                variant="outline"
                className="gap-2 bg-card px-3 py-2 text-muted-foreground shadow-sm"
              >
                <item.icon className="size-3.5 text-primary" />
                {item.label}
              </Badge>
            ))}
          </div>
        </div>

        <StatusNotice
          checkoutStatus={checkoutStatus}
          checkoutReason={checkoutReason}
          stripeRequestId={stripeRequestId}
        />

        <div className="mx-auto mt-14 grid max-w-5xl gap-5 lg:grid-cols-3 lg:items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`creator-card relative flex flex-col rounded-xl border p-6 shadow-sm ${
                plan.featured
                  ? "creator-card-coral border-primary bg-card shadow-[0_18px_42px_rgba(20,26,35,0.10)]"
                  : plan.name === "Free"
                    ? "creator-card-cyan border-border bg-card"
                    : "creator-card-gold border-border bg-card"
              }`}
            >
              {plan.featured && plan.popularLabel ? (
                <div className="mb-4">
                  <Badge variant="secondary" className="w-fit">
                    {plan.popularLabel}
                  </Badge>
                </div>
              ) : null}

              <div className="mb-6">
                <h2 className="text-xl font-bold">{plan.name}</h2>
                <p className="mt-2 min-h-[3rem] text-sm leading-6 text-muted-foreground">
                  {plan.description}
                </p>
                <div className="mt-5 rounded-lg border border-border bg-background p-3 text-sm">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Best for
                  </p>
                  <p className="mt-1 font-semibold">{plan.bestFor}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {plan.outcome}
                  </p>
                </div>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              <ul className="mb-8 flex flex-1 flex-col gap-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.planKey === "free" ? (
                <Link
                  href={plan.ctaHref}
                  className={
                    plan.ctaVariant === "primary"
                      ? "creator-cta inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-center text-base font-bold text-primary-foreground transition"
                      : "creator-outline-cta inline-flex w-full items-center justify-center gap-2 rounded-lg border px-6 py-3.5 text-center text-base font-semibold text-foreground transition"
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
                        ? "creator-cta inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-center text-base font-bold text-primary-foreground transition"
                        : "creator-outline-cta inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-6 py-3.5 text-center text-base font-semibold text-foreground transition"
                    }
                  >
                    {plan.ctaLabel}
                    <ArrowRight className="size-4" />
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>

        <section className="mx-auto mt-12 grid max-w-5xl gap-4 lg:grid-cols-3">
          {buyerSignals.map((item) => (
            <div key={item.title} className="creator-card rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </div>
              <h2 className="mt-4 text-base font-bold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </section>

        <section className="creator-studio-panel mx-auto mt-10 max-w-5xl rounded-xl border border-border p-6 shadow-sm sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-extrabold">
                What your credits buy
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Trend scans are the heavier workflow. Credits make the monthly
                plan easy to understand while keeping usage predictable.
              </p>
            </div>
            <div className="grid gap-3">
              {creditExamples.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start justify-between gap-4 rounded-lg border border-border bg-white/70 p-4"
                >
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {item.note}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {item.cost} credits
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-3xl">
          <div className="text-center">
            <TrendingUp className="mx-auto size-8 text-primary" />
            <h2 className="mt-3 text-3xl font-extrabold">
              Pricing FAQ
            </h2>
          </div>
          <div className="mt-8 flex flex-col gap-3">
            {pricingFaqItems.map((item) => (
              <details
                key={item.q}
                className="rounded-lg border border-border bg-card px-5 py-2"
              >
                <summary className="cursor-pointer py-3 text-sm font-semibold">
                  {item.q}
                </summary>
                <p className="border-t border-border pb-4 pt-3 text-sm leading-6 text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

      </div>

      <MarketingFooter />
    </main>
  );
}
