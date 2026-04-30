import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — Trend Engine",
  description:
    "Choose a plan for Trend Engine: trend analyses, niches, saved ideas, and AI thumbnails.",
};

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Try the essentials and explore trends.",
    featured: false,
    features: [
      "5 trend analyses per month",
      "Basic niches only",
      "No saved ideas",
    ],
    ctaHref: "/signup",
    planKey: "free",
    ctaVariant: "outline" as const,
  },
  {
    name: "Creator",
    price: "$19",
    period: "/mo",
    description: "Everything you need to ship ideas consistently.",
    featured: true,
    popularLabel: "Most Popular",
    features: [
      "50 trend analyses per month",
      "All niches",
      "Save unlimited ideas",
      "AI thumbnails",
    ],
    ctaHref: "/api/stripe/checkout",
    planKey: "creator",
    ctaVariant: "primary" as const,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    description: "Maximum throughput for teams and power creators.",
    featured: false,
    features: [
      "Unlimited analyses",
      "All niches",
      "Saved ideas",
      "AI thumbnails",
      "Priority scraping",
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
        className="fluid-transition text-sm font-semibold tracking-[0.18em] text-white hover:text-cyan-200"
      >
        Trend Engine
      </Link>
      <nav className="flex items-center gap-6 text-sm">
        <Link
          href="/pricing"
          className="fluid-transition font-medium text-cyan-200 hover:text-white"
        >
          Pricing
        </Link>
        <Link
          href="/login"
          className="fluid-transition text-slate-300 hover:text-white"
        >
          Sign in
        </Link>
        <Link
          href="/dashboard"
          className="fluid-transition glass-surface rounded-xl px-4 py-2 font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"
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
  }>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const resolvedSearchParams = await searchParams;
  const checkoutStatus = resolvedSearchParams?.checkout;
  const isCheckoutSuccess = checkoutStatus === "success";
  const isCheckoutCancelled = checkoutStatus === "cancelled";

  return (
    <main className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-6rem] h-80 w-80 animate-pulse rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute right-[-5rem] top-10 h-96 w-96 animate-pulse rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-[-7rem] left-1/3 h-96 w-96 animate-pulse rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <PricingHeader />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            Pricing
          </span>
          <h1 className="mt-6 text-balance bg-gradient-to-r from-white via-cyan-100 to-fuchsia-200 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl">
            Plans that scale with your creativity
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">
            Pick the tier that matches your workflow. Upgrade or downgrade
            anytime.
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

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:mx-auto lg:grid-cols-3 lg:items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`fluid-transition relative flex flex-col rounded-3xl border p-8 shadow-xl ${
                plan.featured
                  ? "z-[1] border-cyan-400/40 bg-slate-950/80 shadow-[0_0_60px_-12px_rgba(34,211,238,0.35)] lg:-translate-y-2 lg:scale-[1.02]"
                  : "glass-surface border-white/10 bg-slate-950/50 backdrop-blur-sm hover:border-white/20"
              }`}
            >
              {plan.featured && plan.popularLabel ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-4 py-1 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg">
                    {plan.popularLabel}
                  </span>
                </div>
              ) : null}

              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                <p className="mt-2 min-h-[3rem] text-sm leading-relaxed text-slate-400">
                  {plan.description}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-white">
                    {plan.price}
                  </span>
                  <span className="text-slate-400">{plan.period}</span>
                </div>
              </div>

              <ul className="mb-8 flex flex-1 flex-col gap-3 text-sm text-slate-200">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
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
                      ? "inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3.5 text-center text-base font-bold text-slate-950 shadow-[0_0_32px_rgba(56,189,248,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_44px_rgba(56,189,248,0.55)]"
                      : "inline-flex w-full items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-center text-base font-semibold text-white transition-all duration-200 hover:border-white/35 hover:bg-white/10"
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
                        ? "inline-flex w-full cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3.5 text-center text-base font-bold text-slate-950 shadow-[0_0_32px_rgba(56,189,248,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_44px_rgba(56,189,248,0.55)]"
                        : "inline-flex w-full cursor-pointer items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-center text-base font-semibold text-white transition-all duration-200 hover:border-white/35 hover:bg-white/10"
                    }
                  >
                    Get Started
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>

        <p className="mt-16 text-center text-sm text-slate-500">
          Questions? We&apos;re here to help — reach out anytime after you sign
          up.
        </p>
      </div>
    </main>
  );
}
