import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, MessageSquareText } from "lucide-react";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with TrendBoard billing, login, credits, saved ideas, and trend scan results.",
};

const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
  "support@contentideamaker.com";
const supportEmailHref = `mailto:${supportEmail}`;

const requestLinks = [
  {
    label: "Billing or plan help",
    subject: "Billing help request",
  },
  {
    label: "Login or password help",
    subject: "Login or account access help",
  },
  {
    label: "Trend scan looks wrong",
    subject: "Trend scan result looks incorrect",
  },
] as const;

function Header() {
  return (
    <header className="border-b border-border bg-background/95 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/95 sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
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

export default function SupportPage() {
  const supportHref = `${supportEmailHref}?subject=${encodeURIComponent(
    "TrendBoard support request",
  )}`;

  return (
    <main className="min-h-svh bg-background text-foreground">
      <Header />

      <section className="mx-auto max-w-5xl px-4 pb-14 pt-10 sm:px-6 sm:pt-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
              Need help with TrendBoard?
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Email support and include the account email you use to log in.
              Screenshots help when a trend scan or saved idea looks wrong.
            </p>
            <a
              href={supportHref}
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Email support
              <ArrowRight className="size-4" />
            </a>
          </div>

          <section className="rounded-3xl border border-border bg-card p-6 dark:border-white/10 dark:bg-slate-950/70">
            <Mail className="size-6 text-primary dark:text-cyan-300" />
            <h2 className="mt-4 text-xl font-extrabold tracking-tight">
              What to include
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <li>The email on your TrendBoard account.</li>
              <li>What you were trying to do.</li>
              <li>A screenshot if the app showed an error or odd result.</li>
            </ul>
            <p className="mt-5 text-sm text-muted-foreground">
              Support email:{" "}
              <a
                href={supportHref}
                className="font-semibold text-primary hover:underline dark:text-cyan-300"
              >
                {supportEmail}
              </a>
            </p>
          </section>
        </div>

        <section className="mt-10 rounded-3xl border border-border bg-card p-6 dark:border-white/10 dark:bg-slate-950/70 sm:p-8">
          <div className="flex items-start gap-3">
            <MessageSquareText className="mt-1 size-5 shrink-0 text-primary dark:text-cyan-300" />
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">
                Common requests
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                These links open an email with the subject filled in.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {requestLinks.map((item) => (
              <a
                key={item.label}
                href={`${supportEmailHref}?subject=${encodeURIComponent(
                  item.subject,
                )}`}
                className="rounded-2xl border border-border bg-background p-4 text-sm font-bold text-foreground hover:bg-muted dark:border-white/10 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                {item.label}
              </a>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
