import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing/marketing-shell";
import { nicheLandingPages } from "@/lib/seo-content";

export const metadata: Metadata = {
  title: "Content Ideas by Niche",
  description:
    "Browse TrendBoard niche guides for fitness, real estate, food, beauty, coaching, and other creator content ideas.",
  alternates: {
    canonical: "/niches",
  },
};

export default function NichesIndexPage() {
  return (
    <main className="creator-page min-h-svh text-foreground">
      <MarketingHeader />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase text-primary">
          Niche guides
        </p>
        <h1 className="mt-4 max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
          Content ideas by niche
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          Start with a public niche guide, then search any custom niche inside
          TrendBoard when you want live trend cards and source links.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {nicheLandingPages.map((page) => (
            <Link
              key={page.path}
              href={page.path}
              className="creator-card group rounded-xl border border-border bg-card p-6 shadow-sm hover:border-primary/30 hover:bg-muted/40"
            >
              <Search className="size-5 text-primary" />
              <h2 className="mt-4 text-xl font-bold">{page.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {page.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Read guide
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
