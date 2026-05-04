"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AchievementBadges } from "@/components/achievement-badges";
import {
  getMonthlyCreditLimit,
  getRemainingCredits,
  shouldResetMonthlyUsage,
} from "@/lib/credits";
import { getSupabaseClient } from "@/lib/supabase";
import { computeEarnedBadgeIds, readTotalAnalyses } from "@/lib/user-stats";

type SubscriptionPlan = "free" | "creator" | "pro";

const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@contentideamaker.com";

type UserSubscriptionRow = {
  plan: SubscriptionPlan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status?: string | null;
  stripe_cancel_at_period_end?: boolean | null;
  stripe_current_period_end?: string | null;
  analyses_used_this_month: number;
  credits_used_this_month: number;
  credits_reset_at: string;
};

function formatPlanLabel(plan: SubscriptionPlan | null) {
  if (plan === "creator") {
    return "Creator";
  }
  if (plan === "pro") {
    return "Pro";
  }
  return "Free";
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatCurrentPlanLabel(
  plan: SubscriptionPlan | null,
  cancelAtPeriodEnd: boolean,
  currentPeriodEnd: string | null,
) {
  const label = formatPlanLabel(plan);
  if (!plan || plan === "free" || !cancelAtPeriodEnd) return label;
  const cancelDate = formatShortDate(currentPeriodEnd);
  return cancelDate
    ? `${label} - cancels ${cancelDate}`
    : `${label} - canceling`;
}

function isPaidStripeStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing" || status === "past_due";
}

function getUsablePlan(
  plan: SubscriptionPlan,
  stripeSubscriptionId: string | null | undefined,
  stripeSubscriptionStatus: string | null | undefined,
): SubscriptionPlan {
  if (plan === "free") return "free";
  if (!stripeSubscriptionId) return plan;
  return isPaidStripeStatus(stripeSubscriptionStatus) ? plan : "free";
}

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsLimit, setCreditsLimit] = useState(
    getMonthlyCreditLimit("free"),
  );
  const [analysesUsedThisMonth, setAnalysesUsedThisMonth] = useState(0);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [hasStripeBilling, setHasStripeBilling] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAnalyses = useMemo(
    () => (ready ? readTotalAnalyses() : 0),
    [ready],
  );
  const earned = useMemo(
    () => computeEarnedBadgeIds(totalAnalyses, savedCount ?? 0),
    [totalAnalyses, savedCount],
  );
  const privacyRequestHref = useMemo(() => {
    const subject = "Content Idea Maker data request";
    const body = email
      ? `Account email: ${email}\n\nI would like help with my account data.`
      : "I would like help with my account data.";
    return `mailto:${supportEmail}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  }, [email]);

  const signOut = async () => {
    setSigningOut(true);
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  useEffect(() => {
    document.title = "Profile — Content Idea Maker";
  }, []);

  useEffect(() => {
    const billingStatus = new URLSearchParams(window.location.search).get(
      "billing",
    );
    if (billingStatus === "setup-needed") {
      setBillingMessage(
        "No Stripe billing profile is linked yet. Choose a paid plan to set one up.",
      );
    }
    if (billingStatus === "returned") {
      setBillingMessage("Returned from Stripe billing.");
    }
    if (billingStatus === "configuration") {
      setBillingMessage(
        "Billing is not fully configured yet. Please contact support if this keeps happening.",
      );
    }
    if (billingStatus === "error" || billingStatus === "portal-error") {
      setBillingMessage(
        "Stripe billing could not open. If you just subscribed, wait a moment and refresh your profile.",
      );
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          setError("Please log in to view your profile.");
          setEmail(null);
          setAvatar(null);
          setSavedCount(0);
          setPlan(null);
          setCreditsUsed(0);
          setCreditsLimit(getMonthlyCreditLimit("free"));
          setAnalysesUsedThisMonth(0);
          setCancelAtPeriodEnd(false);
          setCurrentPeriodEnd(null);
          setHasStripeBilling(false);
          setIsAdmin(false);
          setReady(true);
          return;
        }
        setEmail(user.email ?? null);
        setAvatar(
          (user.user_metadata?.avatar_url as string | undefined) ?? null,
        );
        try {
          const adminResponse = await fetch("/api/admin/status", {
            cache: "no-store",
          });
          if (adminResponse.ok) {
            const adminBody = (await adminResponse.json()) as {
              isAdmin?: boolean;
            };
            setIsAdmin(Boolean(adminBody.isAdmin));
          } else {
            setIsAdmin(false);
          }
        } catch {
          setIsAdmin(false);
        }

        const { count, error: countError } = await supabase
          .from("saved_ideas")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (countError) {
          setError(countError.message);
          setSavedCount(0);
        } else {
          setSavedCount(count ?? 0);
        }

        const { data: subscription, error: subscriptionError } = await supabase
          .from("user_subscriptions")
          .select(
            "plan,stripe_customer_id,stripe_subscription_id,stripe_subscription_status,stripe_cancel_at_period_end,stripe_current_period_end,analyses_used_this_month,credits_used_this_month,credits_reset_at",
          )
          .eq("user_id", user.id)
          .maybeSingle<UserSubscriptionRow>();

        if (subscriptionError) {
          setError(subscriptionError.message);
          setPlan("free");
          setCreditsUsed(0);
          setCreditsLimit(getMonthlyCreditLimit("free"));
          setAnalysesUsedThisMonth(0);
          setCancelAtPeriodEnd(false);
          setCurrentPeriodEnd(null);
          setHasStripeBilling(false);
        } else {
          const nextPlan = getUsablePlan(
            subscription?.plan ?? "free",
            subscription?.stripe_subscription_id,
            subscription?.stripe_subscription_status,
          );
          const staleMonth = shouldResetMonthlyUsage(
            subscription?.credits_reset_at,
          );
          const nextCreditsUsed = staleMonth
            ? 0
            : (subscription?.credits_used_this_month ?? 0);
          setPlan(nextPlan);
          setCreditsUsed(nextCreditsUsed);
          setCreditsLimit(getMonthlyCreditLimit(nextPlan));
          setAnalysesUsedThisMonth(
            staleMonth ? 0 : (subscription?.analyses_used_this_month ?? 0),
          );
          setCancelAtPeriodEnd(
            nextPlan !== "free" &&
              Boolean(subscription?.stripe_cancel_at_period_end),
          );
          setCurrentPeriodEnd(subscription?.stripe_current_period_end ?? null);
          setHasStripeBilling(
            Boolean(
              subscription?.stripe_customer_id ??
              subscription?.stripe_subscription_id,
            ),
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load profile.");
        setSavedCount(0);
        setPlan("free");
        setCreditsUsed(0);
        setCreditsLimit(getMonthlyCreditLimit("free"));
        setAnalysesUsedThisMonth(0);
        setCancelAtPeriodEnd(false);
        setCurrentPeriodEnd(null);
        setHasStripeBilling(false);
      } finally {
        setReady(true);
      }
    };
    void load();
  }, []);

  return (
    <main className="min-h-svh bg-background px-4 py-8 pb-24 text-foreground lg:pb-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <Link
            href="/dashboard"
            className="fluid-transition glass-surface rounded-xl border border-border px-3 py-2 text-sm text-foreground hover:bg-muted dark:border-white/20 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Back to Dashboard
          </Link>
        </div>

        {error ? (
          <p className="rounded-md border border-red-300/60 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </p>
        ) : null}

        {billingMessage ? (
          <p className="rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
            {billingMessage}
          </p>
        ) : null}

        <section className="glass-surface flex flex-col items-center gap-4 rounded-2xl border border-border p-8 text-center sm:flex-row sm:items-center sm:text-left">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              className="size-20 shrink-0 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex size-20 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-2xl font-semibold text-foreground">
              {email ? email.slice(0, 1).toUpperCase() : "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-foreground">
              {email ?? "Signed out"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {ready ? (
                <>
                  <span className="tabular-nums">{totalAnalyses}</span> analyses
                  on this device
                  {" · "}
                  <span className="tabular-nums">{savedCount ?? 0}</span> saved
                  ideas
                </>
              ) : (
                "Loading…"
              )}
            </p>
            <p className="mt-3">
              <Link
                href="/analytics"
                className="text-sm font-medium text-primary underline underline-offset-2 hover:opacity-90"
              >
                Open analytics
              </Link>
            </p>
          </div>
        </section>

        <section className="glass-surface rounded-2xl border border-border p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground">Account</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Current plan:{" "}
                <span className="font-medium text-foreground">
                  {isAdmin
                    ? "Admin"
                    : ready
                      ? formatCurrentPlanLabel(
                          plan,
                          cancelAtPeriodEnd,
                          currentPeriodEnd,
                        )
                    : "Loading..."}
                </span>
              </p>
              {ready && plan && plan !== "free" && cancelAtPeriodEnd ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Paid access and credits stay active until{" "}
                  {formatShortDate(currentPeriodEnd) ??
                    "the end of this billing period"}
                  .
                </p>
              ) : null}
              <p className="mt-1 text-sm text-muted-foreground">
                Monthly credits:{" "}
                <span className="font-medium text-foreground">
                  {isAdmin
                    ? "Unlimited for admin testing"
                    : ready
                      ? `${getRemainingCredits(plan, creditsUsed)} remaining of ${creditsLimit}`
                      : "Loading..."}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {ready
                  ? `${creditsUsed} credits used across ${analysesUsedThisMonth} analyses this month.`
                  : "Loading usage..."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <form action="/api/stripe/portal" method="POST">
                <button
                  type="submit"
                  className="fluid-transition rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!ready || !email || !hasStripeBilling}
                >
                  Manage billing
                </button>
              </form>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="fluid-transition rounded-xl border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15"
                >
                  Admin overview
                </Link>
              ) : null}
              {!hasStripeBilling && ready ? (
                <Link
                  href="/pricing"
                  className="fluid-transition rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  View plans
                </Link>
              ) : null}
              <button
                type="button"
                onClick={signOut}
                disabled={!ready || signingOut}
                className="fluid-transition rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signingOut ? "Signing out..." : "Logout"}
              </button>
            </div>
          </div>
        </section>

        <section className="glass-surface rounded-2xl border border-border p-5">
          <h2 className="text-sm font-medium text-foreground">Badges</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Milestones across your account and this browser
          </p>
          <div className="mt-4">
            {ready && savedCount !== null ? (
              <AchievementBadges earnedIds={earned} showLocked />
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </div>
        </section>

        <section className="glass-surface rounded-2xl border border-border p-5">
          <h2 className="text-sm font-medium text-foreground">Data and privacy</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Request an account export, correction, or deletion from the email
            connected to your account. Billing changes should still be handled
            through Stripe billing first.
          </p>
          <a
            href={privacyRequestHref}
            className="mt-4 inline-flex rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Email data request
          </a>
        </section>
      </div>
    </main>
  );
}
