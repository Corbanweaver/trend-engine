import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  Flame,
  Layers3,
  Link2,
  PlayCircle,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

import { ConversionEventTracker } from "@/components/analytics/conversion-event-tracker";
import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing/marketing-shell";
import { ConversionLink } from "@/components/seo/conversion-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  keywordLandingPages,
  nicheLandingPages,
  resourcePages,
} from "@/lib/seo-content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Trend Analyze and Organic Video Idea Cards",
  description:
    "TrendBoard analyzes creator trends and turns them into source-backed organic video idea cards with hooks, shot lists, captions, and posting windows.",
  alternates: {
    canonical: "/",
  },
};

const ideaCards = [
  {
    title: "Desk mobility reset",
    score: "92",
    window: "18h",
    hook: "If your back gets tight after two hours at your desk, try this before you stand up.",
    tone: "creator-wave-coral",
  },
  {
    title: "Budget protein bowls",
    score: "84",
    window: "2d",
    hook: "Here is how one $20 grocery run turns into four high-protein lunches.",
    tone: "creator-wave-gold",
  },
  {
    title: "Creator income receipts",
    score: "76",
    window: "Today",
    hook: "I tracked one small creator income stream for 30 days. Here is what actually worked.",
    tone: "creator-wave-cyan",
  },
] as const;

const functionCards = [
  {
    title: "Analyze trends",
    body: "Enter a niche or topic and generate ranked organic video idea cards.",
    href: "/analyze",
    cta: "Run analysis",
    icon: Zap,
    featured: true,
  },
  {
    title: "Live trend feed",
    body: "Browse current creator signals across short video, search, and social platforms.",
    href: "/trending",
    cta: "View trends",
    icon: TrendingUp,
    featured: false,
  },
  {
    title: "Free idea tools",
    body: "Try hooks, calendars, and niche ideas before creating an account.",
    href: "/free-tiktok-hook-ideas",
    cta: "Try free tools",
    icon: Sparkles,
    featured: false,
  },
  {
    title: "Plans",
    body: "Pick the scan volume that matches how often you create and publish.",
    href: "/pricing",
    cta: "See pricing",
    icon: Layers3,
    featured: false,
  },
] as const;

const workflow = [
  {
    title: "Analyze",
    body: "TrendBoard pulls creator signals for a niche, topic, or platform.",
    icon: Search,
  },
  {
    title: "Review cards",
    body: "Each idea card includes a trend score, source context, hook, shot list, and caption angle.",
    icon: FileText,
  },
  {
    title: "Film faster",
    body: "Save the best idea, schedule it, and publish while the window is still open.",
    icon: PlayCircle,
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

function AnalysisPreview() {
  return (
    <Card className="creator-idea-maker-panel overflow-hidden">
      <CardHeader className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="creator-sidebar-active flex size-9 items-center justify-center rounded-lg text-primary-foreground">
              <Zap className="size-4" />
            </span>
            <div>
              <CardTitle>Trend Analyze</CardTitle>
              <CardDescription>Fitness creators / organic video ideas</CardDescription>
            </div>
          </div>
          <Badge variant="secondary">Idea cards ready</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 px-5 lg:grid-cols-[0.72fr_1fr]">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Analysis input
          </p>
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-sm font-semibold">fitness creators</p>
            <p className="mt-1 text-xs text-muted-foreground">
              TikTok, Reels, Shorts, Pinterest, Search
            </p>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              Public trend signals scanned
            </div>
            <div className="flex items-center gap-2">
              <Link2 className="size-4 text-primary" />
              Source links attached
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              Posting windows ranked
            </div>
          </div>
          <Button asChild className="creator-cta mt-auto">
            <Link href="/analyze">
              Run trend analysis
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-3">
          {ideaCards.map((idea) => (
            <div
              key={idea.title}
              className={cn("creator-wave-card rounded-xl border p-4", idea.tone)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Organic video idea
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">{idea.title}</h2>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">Score {idea.score}</Badge>
                  <Badge variant="secondary">{idea.window}</Badge>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {idea.hook}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="px-5 pb-5">
        <p className="text-sm text-muted-foreground">
          The full analysis opens the ranked cards, hooks, scripts, hashtags,
          source links, and saved planning flow.
        </p>
      </CardFooter>
    </Card>
  );
}

export default function Home() {
  return (
    <main className="creator-page min-h-svh text-foreground">
      <ConversionEventTracker
        event="landing_page_viewed"
        context={{ page: "home" }}
      />

      <MarketingHeader currentPath="/" />

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.64fr_1fr] lg:items-center lg:py-16">
        <div>
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-white/70">
              Organic video idea maker
            </Badge>
            <Badge variant="outline" className="bg-white/70">
              Trend analysis
            </Badge>
          </div>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Analyze trends and get organic video idea cards
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Enter a niche or topic. TrendBoard pulls current creator signals and
            turns the strongest angles into source-backed idea cards with hooks,
            shot lists, captions, and posting windows.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="creator-cta">
              <ConversionLink
                href="/analyze"
                event="landing_cta_clicked"
                eventContext={{
                  page: "home",
                  destination: "/analyze",
                  placement: "hero_primary",
                }}
              >
                Run trend analysis
                <ArrowRight data-icon="inline-end" />
              </ConversionLink>
            </Button>
            <Button asChild size="lg" variant="outline" className="creator-outline-cta">
              <ConversionLink
                href="/trending"
                event="landing_cta_clicked"
                eventContext={{
                  page: "home",
                  destination: "/trending",
                  placement: "hero_secondary",
                }}
              >
                View live trends
                <Flame data-icon="inline-end" />
              </ConversionLink>
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              Source links included
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              Idea cards ready to save
            </span>
          </div>
        </div>

        <AnalysisPreview />
      </section>

      <section className="border-y border-border bg-background">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-12 sm:px-6 lg:grid-cols-4">
          {functionCards.map((item) => (
            <Card
              key={item.title}
              className={cn(
                "creator-card",
                item.featured ? "creator-card-coral" : "bg-card",
              )}
            >
              <CardHeader>
                <item.icon className="size-5 text-muted-foreground" />
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.body}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  asChild
                  className={item.featured ? "creator-cta" : undefined}
                  variant={item.featured ? "default" : "outline"}
                >
                  <Link href={item.href}>
                    {item.cta}
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.52fr_1fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              One workflow, separate pages
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              The landing page stays simple. The actual product functions live
              where creators expect them.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {workflow.map((item) => (
              <Card key={item.title} className="creator-card">
                <CardHeader>
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="size-5" />
                  </span>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6">
        <Card className="creator-studio-panel">
          <CardHeader className="mx-auto max-w-2xl items-center text-center">
            <Zap className="size-8 text-primary" />
            <CardTitle className="text-2xl sm:text-3xl">
              Start with one trend analysis
            </CardTitle>
            <CardDescription>
              The main product experience is the analysis page: enter a niche,
              run the scan, and review the organic video idea cards.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild size="lg" className="creator-cta">
              <Link href="/analyze">
                Open trend analyze
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <MarketingFooter guideLinks={footerLinks} />
    </main>
  );
}
