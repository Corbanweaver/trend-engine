import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { isAdminEmail } from "@/lib/admin";
import { getMonthlyCreditLimit } from "@/lib/credits";

export const dynamic = "force-dynamic";

type SubscriptionRow = {
  user_id: string;
  plan: "free" | "creator" | "pro";
  stripe_subscription_status: string | null;
  stripe_cancel_at_period_end: boolean | null;
  analyses_used_this_month: number | null;
  credits_used_this_month: number | null;
  updated_at: string;
};

type RateLimitRow = {
  action: string;
  count: number;
};

type OperationalEventRow = {
  id: string;
  level: "info" | "warn" | "error";
  source: string;
  message: string;
  user_id: string | null;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function compactNumber(value: number | null | undefined) {
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(
    value ?? 0,
  );
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function planLabel(plan: SubscriptionRow["plan"]) {
  if (plan === "creator") return "Creator";
  if (plan === "pro") return "Pro";
  return "Free";
}

async function getCurrentUserEmail() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Server component only reads the session.
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}

function getAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export default async function AdminPage() {
  const email = await getCurrentUserEmail();
  if (!email) redirect("/login?redirect=/admin");

  if (!isAdminEmail(email)) {
    return (
      <main className="min-h-svh bg-background px-4 py-10 text-foreground">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Admin</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Access restricted
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This overview is only available to configured admin accounts.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const admin = getAdminClient();
  if (!admin) {
    return (
      <main className="min-h-svh bg-background px-4 py-10 text-foreground">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">Admin</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Missing configuration
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            The admin overview needs Supabase service role access on the server.
          </p>
        </div>
      </main>
    );
  }

  const [
    subscriptionsResult,
    savedResult,
    waitlistResult,
    alertsResult,
    rateLimitsResult,
    eventsResult,
  ] = await Promise.all([
    admin
      .from("user_subscriptions")
      .select(
        "user_id, plan, stripe_subscription_status, stripe_cancel_at_period_end, analyses_used_this_month, credits_used_this_month, updated_at",
      )
      .order("credits_used_this_month", { ascending: false })
      .limit(1000),
    admin.from("saved_ideas").select("*", { count: "exact", head: true }),
    admin.from("email_waitlist").select("*", { count: "exact", head: true }),
    admin
      .from("trend_alert_subscriptions")
      .select("*", { count: "exact", head: true }),
    admin
      .from("api_rate_limits")
      .select("action, count")
      .gte(
        "updated_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      )
      .limit(1000),
    admin
      .from("operational_events")
      .select("id, level, source, message, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const subscriptions = (
    (subscriptionsResult.data ?? []) as SubscriptionRow[]
  ).map((row) => ({
    ...row,
    plan: row.plan ?? "free",
    credits_used_this_month: row.credits_used_this_month ?? 0,
    analyses_used_this_month: row.analyses_used_this_month ?? 0,
  }));

  const planCounts = subscriptions.reduce(
    (acc, row) => {
      acc[row.plan] += 1;
      return acc;
    },
    { free: 0, creator: 0, pro: 0 },
  );
  const totalCredits = subscriptions.reduce(
    (sum, row) => sum + (row.credits_used_this_month ?? 0),
    0,
  );
  const totalAnalyses = subscriptions.reduce(
    (sum, row) => sum + (row.analyses_used_this_month ?? 0),
    0,
  );
  const cancelingCount = subscriptions.filter(
    (row) => row.plan !== "free" && row.stripe_cancel_at_period_end,
  ).length;
  const activePaidCount = subscriptions.filter(
    (row) =>
      row.plan !== "free" &&
      ["active", "trialing", "past_due"].includes(
        row.stripe_subscription_status ?? "",
      ),
  ).length;

  const rateLimitActivity = new Map<string, number>();
  for (const row of (rateLimitsResult.data ?? []) as RateLimitRow[]) {
    rateLimitActivity.set(
      row.action,
      (rateLimitActivity.get(row.action) ?? 0) + row.count,
    );
  }

  const cards = [
    {
      label: "Accounts",
      value: subscriptions.length,
      helper: `${planCounts.creator} creator, ${planCounts.pro} pro`,
    },
    {
      label: "Active paid",
      value: activePaidCount,
      helper: `${cancelingCount} canceling`,
    },
    {
      label: "Saved ideas",
      value: savedResult.count ?? 0,
      helper: "total saved cards",
    },
    {
      label: "Trend alerts",
      value: alertsResult.count ?? 0,
      helper: "niche subscriptions",
    },
    {
      label: "Waitlist",
      value: waitlistResult.count ?? 0,
      helper: "email signups",
    },
    {
      label: "Credits used",
      value: totalCredits,
      helper: `${totalAnalyses} analyses`,
    },
  ];
  const events = (eventsResult.data ?? []) as OperationalEventRow[];

  return (
    <main className="min-h-svh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Production
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Admin overview
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Signed in as {email}. Data refreshes when this page loads.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Dashboard
          </Link>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {compactNumber(card.value)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {card.helper}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Highest credit usage</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Plan</th>
                    <th className="py-2 pr-4">Credits</th>
                    <th className="py-2 pr-4">Limit</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subscriptions.slice(0, 12).map((row) => (
                    <tr key={row.user_id}>
                      <td className="py-2 pr-4 font-mono text-xs">
                        {row.user_id.slice(0, 8)}
                      </td>
                      <td className="py-2 pr-4">{planLabel(row.plan)}</td>
                      <td className="py-2 pr-4 tabular-nums">
                        {row.credits_used_this_month}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">
                        {getMonthlyCreditLimit(row.plan)}
                      </td>
                      <td className="py-2 pr-4">
                        {row.stripe_cancel_at_period_end
                          ? "Canceling"
                          : (row.stripe_subscription_status ?? "free")}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {formatDateTime(row.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">API activity, last 24h</h2>
            <div className="mt-4 space-y-3">
              {[...rateLimitActivity.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([action, count]) => (
                  <div
                    key={action}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2"
                  >
                    <span className="text-sm">{action}</span>
                    <span className="font-mono text-sm tabular-nums">
                      {compactNumber(count)}
                    </span>
                  </div>
                ))}
              {rateLimitActivity.size === 0 ? (
                <p className="rounded-xl border border-border bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
                  No tracked API usage yet.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Recent operational events</h2>
          <div className="mt-4 space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-border bg-muted/30 px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-medium uppercase text-muted-foreground">
                    {event.level}
                  </span>
                  <span className="text-sm font-medium">{event.source}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(event.created_at)}
                  </span>
                  {event.user_id ? (
                    <span className="font-mono text-xs text-muted-foreground">
                      user {event.user_id.slice(0, 8)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-foreground">{event.message}</p>
              </div>
            ))}
            {events.length === 0 ? (
              <p className="rounded-xl border border-border bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
                No operational events recorded yet.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
