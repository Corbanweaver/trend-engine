import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, HelpCircle, Mail } from "lucide-react";

import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with TrendBoard billing, credits, account access, and ideas.",
};

const topics = [
  "Billing or subscription changes",
  "Credit balance questions",
  "Login or account access",
  "Unexpected analysis results",
  "Feature requests before launch",
];

const quickSupportLinks = [
  {
    label: "Billing or upgrade questions",
    subject: "Billing help request",
  },
  {
    label: "Login, password, or account access",
    subject: "Login or account access help",
  },
  {
    label: "Bad analysis result / data quality issue",
    subject: "Analysis result looks incorrect",
  },
  {
    label: "Cancellation, plan, or refund request",
    subject: "Cancellation or refund request",
  },
];

const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
  "support@contentideamaker.com";
const supportEmailHref = `mailto:${supportEmail}`;

export default function SupportPage() {
  const supportHref = `${supportEmailHref}?subject=${encodeURIComponent(
    "TrendBoard support request",
  )}`;

  return (
    <main className="creator-page min-h-svh text-foreground">
      <MarketingHeader currentPath="/support" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="creator-studio-panel rounded-xl border border-border p-8 shadow-sm">
          <HelpCircle className="size-8 text-primary" />
          <h1 className="mt-5 text-4xl font-semibold tracking-tight">
            Support that keeps creator work moving
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Need help with your account, billing, credits, or generated ideas?
            Send a support request and include the email you use to sign in.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={supportHref}
              className="creator-cta inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              Email support
              <ArrowRight className="size-4" />
            </a>
            <Link
              href="/status"
              className="creator-outline-cta inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold text-foreground"
            >
              View status
            </Link>
          </div>
        </section>

        <div className="grid gap-4">
          <section className="creator-card rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">
              Common requests
            </h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              {topics.map((topic) => (
                <li key={topic} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="creator-card rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Mail className="size-5 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Contact</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Use the feedback button inside the dashboard for product issues, or
              email{" "}
              <a
                href={supportHref}
                className="font-medium text-primary hover:underline"
              >
                {supportEmail}
              </a>{" "}
              from the address connected to your TrendBoard account. Include
              screenshots and the niche you analyzed when a generated result looks
              wrong.
            </p>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              {quickSupportLinks.map((item) => (
                <a
                  key={item.label}
                  href={`${supportEmailHref}?subject=${encodeURIComponent(
                    item.subject,
                  )}`}
                  className="rounded-lg border border-border bg-background px-3 py-2 font-medium text-primary hover:bg-muted"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
      <MarketingFooter />
    </main>
  );
}
