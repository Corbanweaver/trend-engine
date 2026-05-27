import type { Metadata } from "next";

import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How TrendBoard handles account, billing, and trend analysis data.",
};

const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
  "support@contentideamaker.com";

export default function PrivacyPage() {
  const supportHref = `mailto:${supportEmail}?subject=${encodeURIComponent(
    "TrendBoard privacy request",
  )}`;

  return (
    <main className="creator-page min-h-svh text-foreground">
      <MarketingHeader />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="creator-studio-panel rounded-xl border border-border p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated May 1, 2026
          </p>
        </div>

        <section className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-6 text-sm leading-6 text-muted-foreground shadow-sm">
          <p>
            TrendBoard collects the account details you provide, such as your
            email address, saved ideas, selected niches, subscription status,
            and product usage. We use this information to run the app,
            personalize your dashboard, prevent abuse, and provide support.
          </p>
          <p>
            Payments are processed by Stripe. TrendBoard does not store full
            card numbers. We store Stripe customer and subscription identifiers
            so your plan can be updated when billing events occur.
          </p>
          <p>
            When you run analyses or AI tools, prompts and trend inputs may be
            sent to service providers that power scraping and language
            generation. We use these services only to deliver the features you
            request and to improve reliability.
          </p>
          <p>
            We do not sell personal data. We may disclose information when
            needed to comply with law, protect the service, process payments, or
            work with vendors who help operate TrendBoard.
          </p>
          <p>
            To request account help or data deletion, contact{" "}
            <a
              href={supportHref}
              className="font-medium text-primary hover:underline"
            >
              {supportEmail}
            </a>{" "}
            or use the Support page.
          </p>
        </section>
      </article>
      <MarketingFooter />
    </main>
  );
}
