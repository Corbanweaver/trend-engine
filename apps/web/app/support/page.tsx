import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support - Trend Engine",
  description:
    "Get help with Trend Engine billing, credits, account access, and ideas.",
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
    "Content Idea Maker support request",
  )}`;

  return (
    <main className="min-h-svh bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl space-y-8">
        <Link
          href="/"
          className="text-sm font-medium text-primary hover:underline"
        >
          Trend Engine
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Support</h1>
          <p className="mt-3 text-muted-foreground">
            Need help with your account, billing, credits, or generated ideas?
            Send a support request and include the email you use to sign in.
          </p>
        </div>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">
            Common requests
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {topics.map((topic) => (
              <li key={topic} className="flex gap-2">
                <span className="mt-2 size-1.5 rounded-full bg-primary" />
                <span>{topic}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Contact</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Use the feedback button inside the dashboard for product issues, or
            email{" "}
            <a
              href={supportHref}
              className="font-medium text-primary hover:underline"
            >
              {supportEmail}
            </a>{" "}
            from the address connected to your Trend Engine account. Include
            screenshots and the niche you analyzed when a generated result looks
            wrong.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Prefer a pre-filled request? Use one of these links:
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            {quickSupportLinks.map((item) => (
              <li key={item.label}>
                <a
                  href={`${supportEmailHref}?subject=${encodeURIComponent(
                    item.subject,
                  )}`}
                  className="font-medium text-primary hover:underline"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
