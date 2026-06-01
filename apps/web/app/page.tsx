import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  AtSign,
  Bell,
  Bookmark,
  CalendarDays,
  Check,
  LayoutDashboard,
  Link2,
  ListChecks,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { ConversionEventTracker } from "@/components/analytics/conversion-event-tracker";
import { HandleScanHero } from "@/components/marketing/handle-scan-hero";
import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing/marketing-shell";
import { Reveal } from "@/components/marketing/reveal";
import {
  keywordLandingPages,
  nicheLandingPages,
  resourcePages,
} from "@/lib/seo-content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "ContentIdeaMaker | Online Content Manager for Creators",
  description:
    "ContentIdeaMaker helps creators enter an Instagram or TikTok handle, detect the account niche, get specific post ideas and actions, then manage trends, saved ideas, calendars, alerts, and analytics.",
  alternates: {
    canonical: "/",
  },
};

const workflow = [
  {
    title: "Add your handle",
    body: "Start with a public Instagram or TikTok username so the manager knows the creator account it is planning for.",
    icon: AtSign,
  },
  {
    title: "Get the content plan",
    body: "TrendBoard finds the niche, then turns it into posts, hooks, daily tasks, profile fixes, and schedule ideas.",
    icon: ListChecks,
  },
  {
    title: "Run the content loop",
    body: "Use trends, saved ideas, calendar planning, alerts, and analytics to keep publishing instead of starting over.",
    icon: CalendarDays,
  },
] as const;

const toolkit = [
  {
    title: "Creator Manager",
    body: "Account scan, niche plan, posts, tasks, schedule, and profile moves.",
    href: "/manager",
    cta: "Start here",
    icon: LayoutDashboard,
    featured: true,
  },
  {
    title: "Trend Analysis",
    body: "Turn a niche into ranked organic video ideas and hooks.",
    href: "/analyze",
    cta: "Analyze",
    icon: Sparkles,
    featured: false,
  },
  {
    title: "Live Trends",
    body: "Watch creator signals across social, search, and short-form platforms.",
    href: "/trending",
    cta: "View trends",
    icon: TrendingUp,
    featured: false,
  },
  {
    title: "Saved Ideas",
    body: "Keep the strongest hooks, scripts, and post angles in one place.",
    href: "/saved",
    cta: "Open saved",
    icon: Bookmark,
    featured: false,
  },
  {
    title: "Calendar",
    body: "Move ideas into a weekly posting rhythm you can actually follow.",
    href: "/calendar",
    cta: "Plan posts",
    icon: CalendarDays,
    featured: false,
  },
  {
    title: "Alerts + Analytics",
    body: "Monitor niches and track what is happening across your creator workflow.",
    href: "/alerts",
    cta: "Set alerts",
    icon: Bell,
    featured: false,
  },
] as const;

const proofPoints = [
  { icon: ShieldCheck, label: "No credit card to start" },
  { icon: TrendingUp, label: "Scans 7 sources continuously" },
  { icon: Link2, label: "Source links on every idea" },
  { icon: RotateCcw, label: "Cancel anytime" },
] as const;

const homePlans = [
  {
    name: "Free",
    price: "$0",
    tagline: "Test the radar before paying.",
    features: ["1 full Trend Radar scan", "Basic niches", "Free preview tools"],
    href: "/signup",
    cta: "Start free",
    featured: false,
  },
  {
    name: "Creator",
    price: "$19.99",
    tagline: "For solo creators posting weekly.",
    features: ["~20 scans / mo", "All niches + saved ideas", "Source-backed idea packs"],
    href: "/pricing",
    cta: "Start Creator",
    featured: true,
  },
  {
    name: "Pro",
    price: "$49.99",
    tagline: "For agencies and daily publishing.",
    features: ["~60 scans / mo", "Priority trend processing", "Early access to new features"],
    href: "/pricing",
    cta: "Start Pro",
    featured: false,
  },
] as const;

const footerLinks = [
  ...keywordLandingPages,
  { title: "Niche content ideas", path: "/niches" },
  ...nicheLandingPages.slice(0, 3),
  ...resourcePages.slice(0, 2),
].map((page) => ({
  title: page.title,
  href: page.path,
}));

export default function Home() {
  return (
    <main className="creator-page min-h-svh text-foreground">
      <ConversionEventTracker
        event="landing_page_viewed"
        context={{ page: "home" }}
      />

      <MarketingHeader
        currentPath="/"
        ctaHref="/manager"
        ctaLabel="Get my plan"
      />

      <section className="relative">
        <div className="mx-auto grid w-full max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:py-28">
          <div className="max-w-xl">
            <p className="rise-in text-tt-cyan text-sm font-semibold uppercase tracking-[0.18em]">
              For TikTok &amp; Instagram creators
            </p>
            <h1
              className="rise-in mt-4 text-balance text-5xl font-bold leading-[0.9] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl"
              style={{ animationDelay: "80ms" }}
            >
              Know what to post{" "}
              <span className="text-ig-gradient">next.</span>
            </h1>
            <p
              className="rise-in mt-6 text-lg leading-8 text-white/65"
              style={{ animationDelay: "160ms" }}
            >
              Your whole content workflow in one place. Type your Instagram or
              TikTok handle and get a plan for what to post — ideas, hooks, a
              daily to-do, and a calendar.
            </p>
          </div>

          <div className="rise-in" style={{ animationDelay: "240ms" }}>
            <HandleScanHero />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.48fr_1fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              A creator workflow, not another idea list.
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              One simple loop: scan your account, see what to make, and manage it
              all from the same place.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {workflow.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-background p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Everything a creator manager needs.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Start with the Manager, then use the rest of the toolkit when you
              need deeper research, planning, monitoring, or performance
              context.
            </p>
          </div>
          <Link
            href="/manager"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            Start with Manager
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {toolkit.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group rounded-xl border p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-soft-lg",
                  item.featured
                    ? "border-[#f3c9bb] bg-[#fff7f2]"
                    : "border-border bg-white",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-lg",
                      item.featured
                        ? "bg-[#141a23] text-white"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </Link>
            );
          })}
          </div>
        </Reveal>

      </section>

      <section className="border-y border-border bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-7 text-sm text-muted-foreground sm:px-6">
          {proofPoints.map((item) => (
            <span key={item.label} className="flex items-center gap-2">
              <item.icon className="size-4 shrink-0 text-primary" />
              {item.label}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Start free. Upgrade when you post more.
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Simple monthly credits that scale with how often you scan trends and
            package posts. No credit card to try the free plan.
          </p>
        </div>

        <Reveal>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3 md:items-stretch">
          {homePlans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "flex flex-col rounded-2xl border p-7",
                plan.featured
                  ? "border-primary bg-[#fff7f2] shadow-soft-lg"
                  : "border-border bg-white shadow-soft",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">
                  {plan.name}
                </h3>
                {plan.featured ? (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                    Recommended
                  </span>
                ) : null}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="nums text-3xl font-extrabold tracking-tight text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {plan.tagline}
              </p>
              <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={cn(
                  "mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-[0.95rem] font-semibold transition",
                  plan.featured
                    ? "creator-cta text-primary-foreground"
                    : "border border-border bg-white text-foreground hover:border-foreground/25",
                )}
              >
                {plan.cta}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          ))}
          </div>
        </Reveal>

        <p className="mt-6 text-center text-sm">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
          >
            See full pricing &amp; features
            <ArrowRight className="size-4" />
          </Link>
        </p>
      </section>

      <MarketingFooter guideLinks={footerLinks} />
    </main>
  );
}
