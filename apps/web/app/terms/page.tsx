import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using Content Idea Maker.",
};

export default function TermsPage() {
  return (
    <main className="min-h-svh bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-8">
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          Content Idea Maker
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated May 1, 2026
          </p>
        </div>

        <section className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            By using Content Idea Maker, you agree to use the service responsibly and
            only for lawful content research, planning, and creation workflows.
          </p>
          <p>
            AI-generated ideas, scripts, hooks, thumbnails, and recommendations
            are provided as creative assistance. You are responsible for
            reviewing outputs before publishing and for making sure your content
            complies with platform rules and applicable laws.
          </p>
          <p>
            Subscription plans include monthly credits. Credits reset monthly,
            have no cash value, and are intended to protect the service from
            runaway usage. Content Idea Maker may limit or suspend accounts that abuse
            automation, scraping, billing, or AI generation.
          </p>
          <p>
            Paid subscriptions are billed through Stripe. You can manage or
            cancel billing from your account profile. Refund decisions may depend
            on usage, timing, and payment processor status.
          </p>
          <p>
            Content Idea Maker may change features, pricing, credits, or these terms
            as the product evolves. Continued use means you accept the current
            terms.
          </p>
        </section>
      </div>
    </main>
  );
}
