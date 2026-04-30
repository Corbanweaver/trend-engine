import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const creatorPriceId = process.env.STRIPE_CREATOR_PRICE_ID;
const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: "https://contentideamaker.com/dashboard?success=true",
      cancel_url: "https://contentideamaker.com/pricing",
      allow_promotion_codes: true,
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
