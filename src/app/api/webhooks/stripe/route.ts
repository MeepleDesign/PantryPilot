import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 30;

function planStatusFor(subscription: Stripe.Subscription): "active" | "past_due" | "canceled" {
  if (subscription.status === "active" || subscription.status === "trialing") return "active";
  if (subscription.status === "past_due" || subscription.status === "unpaid") return "past_due";
  return "canceled";
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const householdId = session.client_reference_id;
      if (householdId && typeof session.subscription === "string") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await syncSubscription(supabase, householdId, subscription);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const householdId = subscription.metadata?.household_id;
      if (householdId) {
        await syncSubscription(supabase, householdId, subscription);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(
  supabase: ReturnType<typeof createAdminClient>,
  householdId: string,
  subscription: Stripe.Subscription,
) {
  const status = planStatusFor(subscription);
  const priceId = subscription.items.data[0]?.price.id ?? null;
  const interval = subscription.items.data[0]?.price.recurring?.interval ?? null;

  await supabase
    .from("households")
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan_interval: interval === "year" ? "year" : interval === "month" ? "month" : null,
      plan_status: status,
      plan: status === "active" ? "pro" : "free",
    })
    .eq("id", householdId);
}
