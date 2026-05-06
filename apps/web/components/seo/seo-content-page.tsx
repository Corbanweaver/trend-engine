import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Compass,
  Sparkles,
} from "lucide-react";

import { ConversionEventTracker } from "@/components/analytics/conversion-event-tracker";
import { FreeResourceWidget } from "@/components/seo/free-resource-widget";
import type { SeoPage } from "@/lib/seo-content";
import { allSeoPages, seoPageUrl } from "@/lib/seo-content";

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

export function SeoContentPage({ page }: { page: SeoPage }) {
  const breadcrumbs = breadcrumbItems(page);

  return (
    <main className="min-h-svh bg-background text-foreground">
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

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-14 pt-8 lg:grid-cols-[1fr_360px] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary dark:text-cyan-200">
            {page.eyebrow}
          </p>
          <h1 className="mt-5 max-w-4xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {page.h1}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
            {page.intro}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Try TrendBoard
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/trending"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted dark:border-white/10 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              See live trends
            </Link>
          </div>
        </div>

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
      </section>

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

      <section className="mx-auto max-w-6xl px-6 py-14">
        {page.resourceKind ? (
          <FreeResourceWidget
            kind={page.resourceKind}
            defaultTopic={page.primaryKeyword.replace(/^free\s+/i, "")}
          />
        ) : null}

        <div className={page.resourceKind ? "mt-14" : ""}>
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
            <Link
              href="/dashboard"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Open the app
              <ArrowRight className="size-4" />
            </Link>
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
    </main>
  );
}
