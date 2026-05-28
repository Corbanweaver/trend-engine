import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  type AffiliateAttribution,
  affiliateToStripeMetadata,
  getAffiliateFromFormData,
  getAffiliateFromMetadata,
} from "@/lib/affiliate-attribution";
import {
  hasTrustedOrigin,
  parseLimitedUrlEncodedForm,
} from "@/lib/api-request-guards";
import { recordConversionEvent } from "@/lib/conversion-events";
import { enforceStripeRateLimit } from "../rate-limit";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const creatorPriceId = process.env.STRIPE_CREATOR_PRICE_ID;
const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHECKOUT_FORM_LIMIT_BYTES = 4 * 1024;

const planToPriceId: Record<string, string | undefined> = {
  creator: creatorPriceId,
  pro: proPriceId,
};

const creatorAffiliateCouponIds: Record<string, string> = {
  billy: "5ONfpz7t",
  boulder: "XFR7uOI2",
  mason: "HNsUzQwm",
  "mr-evil": "MSsjegia",
  mrevil: "MSsjegia",
  slushy: "xh6bxk07",
};

type UserSubscriptionRow = {
  plan: "free" | "creator" | "pro" | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
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
      if (
        error instanceof Stripe.errors.StripeError &&
        error.code === "resource_missing"
      ) {
        console.error(
          "Stored Stripe customer could not be found for checkout; creating a new customer",
          {
            customerId,
            requestId: error.requestId,
          },
        );
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

function checkoutResumePath(
  request: Request,
  selectedPlan: string,
  affiliate: AffiliateAttribution | null,
) {
  const url = new URL("/pricing", request.url);
  url.searchParams.set("checkout", "choose-plan");
  url.searchParams.set("plan", selectedPlan);
  if (affiliate) {
    url.searchParams.set("affiliate_ref", affiliate.code);
    url.searchParams.set("affiliate_param", affiliate.param);
  }
  url.hash = "plans";
  return `${url.pathname}${url.search}${url.hash}`;
}

function redirectToLoginForCheckout(
  request: Request,
  selectedPlan: string,
  affiliate: AffiliateAttribution | null,
) {
  const url = new URL("/login", request.url);
  url.searchParams.set(
    "redirect",
    checkoutResumePath(request, selectedPlan, affiliate),
  );
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

function checkoutFormFailureReason(status: number) {
  if (status === 413) return "request-too-large";
  if (status === 415) return "unsupported-form";
  return "invalid-request";
}

function isPaidStripeStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing" || status === "past_due";
}

function hasActivePaidSubscription(
  subscription: UserSubscriptionRow | null,
): subscription is UserSubscriptionRow & {
  plan: "creator" | "pro";
  stripe_subscription_id: string;
  stripe_subscription_status: string;
} {
  if (!subscription || subscription.plan === "free") return false;
  if (!subscription.stripe_subscription_id) return false;
  return isPaidStripeStatus(subscription.stripe_subscription_status);
}

async function getBillingPortalCustomerId(
  stripe: Stripe,
  subscription: UserSubscriptionRow,
) {
  if (subscription.stripe_customer_id) {
    return subscription.stripe_customer_id;
  }

  if (!subscription.stripe_subscription_id) {
    return null;
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripe_subscription_id,
  );
  const { customer } = stripeSubscription;

  if (typeof customer === "string") {
    return customer;
  }

  if ("deleted" in customer && customer.deleted) {
    return null;
  }

  return customer.id;
}

export function GET(request: Request) {
  return redirectToPricing(request, "choose-plan");
}

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return redirectToPricing(request, "error", { reason: "invalid-origin" });
  }

  if (!stripeSecretKey) {
    console.error("Stripe checkout missing STRIPE_SECRET_KEY");
    return redirectToPricing(request, "configuration");
  }

  const ipRateLimit = await enforceStripeRateLimit({
    request,
    target: "checkout",
    redirect: () =>
      redirectToPricing(request, "error", { reason: "rate-limited" }),
  });
  if (ipRateLimit) return ipRateLimit;

  const parsedForm = await parseLimitedUrlEncodedForm(request, {
    maxBytes: CHECKOUT_FORM_LIMIT_BYTES,
    invalidMessage: "Invalid checkout form.",
    tooLargeMessage: "Checkout form is too large.",
    unsupportedMessage: "Checkout forms must use URL-encoded fields.",
  });
  if (!parsedForm.ok) {
    return redirectToPricing(request, "error", {
      reason: checkoutFormFailureReason(parsedForm.status),
    });
  }

  const formData = parsedForm.form;
  const selectedPlan = String(formData.get("plan") ?? "").toLowerCase();
  const checkoutAffiliate = getAffiliateFromFormData(formData);
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
      await recordConversionEvent({
        event: "checkout_auth_required",
        metadata: {
          plan: selectedPlan,
          affiliate: checkoutAffiliate,
          source: "stripe_checkout_route",
        },
      });
      return redirectToLoginForCheckout(request, selectedPlan, checkoutAffiliate);
    }

    const userRateLimit = await enforceStripeRateLimit({
      request,
      target: "checkout",
      userId: user.id,
      includeIp: false,
      redirect: () =>
        redirectToPricing(request, "error", { reason: "rate-limited" }),
    });
    if (userRateLimit) return userRateLimit;

    const affiliate =
      checkoutAffiliate ?? getAffiliateFromMetadata(user.user_metadata);
    const affiliateMetadata = affiliateToStripeMetadata(affiliate);
    const affiliateCouponId = affiliate
      ? creatorAffiliateCouponIds[affiliate.code]
      : undefined;

    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select(
        "plan,stripe_customer_id,stripe_subscription_id,stripe_subscription_status",
      )
      .eq("user_id", user.id)
      .maybeSingle<UserSubscriptionRow>();

    const stripe = new Stripe(stripeSecretKey);

    if (hasActivePaidSubscription(subscription)) {
      const customerId = await getBillingPortalCustomerId(stripe, subscription);
      if (!customerId) {
        return redirectToPricing(request, "error", {
          reason: "missing-customer",
        });
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${siteUrl}/profile?billing=returned`,
      });

      return NextResponse.redirect(portalSession.url, 303);
    }

    const checkoutCustomer = await getCheckoutCustomer(
      stripe,
      subscription,
      user.email,
    );
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard?success=true&plan=${encodeURIComponent(
        selectedPlan,
      )}&checkout_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing?checkout=cancelled&plan=${encodeURIComponent(
        selectedPlan,
      )}`,
      ...(affiliateCouponId
        ? { discounts: [{ coupon: affiliateCouponId }] }
        : { allow_promotion_codes: true }),
      ...checkoutCustomer,
      client_reference_id: user.id,
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: selectedPlan,
          ...affiliateMetadata,
        },
      },
      metadata: {
        user_id: user.id,
        plan: selectedPlan,
        ...affiliateMetadata,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout session created without redirect url" },
        { status: 500 },
      );
    }

    await recordConversionEvent({
      event: "checkout_started",
      userId: user.id,
      metadata: {
        plan: selectedPlan,
        sessionId: session.id,
        reusedStripeRecord: Boolean(subscription?.stripe_customer_id),
        affiliateCouponId,
        affiliate,
        ...affiliateMetadata,
      },
    });

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
