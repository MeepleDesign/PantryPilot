import Stripe from "stripe";

let client: Stripe | null = null;

/** Lazily constructed so builds without a key configured don't crash at import time. */
export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
    client = new Stripe(key);
  }
  return client;
}

export const STRIPE_PRICE_IDS = {
  month: process.env.STRIPE_PRICE_ID_MONTHLY,
  year: process.env.STRIPE_PRICE_ID_YEARLY,
} as const;
