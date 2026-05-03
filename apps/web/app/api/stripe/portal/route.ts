import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UserSubscriptionRow = {
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

function redirectToProfile(request: Request, billing: string) {
  return NextResponse.redirect(
    new URL(`/profile?billing=${billing}`, request.url),
    303,
  );
}

async function getCustomerId(
  stripe: Stripe,
  subscription: UserSubscriptionRow | null,
) {
  if (subscription?.stripe_customer_id) {
    try {
      const customer = await stripe.customers.retrieve(subscription.stripe_customer_id);
      if (!("deleted" in customer && customer.deleted)) {
        return customer.id;
      }
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === "resource_missing") {
        console.error("Stored Stripe customer could not be found for billing portal", {
          customerId: subscription.stripe_customer_id,
          requestId: error.requestId,
        });
      } else {
        throw error;
      }
    }
  }

  if (!subscription?.stripe_subscription_id) {
    return null;
  }

  let stripeSubscription: Stripe.Subscription;
  try {
    stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id,
    );
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError && error.code === "resource_missing") {
      console.error("Stored Stripe subscription could not be found", {
        subscriptionId: subscription.stripe_subscription_id,
        requestId: error.requestId,
      });
      return null;
    }
    throw error;
  }
  const { customer } = stripeSubscription;

  if (typeof customer === "string") {
    return customer;
  }

  if ("deleted" in customer && customer.deleted) {
    return null;
  }

  return customer.id;
}

export async function POST(request: Request) {
  if (!stripeSecretKey) {
    console.error("Stripe billing portal missing STRIPE_SECRET_KEY");
    return redirectToProfile(request, "configuration");
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Stripe billing portal missing Supabase configuration");
    return redirectToProfile(request, "configuration");
  }

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // No cookie refresh required for this route.
        },
      },
    });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(
        new URL("/login?redirect=/profile", request.url),
        303,
      );
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id,stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle<UserSubscriptionRow>();

    if (subscriptionError) {
      console.error("Supabase lookup failed for billing portal:", subscriptionError);
      return redirectToProfile(request, "error");
    }

    const stripe = new Stripe(stripeSecretKey);
    const customerId = await getCustomerId(stripe, subscription);

    if (!customerId) {
      return redirectToProfile(request, "setup-needed");
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/profile?billing=returned`,
    });

    return NextResponse.redirect(portalSession.url, 303);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("Stripe billing portal error details:", {
        message: error.message,
        type: error.type,
        code: error.code,
        param: error.param,
        requestId: error.requestId,
        statusCode: error.statusCode,
      });
    } else {
      console.error("Stripe billing portal unexpected error:", error);
    }

    return redirectToProfile(request, "portal-error");
  }
}
