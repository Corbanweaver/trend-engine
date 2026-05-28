import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  HelpCircle,
  Lightbulb,
  Search,
  Sparkles,
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

function breadcrumbItems(page: SeoPage) {
  return [
    { href: "/", label: "Home" },
    ...(page.group === "niche" ? [{ href: "/niches", label: "Niches" }] : []),
    { href: page.path, label: page.title },
  ];
}

function relatedLinkTitle(path: string) {
  return (
    allSeoPages.find((candidate) => candidate.path === path)?.title ??
    path.replace("/niches/", "").replace("/", "").replace(/-/g, " ")
  );
}

function getFreePreviewKind(page: SeoPage): ResourceKind {
  if (page.resourceKind) return page.resourceKind;
  if (page.path.includes("calendar") || page.path.includes("planner")) {
    return "calendar";
  }
  if (page.path.includes("trend")) {
    return "trend-checklist";
  }
  if (page.path.includes("vs-") || page.path.includes("-vs-")) {
    return "comparison";
  }
  if (page.path.includes("fitness")) {
    return "fitness-ideas";
  }
  return "hooks";
}

function Header() {
  return (
    <header className="border-b border-border bg-background/92 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/92 sm:px-6">
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
            href="/pricing"
            className="hidden font-medium text-muted-foreground hover:text-foreground sm:inline"
          >
            Pricing
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

function SectionHeading({
  icon: Icon,
  label,
  title,
  body,
}: {
  icon: typeof Search;
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-cyan-400/10 dark:text-cyan-200">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary dark:text-cyan-200">
        {label}
      </p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{body}</p>
    </div>
  );
}

function ProductMiniPreview({ page }: { page: SeoPage }) {
  return (
    <aside className="rounded-3xl border border-border bg-card p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70 sm:p-5">
      <div className="rounded-2xl border border-border bg-background p-4 dark:border-white/10 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary dark:text-cyan-200">
          What the app gives you
        </p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">
          One clear content idea
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          TrendBoard turns {page.primaryKeyword.toLowerCase()} into a post
          angle you can film, save, or schedule.
        </p>
      </div>
      <div className="mt-3 grid gap-3">
        {[
          ["Trend", page.primaryKeyword],
          ["Hook", "Start with the problem your audience already feels."],
          ["Next step", "Save it, expand it, or move it to your calendar."],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-background p-4 dark:border-white/10 dark:bg-slate-900/70"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary dark:text-cyan-200">
              {label}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6">{value}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function SeoContentPage({ page }: { page: SeoPage }) {
  const breadcrumbs = breadcrumbItems(page);
  const freePreviewKind = getFreePreviewKind(page);

  return (
    <main className="min-h-svh bg-background pb-20 text-foreground sm:pb-0">
      <JsonLd data={pageSchema(page)} />
      <JsonLd data={breadcrumbSchema(page)} />
      <JsonLd data={faqSchema(page)} />
      <ConversionEventTracker
        event="landing_page_viewed"
        context={{ page: page.path, group: page.group }}
      />

      <Header />

      <nav
        aria-label="Breadcrumb"
        className="mx-auto w-full max-w-6xl px-4 pt-5 text-sm text-muted-foreground sm:px-6"
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

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary dark:text-cyan-200">
            {page.eyebrow}
          </p>
          <h1 className="mt-5 max-w-4xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {page.h1}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
            {page.intro}
          </p>
          <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
            <ConversionLink
              href="#free-preview"
              event="landing_cta_clicked"
              eventContext={{
                page: page.path,
                destination: "#free-preview",
                placement: "hero_free_preview",
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Try free ideas
              <ArrowRight className="size-4" />
            </ConversionLink>
            <ConversionLink
              href="/dashboard"
              event="landing_cta_clicked"
              eventContext={{
                page: page.path,
                destination: "/dashboard",
                placement: "hero_open_app",
              }}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border bg-card px-6 text-sm font-bold text-foreground hover:bg-muted dark:border-white/10 dark:bg-slate-950 dark:hover:bg-slate-900"
            >
              Open the app
            </ConversionLink>
          </div>
          <div className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            {[
              "Pick a niche",
              "Get post ideas",
              "Save and schedule",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Check className="size-4 text-primary dark:text-cyan-300" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <ProductMiniPreview page={page} />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <FreeResourceWidget
          kind={freePreviewKind}
          defaultTopic={page.primaryKeyword.replace(/^free\s+/i, "")}
        />
      </section>

      <section className="border-y border-border bg-card/45 px-4 py-16 dark:border-white/10 dark:bg-slate-950/35 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            icon={Search}
            label="How to use it"
            title="A simple creator workflow"
            body="These landing pages now point people to the same plain product path: choose a niche, scan ideas, then save what is worth making."
          />
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {page.workflow.slice(0, 3).map((step, index) => (
              <li
                key={step}
                className="rounded-2xl border border-border bg-background p-5 dark:border-white/10 dark:bg-slate-900/65"
              >
                <span className="text-sm font-black text-muted-foreground">
                  {index + 1}
                </span>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary dark:text-cyan-200">
              What you get
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Clear ideas creators can actually use
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              The goal is not to overwhelm visitors with every feature. The goal
              is to show that TrendBoard helps creators decide what to post
              next.
            </p>
          </div>
          <div className="grid gap-3">
            {page.outcomes.slice(0, 5).map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 dark:border-white/10 dark:bg-slate-950/70"
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-cyan-400/10 dark:text-cyan-200">
                  <Check className="size-4" strokeWidth={3} />
                </span>
                <p className="text-sm font-semibold leading-6">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/45 px-4 py-16 dark:border-white/10 dark:bg-slate-950/35 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            icon={Lightbulb}
            label="Examples"
            title="Ways to turn this into content"
            body="Simple examples help visitors picture the actual output before they create an account."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {page.examples.map((example) => (
              <article
                key={example.title}
                className="rounded-2xl border border-border bg-background p-5 dark:border-white/10 dark:bg-slate-900/65"
              >
                <Sparkles className="size-5 text-primary dark:text-cyan-300" />
                <h3 className="mt-4 text-base font-bold">{example.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {example.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <SectionHeading
          icon={HelpCircle}
          label="FAQ"
          title="Quick answers"
          body="Short answers keep the page useful without making new visitors read a long sales page."
        />
        <div className="mt-8 space-y-3">
          {page.faqs.map((faq) => (
            <details
              key={faq.q}
              className="rounded-2xl border border-border bg-card px-5 py-2 dark:border-white/10 dark:bg-slate-950/70"
            >
              <summary className="cursor-pointer py-3 text-sm font-bold">
                {faq.q}
              </summary>
              <p className="border-t border-border pb-4 pt-3 text-sm leading-6 text-muted-foreground dark:border-white/10">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-6 dark:border-white/10 dark:bg-slate-950/70 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary dark:text-cyan-200">
                <CalendarDays className="size-4" />
                Next step
              </div>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
                Turn this into a content plan
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Use the free preview first. Open the app when you want live
                trend scans, saved ideas, source links, scripts, and calendar
                planning in one place.
              </p>
            </div>
            <ConversionLink
              href="/dashboard"
              event="landing_cta_clicked"
              eventContext={{
                page: page.path,
                destination: "/dashboard",
                placement: "bottom_open_app",
              }}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Open the app
              <ArrowRight className="size-4" />
            </ConversionLink>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {page.related.map((path) => (
              <Link
                key={path}
                href={path}
                className="rounded-2xl border border-border bg-background p-4 text-sm font-semibold text-foreground hover:border-primary/30 hover:bg-muted dark:border-white/10 dark:bg-slate-900 dark:hover:border-cyan-300/30"
              >
                {relatedLinkTitle(path)}
              </Link>
            ))}
          </div>
        </div>
      </section>

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
          Try free ideas
          <ArrowRight className="size-4" />
        </ConversionLink>
      </div>
    </main>
  );
}
