import "server-only";

import Stripe from "stripe";

export const PLATFORM_FEE_PERCENT = 10;

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}
