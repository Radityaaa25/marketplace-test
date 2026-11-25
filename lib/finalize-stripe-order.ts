import "server-only";

import type Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type FinalizeOrderResult =
  | "paid"
  | "needs_refund"
  | "not_found"
  | "already_paid"
  | "expired"
  | "ignored";

export async function finalizeStripeOrder(
  session: Stripe.Checkout.Session,
  connectedAccountId: string | null,
): Promise<FinalizeOrderResult> {
  if (
    session.payment_status !== "paid" ||
    !connectedAccountId ||
    (!session.metadata?.order_id && !session.metadata?.listing_id)
  ) {
    return "ignored";
  }

  const admin = getSupabaseAdmin();
  let orderQuery = admin
    .from("orders")
    .select(
      "id,listing_id,status,stripe_account_id,application_fee_amount,stripe_session_id",
    );
  if (session.metadata.order_id) {
    orderQuery = orderQuery.eq("id", session.metadata.order_id);
  } else if (session.metadata.listing_id) {
    orderQuery = orderQuery
      .eq("listing_id", session.metadata.listing_id)
      .eq("stripe_account_id", connectedAccountId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);
  } else {
    return "ignored";
  }
  const { data: order, error: lookupError } = await orderQuery.maybeSingle();

  if (lookupError) {
    throw new Error("Could not look up the Stripe order.");
  }
  if (!order || !order.listing_id) {
    return "not_found";
  }
  if (
    session.metadata.listing_id &&
    session.metadata.listing_id !== order.listing_id
  ) {
    return "not_found";
  }
  if (order.stripe_account_id !== connectedAccountId) {
    return "not_found";
  }
  if (order.status === "paid") {
    return order.stripe_session_id === session.id ? "paid" : "already_paid";
  }
  if (order.status === "needs_refund" || order.status === "expired") {
    return order.status;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const { data: result, error: finalizeError } = await admin.rpc(
    "marketplace_finalize_order",
    {
      p_order_id: order.id,
      p_session_id: session.id,
      p_payment_intent_id: paymentIntentId,
      p_amount_total: session.amount_total,
      p_application_fee_amount: order.application_fee_amount,
      p_currency: session.currency,
      p_buyer_email: session.customer_details?.email ?? session.customer_email,
      p_stripe_account_id: connectedAccountId,
      p_paid_at: new Date().toISOString(),
    },
  );

  if (finalizeError) {
    throw new Error("Could not finalize the Stripe order.");
  }
  if (
    result === "paid" ||
    result === "needs_refund" ||
    result === "not_found" ||
    result === "already_paid"
  ) {
    return result;
  }
  return "ignored";
}
