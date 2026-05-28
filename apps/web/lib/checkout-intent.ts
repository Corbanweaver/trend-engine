export type PaidCheckoutPlan = "creator" | "pro";

export type CheckoutIntent = {
  plan: PaidCheckoutPlan;
  planName: "Creator" | "Pro";
};

export function getCheckoutIntentFromRedirectTarget(
  redirectTarget: string,
): CheckoutIntent | null {
  if (!redirectTarget.startsWith("/") || redirectTarget.startsWith("//")) {
    return null;
  }

  try {
    const url = new URL(redirectTarget, "https://trendboard.local");
    if (url.pathname !== "/pricing") return null;
    if (url.searchParams.get("checkout") !== "choose-plan") return null;

    const plan = url.searchParams.get("plan")?.toLowerCase();
    if (plan === "creator") {
      return { plan, planName: "Creator" };
    }
    if (plan === "pro") {
      return { plan, planName: "Pro" };
    }
  } catch {
    return null;
  }

  return null;
}
