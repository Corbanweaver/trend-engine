export type SubscriptionPlan = "free" | "creator" | "pro";

export const CREDIT_LIMITS: Record<SubscriptionPlan, number> = {
  free: 30,
  creator: 600,
  pro: 1800,
};

export const CREDIT_COSTS = {
  analysisWithImages: 30,
  hooks: 3,
  hashtags: 2,
  fullScript: 6,
  assistantMessage: 1,
} as const;

export function normalizePlan(plan: string | null | undefined): SubscriptionPlan {
  if (plan === "creator" || plan === "pro") return plan;
  return "free";
}

export function getMonthlyCreditLimit(plan: string | null | undefined): number {
  return CREDIT_LIMITS[normalizePlan(plan)];
}

export function getRemainingCredits(plan: string | null | undefined, used: number): number {
  return Math.max(0, getMonthlyCreditLimit(plan) - Math.max(0, used || 0));
}

export function shouldResetMonthlyUsage(value: string | null | undefined, now = new Date()): boolean {
  if (!value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return true;
  return date.getUTCFullYear() !== now.getUTCFullYear() || date.getUTCMonth() !== now.getUTCMonth();
}
