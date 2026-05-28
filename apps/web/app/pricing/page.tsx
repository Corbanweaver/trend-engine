import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CreditCard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { AffiliateCheckoutFields } from "@/components/affiliate-checkout-fields";
import { ResumeCheckoutForm } from "@/components/resume-checkout-form";
import { CREDIT_COSTS, CREDIT_LIMITS, type SubscriptionPlan } from "@/lib/credits";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple TrendBoard pricing for creators who want live trend scans, post ideas, hooks, scripts, hashtags, and saved content plans.",
};

type PaidPlanKey = "creator" | "pro";

type Plan = {
  name: string;
  planKey: SubscriptionPlan;
  price: string;
  period: string;
  scans: string;
  bestFor: string;
  summary: string;
  features: string[];
  ctaLabel: string;
  featured?: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    planKey: "free",
    price: "$0",
    period: "/mo",
    scans: "1 trend scan",
    bestFor: "Trying the app",
    summary: "See if TrendBoard gives useful ideas for your niche.",
    features: [
      `${CREDIT_LIMITS.free} monthly credits`,
      "One full trend scan",
      "Starter idea cards",
      "Upgrade only when you need more scans",
    ],
    ctaLabel: "Create free account",
  },
  {
    name: "Creator",
    planKey: "creator",
    price: "$19.99",
    period: "/mo",
    scans: "About 20 trend scans",
    bestFor: "Solo creators",
    summary: "A practical plan for posting every week without guessing.",
    features: [
      `${CREDIT_LIMITS.creator} monthly credits`,
      "All supported platforms and niches",
      "Save ideas, hooks, scripts, and hashtags",
      "Source links and thumbnails",
      "Calendar-ready notes",
    ],
    ctaLabel: "Start Creator",
    featured: true,
  },
  {
    name: "Pro",
    planKey: "pro",
    price: "$49.99",
    period: "/mo",
    scans: "About 60 trend scans",
    bestFor: "Daily creators and teams",
    summary: "More room to test niches, angles, and content plans.",
    features: [
      `${CREDIT_LIMITS.pro.toLocaleString()} monthly credits`,
      "Everything in Creator",
      "More monthly research capacity",
      "Priority trend processing",
      "Early access to new features",
    ],
    ctaLabel: "Start Pro",
  },
];

const includedItems = [
  {
    title: "Live trend research",
    body: "Scan public signals from TikTok, Instagram, Pinterest, YouTube Shorts, Reddit, X, Threads, search, and news.",
  },
  {
    title: "Post-ready ideas",
    body: "Turn the best signals into short idea cards, hooks, hashtags, scripts, and source notes.",
  },
  {
    title: "Saved workflow",
    body: "Keep the good ideas in one place so you can film now or plan later.",
  },
] as const;

const creditExamples = [
  {
    label: "One trend scan",
    cost: CREDIT_COSTS.analysis,
    note: "Finds live topics and creates idea cards for one niche.",
  },
  {
    label: "Hook variations",
    cost: CREDIT_COSTS.hooks,
    note: "Adds more openings for a chosen idea.",
  },
  {
    label: "Full script",
    cost: CREDIT_COSTS.fullScript,
    note: "Turns one idea into a fuller spoken outline.",
  },
] as const;

const pricingFaqItems = [
  {
    q: "Can I try TrendBoard before paying?",
    a: "Yes. Start free, run a small test, and upgrade only when you want more monthly trend scans.",
  },
  {
    q: "What is a trend scan?",
    a: "A trend scan checks public signals for one niche and turns them into creator-ready content ideas.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Paid access continues through the current billing period, and billing is handled securely through Stripe.",
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
    plan?: string;
    reason?: string;
    request_id?: string;
  }>;
};

function PricingHeader() {
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
            href="/"
            className="hidden font-medium text-muted-foreground hover:text-foreground sm:inline"
          >
            Home
          </Link>
          <Link
            href="/login"
            className="hidden font-medium text-muted-foreground hover:text-foreground sm:inline"
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
      </div>
    </header>
  );
}

function checkoutErrorMessage(reason: string | undefined) {
  switch (reason) {
    case "stripe-auth":
      return "Stripe checkout could not start because the live Stripe secret key is invalid or not loaded.";
    case "stripe-permission":
      return "Stripe checkout could not start because the Stripe key does not have permission to create Checkout Sessions.";
    case "missing-price":
      return "Stripe checkout could not start because one of the live price IDs could not be found.";
    case "missing-customer":
      return "Stripe checkout could not start because the saved Stripe customer could not be found.";
    case "stripe-account":
      return "Stripe checkout could not start because the Stripe account is not ready for live charges.";
    case "invalid-url":
      return "Stripe checkout could not start because a redirect URL is invalid.";
    case "invalid-request":
      return "Stripe checkout could not start because Stripe rejected the request.";
    case "request-too-large":
      return "Checkout could not start because the submitted form was too large. Refresh and try again.";
    case "unsupported-form":
      return "Checkout could not start because the browser sent an unsupported form format. Refresh and try again.";
    case "missing-resource":
      return "Stripe checkout could not start because a saved Stripe resource could not be found.";
    case "stripe-error":
      return "Stripe checkout could not start because Stripe returned an error.";
    case "rate-limited":
      return "Too many checkout attempts were started in a short period. Wait a few minutes and try again.";
    case "invalid-origin":
      return "Checkout must be started from the TrendBoard website. Refresh and try again.";
    default:
      return "Stripe checkout could not start. Make sure you are signed in and try again, or contact support if it keeps happening.";
  }
}

function getPaidPlan(plan: string | undefined) {
  const paidPlan = plans.find(
    (item) => item.planKey === plan && item.planKey !== "free",
  );
  return paidPlan as (Plan & { planKey: PaidPlanKey }) | undefined;
}

function StatusNotice({
  tone,
  children,
}: {
  tone: "success" | "warning" | "error";
  children: React.ReactNode;
}) {
  const styles = {
    success:
      "border-emerald-400/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-100",
    warning:
      "border-amber-400/40 bg-amber-500/10 text-amber-800 dark:text-amber-100",
    error: "border-red-400/40 bg-red-500/10 text-red-800 dark:text-red-100",
  };

  return (
    <div className={`mx-auto mt-8 max-w-2xl rounded-2xl border px-5 py-4 text-center text-sm ${styles[tone]}`}>
      {children}
    </div>
  );
}

function PlanCta({
  plan,
  resumeCheckoutPlan,
}: {
  plan: Plan;
  resumeCheckoutPlan: (Plan & { planKey: PaidPlanKey }) | undefined;
}) {
  const buttonClass = plan.featured
    ? "inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
    : "inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 text-sm font-bold text-foreground hover:bg-muted dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-900";

  if (plan.planKey === "free") {
    return (
      <Link href="/signup" className={buttonClass}>
        {plan.ctaLabel}
        <ArrowRight className="size-4" />
      </Link>
    );
  }

  return (
    <form action="/api/stripe/checkout" method="POST">
      <input type="hidden" name="plan" value={plan.planKey} />
      <AffiliateCheckoutFields />
      <button type="submit" className={buttonClass}>
        {resumeCheckoutPlan?.planKey === plan.planKey
          ? `Continue ${plan.name}`
          : plan.ctaLabel}
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
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
    <main className="min-h-svh bg-background pb-24 text-foreground sm:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqJsonLd) }}
      />
      <PricingHeader />

      <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <h1 className="max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
              Choose how many trend scans you need.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              TrendBoard finds live topics and turns them into post ideas,
              hooks, scripts, hashtags, and saved content plans.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <form action="/api/stripe/checkout" method="POST">
                <input type="hidden" name="plan" value="creator" />
                <AffiliateCheckoutFields />
                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 sm:w-auto"
                >
                  Start Creator
                  <ArrowRight className="size-4" />
                </button>
              </form>
              <Link
                href="#plans"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border bg-card px-6 text-sm font-bold text-foreground hover:bg-muted dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-900"
              >
                Compare plans
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 dark:border-white/10 dark:bg-slate-950/70">
            <p className="text-sm font-bold text-foreground">
              Simple credit math
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              One full trend scan costs {CREDIT_COSTS.analysis} credits. Creator
              includes {CREDIT_LIMITS.creator} credits, which is about 20 scans
              each month.
            </p>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="size-4 text-primary dark:text-cyan-300" />
                Secure Stripe checkout
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="size-4 text-primary dark:text-cyan-300" />
                Cancel through billing anytime
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="size-4 text-primary dark:text-cyan-300" />
                Start free before upgrading
              </div>
            </div>
          </div>
        </div>

        {isCheckoutSuccess ? (
          <StatusNotice tone="success">
            Checkout complete. Your subscription is now active.
          </StatusNotice>
        ) : null}

        {isCheckoutCancelled ? (
          <StatusNotice tone="warning">
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
          </StatusNotice>
        ) : null}

        {isCheckoutError ? (
          <StatusNotice tone="error">
            {checkoutErrorMessage(checkoutReason)}
            {stripeRequestId ? (
              <span className="mt-2 block text-xs opacity-80">
                Stripe request ID: {stripeRequestId}
              </span>
            ) : null}
          </StatusNotice>
        ) : null}

        {isCheckoutConfigurationError ? (
          <StatusNotice tone="error">
            Stripe checkout is not fully configured yet. Please contact support
            if this keeps happening.
          </StatusNotice>
        ) : null}

        {isChoosePlanNotice ? (
          <StatusNotice tone="warning">
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
          </StatusNotice>
        ) : null}
      </section>

      <section
        id="plans"
        className="mx-auto grid max-w-6xl scroll-mt-24 gap-5 px-4 sm:px-6 lg:grid-cols-3"
      >
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`flex flex-col rounded-3xl border p-6 shadow-sm ${
              plan.featured
                ? "border-primary/35 bg-primary/5 dark:border-cyan-300/35 dark:bg-cyan-400/5"
                : "border-border bg-card dark:border-white/10 dark:bg-slate-950/70"
            } ${
              resumeCheckoutPlan?.planKey === plan.planKey
                ? "ring-2 ring-primary/55 ring-offset-2 ring-offset-background dark:ring-cyan-300/70"
                : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {plan.name}
                </h2>
                <p className="mt-1 text-sm font-semibold text-primary dark:text-cyan-200">
                  {plan.scans}
                </p>
              </div>
              {plan.featured ? (
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground dark:bg-cyan-400 dark:text-slate-950">
                  Best start
                </span>
              ) : null}
            </div>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight">
                {plan.price}
              </span>
              <span className="text-muted-foreground">{plan.period}</span>
            </div>

            <p className="mt-5 text-sm font-bold">{plan.bestFor}</p>
            <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
              {plan.summary}
            </p>

            <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-cyan-400/10 dark:text-cyan-200">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <PlanCta plan={plan} resumeCheckoutPlan={resumeCheckoutPlan} />
            </div>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-6 dark:border-white/10 dark:bg-slate-950/70 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">
                What every plan is built to do
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                TrendBoard is for creators who need to know what to post next,
                not read a long feature list.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {includedItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-background p-4 dark:border-white/10 dark:bg-slate-900/70"
                >
                  <h3 className="text-sm font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 rounded-3xl border border-border bg-card p-6 dark:border-white/10 dark:bg-slate-950/70 sm:p-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Credits keep usage simple.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Scans use the most credits. Smaller actions, like hooks and
              scripts, cost less after you pick an idea.
            </p>
          </div>
          <div className="grid gap-3">
            {creditExamples.map((item) => (
              <div
                key={item.label}
                className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-background p-4 dark:border-white/10 dark:bg-slate-900/70"
              >
                <div>
                  <p className="font-semibold">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {item.note}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-100">
                  {item.cost}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-3xl px-4 pb-12 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">
          Quick answers
        </h2>
        <div className="mt-8 space-y-3">
          {pricingFaqItems.map((item) => (
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
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/94 px-4 py-3 shadow-[0_-12px_32px_rgba(15,23,42,0.14)] backdrop-blur dark:border-white/10 dark:bg-slate-950/94 sm:hidden">
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
    </main>
  );
}
