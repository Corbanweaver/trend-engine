import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

import {
  getMonthlyCreditLimit,
  getRemainingCredits,
  normalizePlan,
  shouldResetMonthlyUsage,
  type SubscriptionPlan,
} from "@/lib/credits";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type UserSubscriptionRow = {
  user_id: string;
  plan: SubscriptionPlan;
  analyses_used_this_month: number;
  credits_used_this_month: number;
  credits_reset_at: string;
};

export type CreditSnapshot = {
  plan: SubscriptionPlan;
  creditsUsed: number;
  creditsLimit: number;
  creditsRemaining: number;
  analysesUsedThisMonth: number;
};

export type UsageResult =
  | { ok: true; user: User; admin: SupabaseClient; snapshot: CreditSnapshot }
  | { ok: false; status: number; error: string };

function createAdminClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getUserFromCookies(): Promise<{ user: User } | { error: string }> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: "Missing Supabase environment configuration." };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // No cookie refresh required for these route handlers.
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "Please log in to use Trend Engine." };
  }

  return { user };
}

function snapshotFromRow(row: UserSubscriptionRow): CreditSnapshot {
  const plan = normalizePlan(row.plan);
  const creditsUsed = Math.max(0, row.credits_used_this_month ?? 0);
  const creditsLimit = getMonthlyCreditLimit(plan);
  return {
    plan,
    creditsUsed,
    creditsLimit,
    creditsRemaining: getRemainingCredits(plan, creditsUsed),
    analysesUsedThisMonth: Math.max(0, row.analyses_used_this_month ?? 0),
  };
}

async function getOrCreateSubscription(admin: SupabaseClient, userId: string) {
  const selectColumns =
    "user_id,plan,analyses_used_this_month,credits_used_this_month,credits_reset_at";
  const { data, error } = await admin
    .from("user_subscriptions")
    .select(selectColumns)
    .eq("user_id", userId)
    .maybeSingle<UserSubscriptionRow>();

  if (error) throw error;
  if (data) return data;

  const { data: inserted, error: insertError } = await admin
    .from("user_subscriptions")
    .insert({ user_id: userId, plan: "free", analyses_used_this_month: 0, credits_used_this_month: 0 })
    .select(selectColumns)
    .single<UserSubscriptionRow>();

  if (insertError) throw insertError;
  return inserted;
}

export async function loadUsage(): Promise<UsageResult> {
  const userResult = await getUserFromCookies();
  if ("error" in userResult) {
    return { ok: false, status: userResult.error.startsWith("Missing") ? 500 : 401, error: userResult.error };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, status: 500, error: "Missing Supabase service role configuration." };
  }

  try {
    let row = await getOrCreateSubscription(admin, userResult.user.id);
    if (shouldResetMonthlyUsage(row.credits_reset_at)) {
      const { data: reset, error: resetError } = await admin
        .from("user_subscriptions")
        .update({
          analyses_used_this_month: 0,
          credits_used_this_month: 0,
          credits_reset_at: new Date().toISOString(),
        })
        .eq("user_id", userResult.user.id)
        .select("user_id,plan,analyses_used_this_month,credits_used_this_month,credits_reset_at")
        .single<UserSubscriptionRow>();
      if (resetError) throw resetError;
      row = reset;
    }

    return { ok: true, user: userResult.user, admin, snapshot: snapshotFromRow(row) };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error: error instanceof Error ? error.message : "Unable to load credit usage.",
    };
  }
}

export async function spendCredits(
  admin: SupabaseClient,
  userId: string,
  current: CreditSnapshot,
  cost: number,
  options: { countAnalysis?: boolean } = {},
): Promise<CreditSnapshot> {
  const nextCreditsUsed = current.creditsUsed + cost;
  const nextAnalysesUsed = current.analysesUsedThisMonth + (options.countAnalysis ? 1 : 0);
  const { data, error } = await admin
    .from("user_subscriptions")
    .update({
      credits_used_this_month: nextCreditsUsed,
      analyses_used_this_month: nextAnalysesUsed,
    })
    .eq("user_id", userId)
    .select("user_id,plan,analyses_used_this_month,credits_used_this_month,credits_reset_at")
    .single<UserSubscriptionRow>();

  if (error) throw error;
  return snapshotFromRow(data);
}
