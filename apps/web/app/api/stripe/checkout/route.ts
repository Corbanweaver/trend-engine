import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const creatorPriceId = process.env.STRIPE_CREATOR_PRICE_ID;
const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const planToPriceId: Record<string, string | undefined> = {
  creator: creatorPriceId,
  pro: proPriceId,
};

type UserSubscriptionRow = {
  stripe_customer_id: string | null;
};

type StripeCheckoutError = {
  type?: string;
  code?: string;
  param?: string;
  requestId?: string;
};

async function getCheckoutCustomer(
  stripe: Stripe,
  subscription: UserSubscriptionRow | null,
  email: string | undefined,
) {
  const customerId = subscription?.stripe_customer_id;
  if (customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (!("deleted" in customer && customer.deleted)) {
        return { customer: customer.id };
      }
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === "resource_missing") {
        console.error("Stored Stripe customer could not be found for checkout; creating a new customer", {
          customerId,
          requestId: error.requestId,
        });
      } else {
        throw error;
      }
    }
  }

  return email ? { customer_email: email } : {};
}

function redirectToPricing(
  request: Request,
  checkout: string,
  extraParams: Record<string, string | undefined> = {},
) {
  const url = new URL("/pricing", request.url);
  url.searchParams.set("checkout", checkout);
  for (const [key, value] of Object.entries(extraParams)) {
    if (value) url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url, 303);
}

function checkoutFailureReason(error: StripeCheckoutError) {
  if (error.type === "StripeAuthenticationError") return "stripe-auth";
  if (error.type === "StripePermissionError") return "stripe-permission";
  if (error.code === "resource_missing") {
    if (error.param?.includes("price")) return "missing-price";
    if (error.param === "customer") return "missing-customer";
    return "missing-resource";
  }
  if (error.code === "account_invalid") return "stripe-account";
  if (error.code === "url_invalid") return "invalid-url";
  if (error.type === "StripeInvalidRequestError") return "invalid-request";
  return "stripe-error";
}

export function GET(request: Request) {
  return redirectToPricing(request, "choose-plan");
}

export async function POST(request: Request) {
  if (!stripeSecretKey) {
    console.error("Stripe checkout missing STRIPE_SECRET_KEY");
    return redirectToPricing(request, "configuration");
  }

  const formData = await request.formData();
  const selectedPlan = String(formData.get("plan") ?? "").toLowerCase();
  const priceId = planToPriceId[selectedPlan];

  if (!priceId) {
    console.error("Stripe checkout missing or unknown plan configuration", {
      selectedPlan,
      hasCreatorPriceId: Boolean(creatorPriceId),
      hasProPriceId: Boolean(proPriceId),
    });
    return redirectToPricing(request, "configuration");
  }

  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Stripe checkout missing Supabase configuration");
      return redirectToPricing(request, "configuration");
    }
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
        new URL("/login?redirect=/pricing", request.url),
        303,
      );
    }

    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle<UserSubscriptionRow>();

    const stripe = new Stripe(stripeSecretKey);
    const checkoutCustomer = await getCheckoutCustomer(
      stripe,
      subscription,
      user.email,
    );
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard?success=true`,
      cancel_url: `${siteUrl}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
      ...checkoutCustomer,
      client_reference_id: user.id,
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: selectedPlan,
        },
      },
      metadata: {
        user_id: user.id,
        plan: selectedPlan,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout session created without redirect url" },
        { status: 500 },
      );
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("Stripe checkout error details:", {
        message: error.message,
        type: error.type,
        code: error.code,
        param: error.param,
        requestId: error.requestId,
        statusCode: error.statusCode,
      });
      return redirectToPricing(request, "error", {
        reason: checkoutFailureReason(error),
        request_id: error.requestId,
      });
    } else {
      console.error("Stripe checkout unexpected error:", error);
    }
    return redirectToPricing(request, "error");
  }
}
