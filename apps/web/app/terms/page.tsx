import type { Metadata } from "next";
import Link from "next/link";

import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using TrendBoard.",
};

export default function TermsPage() {
  return (
    <main className="creator-page min-h-svh text-foreground">
      <MarketingHeader />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="creator-studio-panel rounded-xl border border-border p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated May 1, 2026
          </p>
        </div>

        <section className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-6 text-sm leading-6 text-muted-foreground shadow-sm">
          <p>
            By using TrendBoard, you agree to use the service responsibly and
            only for lawful content research, planning, and creation workflows.
          </p>
          <p>
            AI-generated ideas, scripts, hooks, and recommendations are provided
            as creative assistance. You are responsible for reviewing outputs
            before publishing and for making sure your content complies with
            platform rules and applicable laws.
          </p>
          <p>
            Subscription plans include monthly credits. Credits reset monthly,
            have no cash value, and are intended to protect the service from
            runaway usage. TrendBoard may limit or suspend accounts that abuse
            automation, scraping, billing, or AI generation.
          </p>
          <p>
            Paid subscriptions are billed through Stripe. You can manage or
            cancel billing from your account profile. Refund decisions may
            depend on usage, timing, and payment processor status.
          </p>
          <p>
            Creator referrals and affiliate payouts are governed by the{" "}
            <Link
              href="/affiliate-terms"
              className="font-medium text-primary hover:underline"
            >
              Affiliate Terms
            </Link>
            . Participants must use honest endorsements and clear disclosures
            when sharing TrendBoard links or codes.
          </p>
          <p>
            TrendBoard may change features, pricing, credits, or these terms as
            the product evolves. Continued use means you accept the current
            terms.
          </p>
        </section>
      </article>
      <MarketingFooter />
    </main>
  );
}
