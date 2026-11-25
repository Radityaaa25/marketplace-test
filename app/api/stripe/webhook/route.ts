import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { finalizeStripeOrder } from "@/lib/finalize-stripe-order";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook signature missing." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      webhookSecret,
    );
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      const admin = getSupabaseAdmin();
      const { data: seller, error: lookupError } = await admin
        .from("sellers")
        .select("id")
        .eq("stripe_account_id", account.id)
        .maybeSingle();

      if (lookupError) {
        console.error("Could not verify a Stripe seller record.");
        return NextResponse.json({ error: "Database lookup failed." }, { status: 500 });
      }
      if (!seller) {
        return NextResponse.json({ received: true });
      }

      const { error } = await admin
        .from("sellers")
        .update({
          charges_enabled: account.charges_enabled ?? false,
          payouts_enabled: account.payouts_enabled ?? false,
          details_submitted: account.details_submitted ?? false,
        })
        .eq("stripe_account_id", account.id);
      if (error) {
        console.error("Could not update a matched Stripe seller.");
        return NextResponse.json({ error: "Database update failed." }, { status: 500 });
      }
      return NextResponse.json({ received: true });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const result = await finalizeStripeOrder(session, event.account ?? null);
      if (result === "needs_refund") {
        console.error("A paid order needs a refund because its listing is already sold.");
      }
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch {
    console.error("Webhook processing failed for a recognized event.");
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
