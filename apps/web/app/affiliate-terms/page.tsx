import type { Metadata } from "next";

import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Affiliate Terms",
  description:
    "Creator referral and affiliate terms for sharing TrendBoard.",
};

const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
  "support@contentideamaker.com";

export default function AffiliateTermsPage() {
  const supportHref = `mailto:${supportEmail}?subject=${encodeURIComponent(
    "TrendBoard affiliate question",
  )}`;

  return (
    <main className="creator-page min-h-svh text-foreground">
      <MarketingHeader />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="creator-studio-panel rounded-xl border border-border p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Affiliate Terms
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated May 23, 2026
          </p>
        </div>

        <section className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-6 text-sm leading-6 text-muted-foreground shadow-sm">
          <p>
            TrendBoard may invite creators, educators, and partners to share
            referral links or codes. Participation is by approval, and
            TrendBoard may pause or end a referral relationship if promotion is
            misleading, abusive, or harmful to customers.
          </p>
          <p>
            Affiliates must disclose their relationship clearly wherever they
            share TrendBoard. Use plain language near the link or code, such as
            &quot;I may earn a commission if you subscribe&quot; or
            &quot;#ad&quot;. Follow the rules of each platform where you post.
          </p>
          <p>
            Do not claim guaranteed views, income, growth, rankings, or results.
            Do not invent testimonials, imply you are employed by TrendBoard, or
            use spam, impersonation, fake accounts, coupon abuse, self-referrals,
            or trademark search ads without written approval.
          </p>
          <p>
            Unless another written agreement applies, starter payouts are based
            on first paid customers attributed to an approved code, not free
            signups. Refunded, charged back, fraudulent, duplicate, or
            self-referred purchases are not eligible for payout.
          </p>
          <p>
            Tracking uses the referral code in links such as
            &quot;contentideamaker.com/?ref=creator-code&quot;. If attribution
            is unclear, TrendBoard will use its records in good faith to
            determine whether a payout is owed.
          </p>
          <p>
            Questions about creator referrals can be sent to{" "}
            <a
              href={supportHref}
              className="font-medium text-primary hover:underline"
            >
              {supportEmail}
            </a>
            .
          </p>
        </section>
      </article>
      <MarketingFooter />
    </main>
  );
}
