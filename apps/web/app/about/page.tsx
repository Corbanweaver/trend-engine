import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  FileText,
  Link2,
  ShieldCheck,
} from "lucide-react";

import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how TrendBoard helps creators use Trend Radar signals to find rising waves, verify source context, and build organic video ideas.",
};

const principles = [
  "Creator research should be fast enough to use before a trend window closes.",
  "Every useful idea should keep its source context close.",
  "Saved ideas should carry the organic video hook, shot list, caption, hashtag, and calendar note together.",
];

const productNotes = [
  {
    icon: Compass,
    title: "Trend Radar first",
    body: "TrendBoard starts with live public signals across search, social, communities, news, and video sources when they are available.",
  },
  {
    icon: Link2,
    title: "Source context attached",
    body: "The workflow is designed to keep source links and original context with the content idea, so the output is easier to verify.",
  },
  {
    icon: FileText,
    title: "Organic video packs for real publishing",
    body: "A saved idea can include the angle, hook, shot list, hashtags, thumbnails, and planning notes needed to act on it.",
  },
] as const;

export default function AboutPage() {
  return (
    <main className="creator-page min-h-svh text-foreground">
      <MarketingHeader currentPath="/about" />
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6">
        <section className="creator-studio-panel rounded-xl border border-border p-8 shadow-sm sm:p-10">
          <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight sm:text-5xl">
            Built for creators who need sharper ideas while the wave is still moving.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
            TrendBoard gathers momentum signals, turns promising waves into
            organic video ideas, and keeps the creative context together so research
            does not disappear after the first idea sprint.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/analyze"
              className="creator-cta inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              Start an analysis
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/status"
              className="creator-outline-cta inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold text-foreground"
            >
              View system status
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {productNotes.map((item) => (
            <div key={item.title} className="creator-card rounded-lg border border-border bg-card p-5 shadow-sm">
              <item.icon className="size-6 text-primary" />
              <h2 className="mt-4 text-base font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 rounded-lg border border-border bg-card p-6 shadow-sm md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <ShieldCheck className="size-7 text-primary" />
            <h2 className="mt-4 text-xl font-bold">Company note</h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            TrendBoard is an early product built around a simple promise: help
            creators find useful trend context faster and turn it into work they
            can actually publish. The product will keep moving toward clearer
            sources, better organic video ideas, and more practical planning tools.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card/80 p-6">
          <h2 className="text-lg font-semibold">Product principles</h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
            {principles.map((item) => (
              <li key={item} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <MarketingFooter />
    </main>
  );
}
