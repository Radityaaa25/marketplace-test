import { NextResponse } from "next/server";
import { z } from "zod";
import { finalizeStripeOrder } from "@/lib/finalize-stripe-order";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = z
    .object({
      sessionId: z.string().startsWith("cs_").min(10),
    })
    .safeParse({
      sessionId: params.get("session_id"),
    });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout session." }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: order, error } = await admin
      .from("orders")
      .select(
        "id,listing_id,seller_email,stripe_account_id,stripe_session_id,amount_total,application_fee_amount,currency,status",
      )
      .eq("stripe_session_id", parsed.data.sessionId)
      .maybeSingle();

    if (error) {
      console.error("Could not look up order status.");
      return NextResponse.json(
        { error: "Could not load the order." },
        { status: 500 },
      );
    }
    if (!order) {
      return NextResponse.json({ pending: true });
    }

    if (order.status === "pending") {
      if (!order.stripe_account_id || !order.stripe_session_id) {
        return NextResponse.json({ pending: true });
      }

      try {
        const session = await getStripe().checkout.sessions.retrieve(
          parsed.data.sessionId,
          {},
          { stripeAccount: order.stripe_account_id },
        );
        if (
          session.id === order.stripe_session_id &&
          session.metadata?.order_id === order.id &&
          session.metadata?.listing_id === order.listing_id &&
          session.payment_status === "paid"
        ) {
          await finalizeStripeOrder(session, order.stripe_account_id);
        }
      } catch {
        console.error("Could not verify pending order with Stripe.");
        return NextResponse.json(
          { error: "Could not verify payment yet. Refresh to try again." },
          { status: 502 },
        );
      }
    }

    const { data: refreshedOrder, error: refreshError } = await admin
      .from("orders")
      .select(
        "id,listing_id,seller_email,stripe_account_id,stripe_session_id,amount_total,application_fee_amount,currency,status",
      )
      .eq("id", order.id)
      .single();
    if (refreshError) {
      console.error("Could not reload order status.");
      return NextResponse.json({ error: "Could not load the order." }, { status: 500 });
    }

    let listingTitle: string | null = null;
    if (refreshedOrder.listing_id) {
      const { data: listing } = await admin
        .from("listings")
        .select("title")
        .eq("id", refreshedOrder.listing_id)
        .maybeSingle();
      listingTitle = listing?.title ?? null;
    }

    return NextResponse.json({
      id: refreshedOrder.id,
      status: refreshedOrder.status,
      amountTotal: refreshedOrder.amount_total,
      applicationFeeAmount: refreshedOrder.application_fee_amount,
      currency: refreshedOrder.currency,
      sellerEmail: refreshedOrder.seller_email,
      listingTitle,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Could not load order status.");
    }
    return NextResponse.json(
      { error: "Could not load the order." },
      { status: 500 },
    );
  }
}
