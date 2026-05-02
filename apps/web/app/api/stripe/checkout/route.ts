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

export async function POST(request: Request) {
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Missing STRIPE_SECRET_KEY" },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const selectedPlan = String(formData.get("plan") ?? "").toLowerCase();
  const priceId = planToPriceId[selectedPlan];

  if (!priceId) {
    return NextResponse.json(
      { error: "Unknown plan or missing price id configuration" },
      { status: 400 },
    );
  }

  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Missing Supabase configuration" },
        { status: 500 },
      );
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

    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard?success=true`,
      cancel_url: `${siteUrl}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
      customer_email: user.email,
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
    } else {
      console.error("Stripe checkout unexpected error:", error);
    }
    return NextResponse.json(
      { error: "Unable to create Stripe checkout session" },
      { status: 500 },
    );
  }
}
