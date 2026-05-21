import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  Compass,
  CreditCard,
  FileText,
  Link2,
  LockKeyhole,
  PlayCircle,
  RadioTower,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { ConversionEventTracker } from "@/components/analytics/conversion-event-tracker";
import { ConversionLink } from "@/components/seo/conversion-link";
import { FreeResourceWidget } from "@/components/seo/free-resource-widget";
import type { SeoPage } from "@/lib/seo-content";
import { allSeoPages, seoPageUrl } from "@/lib/seo-content";

type ResourceKind = NonNullable<SeoPage["resourceKind"]>;

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function pageSchema(page: SeoPage) {
  return {
    "@context": "https://schema.org",
    "@type": page.group === "resource" ? "Article" : "WebPage",
    name: page.title,
    headline: page.h1,
    description: page.description,
    url: seoPageUrl(page.path),
    isPartOf: {
      "@type": "WebSite",
      name: "TrendBoard",
      url: seoPageUrl("/"),
    },
    about: page.primaryKeyword,
    audience: {
      "@type": "Audience",
      audienceType: page.audience,
    },
  };
}

function breadcrumbSchema(page: SeoPage) {
  const crumbs = [
    {
      "@type": "ListItem",
      position: 1,
      name: "TrendBoard",
      item: seoPageUrl("/"),
    },
  ];
  if (page.group === "niche") {
    crumbs.push({
      "@type": "ListItem",
      position: 2,
      name: "Niches",
      item: seoPageUrl("/niches"),
    });
  }
  crumbs.push({
    "@type": "ListItem",
    position: crumbs.length + 1,
    name: page.title,
    item: seoPageUrl(page.path),
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs,
  };
}

function faqSchema(page: SeoPage) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

function relatedLinkTitle(path: string) {
  return (
    allSeoPages.find((candidate) => candidate.path === path)?.title ??
    path.replace("/niches/", "").replace("/", "").replace(/-/g, " ")
  );
}

function breadcrumbItems(page: SeoPage) {
  return [
    { href: "/", label: "Home" },
    ...(page.group === "niche" ? [{ href: "/niches", label: "Niches" }] : []),
    { href: page.path, label: page.title },
  ];
}

const adLandingPaths = new Set([
  "/tiktok-content-ideas",
  "/free-tiktok-hook-ideas",
  "/instagram-reels-hook-ideas",
  "/instagram-content-ideas",
  "/free-content-calendar-template",
  "/content-calendar-tool",
  "/creator-content-planner",
]);

const platformBadgesByPath: Record<string, string[]> = {
  "/free-tiktok-hook-ideas": ["TikTok", "Reels", "Shorts"],
  "/tiktok-content-ideas": ["TikTok", "Instagram", "Pinterest"],
  "/instagram-reels-hook-ideas": ["Instagram", "TikTok", "Shorts"],
  "/instagram-content-ideas": ["Instagram", "Pinterest", "TikTok"],
  "/free-content-calendar-template": ["Calendar", "TikTok", "Instagram"],
  "/content-calendar-tool": ["Calendar", "Saved ideas", "Sources"],
  "/creator-content-planner": ["Planner", "Hooks", "Scripts"],
};

function getLandingPromise(page: SeoPage) {
  if (page.path.includes("tiktok")) {
    return "Find TikTok ideas before the trend gets old.";
  }
  if (page.path.includes("instagram") || page.path.includes("reels")) {
    return "Turn Reels trends into posts people want to save.";
  }
  if (page.path.includes("calendar") || page.path.includes("planner")) {
    return "Plan a week of content from real trend signals.";
  }
  return "Turn live creator trends into content ideas worth filming.";
}

function getSampleTopic(page: SeoPage) {
  if (page.path.includes("calendar") || page.path.includes("planner")) {
    return "7-day creator plan";
  }
  if (page.path.includes("instagram") || page.path.includes("reels")) {
    return "save-worthy Reels trend";
  }
  if (page.path.includes("tiktok")) {
    return "rising TikTok hook trend";
  }
  return page.primaryKeyword;
}

function getSampleHook(page: SeoPage) {
  if (page.path.includes("calendar") || page.path.includes("planner")) {
    return "Here is the content plan I would use if I had to post all week.";
  }
  if (page.path.includes("instagram") || page.path.includes("reels")) {
    return "This trend is working because it solves one tiny problem fast.";
  }
  return "I almost skipped this trend, but the comments tell a different story.";
}

function getSampleAngles(page: SeoPage) {
  if (page.path.includes("calendar") || page.path.includes("planner")) {
    return [
      "Monday: teach the common mistake",
      "Wednesday: react to the rising trend",
      "Friday: turn it into a quick proof post",
    ];
  }
  if (page.path.includes("instagram") || page.path.includes("reels")) {
    return [
      "Open with the relatable problem",
      "Show the visual proof in the first five seconds",
      "End with a save-friendly checklist",
    ];
  }
  return [
    "Use the trend as the opening problem",
    "Add one personal or niche-specific take",
    "Close with a soft prompt people can answer",
  ];
}

function getFreePreviewKind(page: SeoPage): ResourceKind {
  if (page.resourceKind) return page.resourceKind;
  if (page.path.includes("calendar") || page.path.includes("planner")) {
    return "calendar";
  }
  if (page.path.includes("trend")) {
    return "trend-checklist";
  }
  return "hooks";
}

function HeroProductPreview({ page }: { page: SeoPage }) {
  const badges = platformBadgesByPath[page.path] ?? [
    "TikTok",
    "Instagram",
    "YouTube",
  ];
  const sampleTopic = getSampleTopic(page);

  return (
    <div className="relative">
      <div className="absolute -inset-3 rounded-[2rem] bg-primary/10 blur-2xl dark:bg-cyan-400/10" />
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_24px_70px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-slate-950 dark:shadow-[0_24px_90px_rgba(34,211,238,0.12)]">
        <div className="border-b border-border bg-background/80 p-4 dark:border-white/10 dark:bg-slate-900/85">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary dark:text-cyan-200">
                Live scan preview
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {page.primaryKeyword}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Live
            </span>
          </div>
          <div className="mt-4 rounded-2xl border border-border bg-card p-3 dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary dark:text-cyan-300" />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted dark:bg-slate-800">
                <div className="h-full w-[76%] rounded-full bg-primary dark:bg-gradient-to-r dark:from-cyan-400 dark:to-fuchsia-400" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Ranking recent views, saves, comments, and cross-platform signals.
            </p>
          </div>
        </div>

        <div className="grid gap-3 p-4">
          {[
            {
              title: sampleTopic,
              score: "92",
              stage: "Rising fast",
              accent: "from-cyan-400/35 via-indigo-400/20 to-fuchsia-400/35",
            },
            {
              title: "comment demand angle",
              score: "84",
              stage: "Cross-platform",
              accent: "from-emerald-400/30 via-cyan-400/15 to-blue-400/30",
            },
            {
              title: "save-worthy how-to",
              score: "78",
              stage: "Early trend",
              accent: "from-rose-400/25 via-amber-300/15 to-cyan-400/25",
            },
          ].map((card) => (
            <article
              key={card.title}
              className="overflow-hidden rounded-2xl border border-border bg-background dark:border-white/10 dark:bg-slate-900/80"
            >
              <div
                className={`h-24 bg-gradient-to-br ${card.accent} dark:from-cyan-400/25 dark:via-indigo-500/15 dark:to-fuchsia-400/25`}
              />
              <div className="p-3">
                <div className="flex flex-wrap gap-1.5">
                  {badges.map((badge) => (
                    <span
                      key={`${card.title}-${badge}`}
                      className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-100"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold capitalize text-foreground">
                      {card.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {card.stage}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold tabular-nums text-foreground">
                      {card.score}
                      <span className="text-xs font-medium text-muted-foreground">
                        /100
                      </span>
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      momentum
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrustStrip() {
  const items = [
    { icon: CreditCard, label: "Secure Stripe billing" },
    { icon: LockKeyhole, label: "Credits prevent overuse" },
    { icon: Link2, label: "Source links included" },
    { icon: BadgeCheck, label: "Cancel anytime" },
  ] as const;

  return (
    <div className="border-y border-border bg-card/70 dark:border-white/10 dark:bg-slate-950/65">
      <div className="mx-auto grid max-w-6xl gap-3 px-6 py-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"
          >
            <item.icon className="size-4 text-primary dark:text-cyan-300" />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function PremiumSampleOutput({ page }: { page: SeoPage }) {
  const angles = getSampleAngles(page);

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary dark:text-cyan-200">
            Sample output
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
            Show the value before signup
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Cold visitors need to see what they get. This is the kind of card
            TrendBoard builds after a niche scan: trend context, a hook, content
            angles, hashtags, and source links in one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["TikTok", "Instagram", "Pinterest", "YouTube"].map((platform) => (
              <span
                key={platform}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground dark:border-white/10 dark:bg-white/5"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>

        <article className="rounded-[2rem] border border-border bg-card p-5 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary dark:text-cyan-200">
                Trend signal
              </p>
              <h3 className="mt-2 text-2xl font-extrabold tracking-tight">
                {getSampleTopic(page)}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Found across multiple creator platforms with fresh engagement.
              </p>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-200">
              Rising fast
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-4 dark:border-white/10 dark:bg-slate-900/70">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <WandSparkles className="size-4 text-primary dark:text-cyan-300" />
                Hook
              </div>
              <p className="mt-2 text-sm font-semibold leading-6">
                {getSampleHook(page)}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4 dark:border-white/10 dark:bg-slate-900/70">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <RadioTower className="size-4 text-primary dark:text-cyan-300" />
                Why it matters
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The topic is fresh enough to post now, but clear enough to adapt
                to a specific niche.
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-border bg-background p-4 dark:border-white/10 dark:bg-slate-900/70">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <FileText className="size-4 text-primary dark:text-cyan-300" />
              Content angles
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6">
              {angles.map((angle) => (
                <li key={angle} className="flex gap-2">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary dark:text-cyan-300" />
                  <span>{angle}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {["#contentideas", "#creatorworkflow", "#trendwatch"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:border-cyan-300/30 dark:bg-cyan-400/10 dark:text-cyan-100"
              >
                {tag}
              </span>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function DemoValueSection() {
  return (
    <section className="border-y border-border bg-muted/30 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[1fr_0.85fr] lg:items-center">
        <div className="rounded-[2rem] border border-border bg-card p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
          <div className="aspect-video overflow-hidden rounded-[1.5rem] border border-border bg-background dark:border-white/10 dark:bg-slate-900">
            <div className="flex h-full flex-col justify-between bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.22),transparent_34%),radial-gradient(circle_at_75%_35%,rgba(217,70,239,0.18),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.02),rgba(15,23,42,0.12))] p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-semibold shadow-sm dark:bg-slate-950/80">
                  Product preview
                </span>
                <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg dark:bg-cyan-400 dark:text-slate-950">
                  <PlayCircle className="size-6" />
                </span>
              </div>
              <div>
                <p className="max-w-md text-2xl font-extrabold tracking-tight">
                  Type a niche. Scan live signals. Save the best idea.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Preview the path from niche scan to saved content plan.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary dark:text-cyan-200">
            Product proof
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
            Visitors should understand the app before they create an account
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            The landing page now shows the workflow your ads promise: trend
            scan, ranked idea cards, hooks, hashtags, source links, and a saved
            calendar path.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Live creator-platform signals",
              "Short idea cards first",
              "Hooks and scripts on demand",
              "Saved ideas with context",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 text-primary dark:text-cyan-300" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SeoContentPage({ page }: { page: SeoPage }) {
  const breadcrumbs = breadcrumbItems(page);
  const isAdLandingPage = adLandingPaths.has(page.path);
  const freePreviewKind = isAdLandingPage
    ? getFreePreviewKind(page)
    : page.resourceKind;
  const primaryCtaHref = isAdLandingPage ? "#free-preview" : "/dashboard";
  const primaryCtaLabel = isAdLandingPage
    ? "Generate Free Ideas"
    : "Try TrendBoard";

  return (
    <main className="min-h-svh bg-background pb-20 text-foreground sm:pb-0">
      <JsonLd data={pageSchema(page)} />
      <JsonLd data={breadcrumbSchema(page)} />
      <JsonLd data={faqSchema(page)} />
      <ConversionEventTracker
        event="landing_page_viewed"
        context={{ page: page.path, group: page.group }}
      />

      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-7">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.18em] text-foreground hover:text-primary"
        >
          TrendBoard
        </Link>
        <nav className="flex flex-wrap items-center gap-5 text-sm">
          <Link
            href="/trending"
            className="font-medium text-muted-foreground hover:text-foreground"
          >
            Trending
          </Link>
          <Link
            href="/free-tiktok-hook-ideas"
            className="font-medium text-muted-foreground hover:text-foreground"
          >
            Free tools
          </Link>
          <Link
            href="/niches"
            className="font-medium text-muted-foreground hover:text-foreground"
          >
            Niches
          </Link>
          <Link
            href="/pricing"
            className="font-medium text-muted-foreground hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-border bg-card px-4 py-2 font-semibold text-foreground hover:bg-muted dark:border-white/10 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            Open app
          </Link>
        </nav>
      </header>

      <nav
        aria-label="Breadcrumb"
        className="mx-auto w-full max-w-6xl px-6 text-sm text-muted-foreground"
      >
        <ol className="flex flex-wrap items-center gap-2">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <li key={crumb.href} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden>/</span> : null}
                {isLast ? (
                  <span className="font-medium text-foreground">
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="hover:text-foreground">
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-14 pt-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary dark:text-cyan-200">
            {page.eyebrow}
          </p>
          <h1 className="mt-5 max-w-4xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {isAdLandingPage ? getLandingPromise(page) : page.h1}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
            {page.intro}
          </p>
          {isAdLandingPage ? (
            <div className="mt-5 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
              {[
                "Free scan available",
                "No fake unlimited usage",
                "Built for mobile creators",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary dark:text-cyan-300" />
                  {item}
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <ConversionLink
              href={primaryCtaHref}
              event="landing_cta_clicked"
              eventContext={{
                page: page.path,
                destination: primaryCtaHref,
                placement: "hero_primary",
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              {primaryCtaLabel}
              <ArrowRight className="size-4" />
            </ConversionLink>
            <ConversionLink
              href={
                isAdLandingPage ? "/signup?from=hero-secondary" : "/trending"
              }
              event="landing_cta_clicked"
              eventContext={{
                page: page.path,
                destination: isAdLandingPage
                  ? "/signup?from=hero-secondary"
                  : "/trending",
                placement: "hero_secondary",
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted dark:border-white/10 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              {isAdLandingPage ? "Create free account" : "See live trends"}
            </ConversionLink>
          </div>
        </div>

        {isAdLandingPage ? (
          <HeroProductPreview page={page} />
        ) : (
          <aside className="rounded-3xl border border-border bg-card p-6 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-cyan-400/10 dark:text-cyan-200">
                <Compass className="size-6" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Search intent
                </p>
                <h2 className="text-lg font-bold">{page.primaryKeyword}</h2>
              </div>
            </div>
            <ul className="mt-6 space-y-3 text-sm leading-6 text-muted-foreground">
              {page.outcomes.map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary dark:text-cyan-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </section>

      {isAdLandingPage ? <TrustStrip /> : null}

      <section className="border-y border-border bg-muted/30 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary dark:text-cyan-200">
              Workflow
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
              From search to saved idea
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              These pages are built for discovery, but the product is built for
              doing the work: researching signals, choosing an angle, and saving
              the best ideas.
            </p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {page.workflow.map((step, index) => (
              <li
                key={step}
                className="rounded-2xl border border-border bg-card p-5 dark:border-white/10 dark:bg-slate-950/55"
              >
                <p className="text-xs font-bold text-primary dark:text-cyan-200">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {isAdLandingPage ? (
        <>
          <PremiumSampleOutput page={page} />
          <DemoValueSection />
        </>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 py-14">
        {freePreviewKind ? (
          <FreeResourceWidget
            kind={freePreviewKind}
            defaultTopic={page.primaryKeyword.replace(/^free\s+/i, "")}
          />
        ) : null}

        <div className={freePreviewKind ? "mt-14" : ""}>
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-cyan-400/10 dark:text-cyan-200">
              <ClipboardList className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary dark:text-cyan-200">
                Examples
              </p>
              <h2 className="text-2xl font-bold tracking-tight">
                Ways to use this idea
              </h2>
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {page.examples.map((example) => (
              <article
                key={example.title}
                className="rounded-2xl border border-border bg-card p-5 dark:border-white/10 dark:bg-slate-950/55"
              >
                <Sparkles className="size-5 text-primary dark:text-cyan-300" />
                <h3 className="mt-4 text-base font-semibold">
                  {example.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {example.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary dark:text-cyan-200">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
            Common questions
          </h2>
        </div>
        <div className="mt-8 space-y-3">
          {page.faqs.map((faq) => (
            <details
              key={faq.q}
              className="rounded-2xl border border-border bg-card px-5 py-2 dark:border-white/10 dark:bg-slate-950/55"
            >
              <summary className="cursor-pointer py-3 text-sm font-semibold">
                {faq.q}
              </summary>
              <p className="border-t border-border pb-4 pt-3 text-sm leading-6 text-muted-foreground dark:border-white/10">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="rounded-3xl border border-border bg-card p-8 dark:border-white/10 dark:bg-slate-950/70">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary dark:text-cyan-200">
                Next steps
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
                Turn this into a real content plan
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Start with the free resources, then use TrendBoard when you want
                live source links, organic thumbnails, saved ideas, and calendar
                planning in one place.
              </p>
            </div>
            <ConversionLink
              href={isAdLandingPage ? "#free-preview" : "/dashboard"}
              event="landing_cta_clicked"
              eventContext={{
                page: page.path,
                destination: isAdLandingPage ? "#free-preview" : "/dashboard",
                placement: "bottom_cta",
              }}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              {isAdLandingPage ? "Generate a free preview" : "Open the app"}
              <ArrowRight className="size-4" />
            </ConversionLink>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {page.related.map((path) => (
              <Link
                key={path}
                href={path}
                className="rounded-2xl border border-border bg-muted/40 p-4 text-sm font-semibold text-foreground hover:border-primary/30 hover:bg-muted dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-cyan-300/30"
              >
                {relatedLinkTitle(path)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {isAdLandingPage ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/94 px-4 py-3 shadow-[0_-12px_32px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-slate-950/94 sm:hidden">
          <ConversionLink
            href="#free-preview"
            event="landing_cta_clicked"
            eventContext={{
              page: page.path,
              destination: "#free-preview",
              placement: "mobile_sticky",
            }}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground dark:bg-cyan-400 dark:text-slate-950"
          >
            Generate Free Ideas
            <ArrowRight className="size-4" />
          </ConversionLink>
        </div>
      ) : null}
    </main>
  );
}
