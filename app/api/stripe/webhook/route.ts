import { NextResponse } from "next/server";
import type Stripe from "stripe";
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
      const { data: seller } = await admin
        .from("sellers")
        .select("id")
        .eq("stripe_account_id", account.id)
        .maybeSingle();

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
      if (session.payment_status !== "paid") {
        return NextResponse.json({ received: true });
      }

      const orderId =
        typeof session.metadata?.order_id === "string"
          ? session.metadata.order_id
          : null;
      const listingId =
        typeof session.metadata?.listing_id === "string"
          ? session.metadata.listing_id
          : null;

      if (!orderId && !listingId) {
        return NextResponse.json({ received: true });
      }

      const admin = getSupabaseAdmin();
      let orderQuery = admin
        .from("orders")
        .select(
          "id,listing_id,status,stripe_session_id,amount_total,application_fee_amount,currency,buyer_email,stripe_account_id",
        );

      if (orderId) {
        orderQuery = orderQuery.eq("id", orderId);
      } else if (listingId) {
        orderQuery = orderQuery.eq("listing_id", listingId);
      }
      const { data: order } = await orderQuery.maybeSingle();

      if (!order) {
        return NextResponse.json({ received: true });
      }

      if (order.status === "paid") {
        return NextResponse.json({ received: true });
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      if (!order.listing_id) {
        return NextResponse.json({ received: true });
      }

      const listingLookup = await admin
        .from("listings")
        .select("id,status")
        .eq("id", order.listing_id)
        .maybeSingle();
      if (!listingLookup.data) {
        return NextResponse.json({ received: true });
      }

      if (listingLookup.data.status === "sold") {
        await admin
          .from("orders")
          .update({ status: "needs_refund" })
          .eq("id", order.id);
        return NextResponse.json({ received: true });
      }

      const amountTotal =
        typeof session.amount_total === "number"
          ? session.amount_total
          : order.amount_total;
      const applicationFeeAmount = order.application_fee_amount;

      const { error: orderUpdateError } = await admin
        .from("orders")
        .update({
          stripe_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId,
          amount_total: amountTotal,
          application_fee_amount: applicationFeeAmount,
          currency: session.currency ?? "usd",
          buyer_email: session.customer_details?.email ?? session.customer_email,
          stripe_account_id: event.account ?? null,
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", order.id);
      if (orderUpdateError) {
        console.error("Could not update a matched Stripe order.");
        return NextResponse.json({ error: "Database update failed." }, { status: 500 });
      }

      const { error: listingUpdateError } = await admin
        .from("listings")
        .update({ status: "sold", sold_at: new Date().toISOString() })
        .eq("id", order.listing_id)
        .eq("status", "available");
      if (listingUpdateError) {
        console.error("Could not mark a matched listing sold.");
        return NextResponse.json({ error: "Database update failed." }, { status: 500 });
      }
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Webhook processing failed.");
    }
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
