import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

import { recordOperationalEvent } from "@/lib/server-events";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const creatorPriceId = process.env.STRIPE_CREATOR_PRICE_ID;
const proPriceId = process.env.STRIPE_PRO_PRICE_ID;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriptionPlan = "free" | "creator" | "pro";

type UserSubscriptionRow = {
  user_id: string;
  plan: SubscriptionPlan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status?: string | null;
  stripe_cancel_at_period_end?: boolean | null;
  stripe_current_period_end?: string | null;
};

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

function normalizePlan(plan: string | null | undefined): SubscriptionPlan {
  const value = (plan ?? "").toLowerCase();
  if (value === "pro") return "pro";
  if (value === "creator") return "creator";
  return "free";
}

function getCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  if ("deleted" in customer && customer.deleted) return null;
  return customer.id;
}

function getSubscriptionId(
  subscription: string | Stripe.Subscription | null | undefined,
) {
  if (!subscription) return null;
  return typeof subscription === "string" ? subscription : subscription.id;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  return getSubscriptionId(invoice.parent?.subscription_details?.subscription);
}

function planFromPriceId(priceId: string | null | undefined): SubscriptionPlan {
  if (priceId && priceId === proPriceId) return "pro";
  if (priceId && priceId === creatorPriceId) return "creator";
  return "free";
}

function planFromSubscription(
  subscription: Stripe.Subscription,
): SubscriptionPlan {
  const metadataPlan = normalizePlan(subscription.metadata?.plan);
  if (metadataPlan !== "free") return metadataPlan;

  const firstPriceId = subscription.items.data[0]?.price?.id;
  return planFromPriceId(firstPriceId);
}

function planForSubscriptionState(
  subscription: Stripe.Subscription,
): SubscriptionPlan {
  const paidPlan = planFromSubscription(subscription);
  if (["active", "trialing", "past_due"].includes(subscription.status)) {
    return paidPlan;
  }
  return "free";
}

function subscriptionCurrentPeriodEnd(
  subscription: Stripe.Subscription,
): string | null {
  const end = subscription.items.data[0]?.current_period_end;
  return typeof end === "number" ? new Date(end * 1000).toISOString() : null;
}

async function findSubscriptionRow(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  stripeSubscriptionId: string | null,
  stripeCustomerId: string | null,
) {
  if (stripeSubscriptionId) {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select(
        "user_id,plan,stripe_customer_id,stripe_subscription_id,stripe_subscription_status,stripe_cancel_at_period_end,stripe_current_period_end",
      )
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .maybeSingle<UserSubscriptionRow>();
    if (error) throw error;
    if (data) return data;
  }

  if (stripeCustomerId) {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select(
        "user_id,plan,stripe_customer_id,stripe_subscription_id,stripe_subscription_status,stripe_cancel_at_period_end,stripe_current_period_end",
      )
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle<UserSubscriptionRow>();
    if (error) throw error;
    if (data) return data;
  }

  return null;
}

async function upsertUserSubscription({
  userId,
  plan,
  stripeCustomerId,
  stripeSubscriptionId,
  stripeSubscriptionStatus,
  stripeCancelAtPeriodEnd = false,
  stripeCurrentPeriodEnd = null,
  resetUsage = false,
}: {
  userId: string;
  plan: SubscriptionPlan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionStatus: string;
  stripeCancelAtPeriodEnd?: boolean;
  stripeCurrentPeriodEnd?: string | null;
  resetUsage?: boolean;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase service role configuration" },
      { status: 500 },
    );
  }

  const { error } = await supabase.from("user_subscriptions").upsert(
    {
      user_id: userId,
      plan,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_subscription_status: stripeSubscriptionStatus,
      stripe_cancel_at_period_end: stripeCancelAtPeriodEnd,
      stripe_current_period_end: stripeCurrentPeriodEnd,
      ...(resetUsage
        ? {
            analyses_used_this_month: 0,
            credits_used_this_month: 0,
            credits_reset_at: new Date().toISOString(),
          }
        : {}),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("Supabase upsert failed for user_subscriptions:", error);
    await recordOperationalEvent(supabase, {
      level: "error",
      source: "stripe_webhook",
      message: "Failed to persist subscription",
      userId,
      metadata: {
        plan,
        stripeSubscriptionId,
        stripeSubscriptionStatus,
        error: error.message,
      },
    });
    return NextResponse.json(
      { error: "Failed to persist subscription" },
      { status: 500 },
    );
  }

  return null;
}

async function syncSubscription(
  subscription: Stripe.Subscription,
  options: { forcePlan?: SubscriptionPlan } = {},
) {
  const stripeCustomerId = getCustomerId(subscription.customer);
  const stripeSubscriptionId = subscription.id;
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase service role configuration" },
      { status: 500 },
    );
  }

  const existing = await findSubscriptionRow(
    supabase,
    stripeSubscriptionId,
    stripeCustomerId,
  );
  const userId = subscription.metadata?.user_id || existing?.user_id;
  if (!userId) {
    console.error("Stripe subscription event missing user mapping", {
      subscriptionId: stripeSubscriptionId,
      customerId: stripeCustomerId,
      status: subscription.status,
    });
    return null;
  }

  return upsertUserSubscription({
    userId,
    plan: options.forcePlan ?? planForSubscriptionState(subscription),
    stripeCustomerId,
    stripeSubscriptionId,
    stripeSubscriptionStatus: subscription.status,
    stripeCancelAtPeriodEnd:
      options.forcePlan === "free" ? false : subscription.cancel_at_period_end,
    stripeCurrentPeriodEnd:
      options.forcePlan === "free"
        ? null
        : subscriptionCurrentPeriodEnd(subscription),
  });
}

async function syncInvoice(stripe: Stripe, invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : null;
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return syncSubscription(subscription);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Missing Supabase service role configuration" },
      { status: 500 },
    );
  }

  const existing = await findSubscriptionRow(supabase, null, customerId);
  if (!existing) return null;

  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      stripe_subscription_status:
        invoice.status === "paid"
          ? "active"
          : (invoice.status ?? "invoice_update"),
    })
    .eq("user_id", existing.user_id);

  if (error) {
    console.error("Supabase invoice status update failed:", error);
    return NextResponse.json(
      { error: "Failed to persist invoice status" },
      { status: 500 },
    );
  }

  return null;
}

export async function POST(request: Request) {
  if (!stripeSecretKey || !stripeWebhookSecret) {
    return NextResponse.json(
      { error: "Missing Stripe webhook configuration" },
      { status: 500 },
    );
  }

  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 },
    );
  }

  const payload = await request.text();
  const stripe = new Stripe(stripeSecretKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      stripeWebhookSecret,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown webhook error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json(
      { error: "Invalid Stripe signature" },
      { status: 400 },
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId =
        session.metadata?.user_id ?? session.client_reference_id ?? null;
      if (!userId) {
        console.error("Webhook checkout.session.completed missing user id", {
          sessionId: session.id,
        });
        return NextResponse.json({ received: true });
      }

      const plan =
        (session.metadata?.plan ?? "creator").toLowerCase() === "pro"
          ? "pro"
          : "creator";

      let status = "active";
      let pricePlan: SubscriptionPlan = plan;
      let cancelAtPeriodEnd = false;
      let currentPeriodEnd: string | null = null;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;
      if (subscriptionId) {
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        status = subscription.status;
        cancelAtPeriodEnd = subscription.cancel_at_period_end;
        currentPeriodEnd = subscriptionCurrentPeriodEnd(subscription);
        const subscriptionPlan = planFromSubscription(subscription);
        if (subscriptionPlan !== "free") {
          pricePlan = subscriptionPlan;
        }
      }

      const result = await upsertUserSubscription({
        userId,
        plan: pricePlan,
        stripeCustomerId:
          typeof session.customer === "string" ? session.customer : null,
        stripeSubscriptionId: subscriptionId,
        stripeSubscriptionStatus: status,
        stripeCancelAtPeriodEnd: cancelAtPeriodEnd,
        stripeCurrentPeriodEnd: currentPeriodEnd,
        resetUsage: true,
      });
      if (result) return result;
    }

    if (event.type === "customer.subscription.updated") {
      const result = await syncSubscription(
        event.data.object as Stripe.Subscription,
      );
      if (result) return result;
    }

    if (event.type === "customer.subscription.deleted") {
      const result = await syncSubscription(
        event.data.object as Stripe.Subscription,
        { forcePlan: "free" },
      );
      if (result) return result;
    }

    if (
      event.type === "invoice.paid" ||
      event.type === "invoice.payment_failed"
    ) {
      const result = await syncInvoice(
        stripe,
        event.data.object as Stripe.Invoice,
      );
      if (result) return result;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler failed:", error);
    const supabase = getSupabaseAdmin();
    if (supabase) {
      await recordOperationalEvent(supabase, {
        level: "error",
        source: "stripe_webhook",
        message:
          error instanceof Error ? error.message : "Webhook handler failed",
        metadata: { eventType: event.type },
      });
    }
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
