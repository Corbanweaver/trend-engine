import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  AtSign,
  BarChart3,
  Bell,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  ListChecks,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { ConversionEventTracker } from "@/components/analytics/conversion-event-tracker";
import { HandleScanHero } from "@/components/marketing/handle-scan-hero";
import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing/marketing-shell";
import { Button } from "@/components/ui/button";
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

const outcomes = [
  "Account-specific post ideas",
  "Daily creator action list",
  "Calendar-ready content plan",
] as const;

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

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:py-12">
        <div className="max-w-2xl">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Know what to post next.
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
            ContentIdeaMaker is an online content manager for creators. Type an
            Instagram or TikTok handle, find the account niche, get specific
            posts and actions, then keep the workflow moving with trends, saved
            ideas, calendars, alerts, and analytics.
          </p>

          <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            {outcomes.map((outcome) => (
              <span key={outcome} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                {outcome}
              </span>
            ))}
          </div>
        </div>

        <HandleScanHero />
      </section>

      <section className="border-y border-border bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.48fr_1fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              A creator workflow, not another idea list.
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              The landing page points to one simple loop: scan the account,
              decide what to create, then manage the content work from the same
              product.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {workflow.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-background p-5"
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

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
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

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {toolkit.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group rounded-xl border p-5 transition hover:-translate-y-1 hover:shadow-lg",
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
                <p className="mt-4 text-sm font-semibold text-primary">
                  {item.cta}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="size-6" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Built around the account, not generic prompts.
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The manager connects niche detection, trend research, post
                ideas, daily tasks, saved scripts, publishing plans, alerts, and
                analytics into one creator operating system.
              </p>
            </div>
            <Button asChild className="creator-cta">
              <Link href="/manager">
                Get my plan
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter guideLinks={footerLinks} />
    </main>
  );
}
