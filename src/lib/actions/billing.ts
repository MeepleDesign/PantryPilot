"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/current-household";
import { getStripe, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { siteUrl } from "@/lib/site-url";

export async function createCheckoutSession(interval: "month" | "year"): Promise<string> {
  const priceId = STRIPE_PRICE_IDS[interval];
  if (!priceId) throw new Error("Billing isn't set up yet — missing a Stripe price ID.");

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const { household } = await getCurrentHousehold();

  const stripe = getStripe();

  let customerId = household.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: auth.user?.email,
      metadata: { household_id: household.id },
    });
    customerId = customer.id;
    const { error } = await supabase
      .from("households")
      .update({ stripe_customer_id: customerId })
      .eq("id", household.id);
    if (error) throw new Error(error.message);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/billing?success=1`,
    cancel_url: `${siteUrl}/billing`,
    client_reference_id: household.id,
    subscription_data: { metadata: { household_id: household.id } },
  });

  if (!session.url) throw new Error("Stripe didn't return a checkout URL.");
  return session.url;
}

export async function createPortalSession(): Promise<string> {
  const { household } = await getCurrentHousehold();
  if (!household.stripe_customer_id) {
    throw new Error("No billing account on file yet.");
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: household.stripe_customer_id,
    return_url: `${siteUrl}/billing`,
  });

  return session.url;
}
