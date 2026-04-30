import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
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
    event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id ?? session.client_reference_id ?? null;
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
      const supabase = getSupabaseAdmin();
      if (!supabase) {
        return NextResponse.json(
          { error: "Missing Supabase service role configuration" },
          { status: 500 },
        );
      }

      const { error: upsertError } = await supabase
        .from("user_subscriptions")
        .upsert(
          {
            user_id: userId,
            plan,
            stripe_customer_id:
              typeof session.customer === "string" ? session.customer : null,
            stripe_subscription_id:
              typeof session.subscription === "string" ? session.subscription : null,
          },
          { onConflict: "user_id" },
        );

      if (upsertError) {
        console.error("Supabase upsert failed for user_subscriptions:", upsertError);
        return NextResponse.json(
          { error: "Failed to persist subscription" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler failed:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
