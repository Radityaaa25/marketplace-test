import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = z
    .object({
      sessionId: z.string().startsWith("cs_").min(10),
      account: z.string().startsWith("acct_").optional(),
    })
    .safeParse({
      sessionId: params.get("session_id"),
      account: params.get("account") || undefined,
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

    if (
      parsed.data.account &&
      order.stripe_account_id &&
      order.stripe_account_id !== parsed.data.account
    ) {
      return NextResponse.json({ pending: true });
    }

    let listingTitle: string | null = null;
    if (order.listing_id) {
      const { data: listing } = await admin
        .from("listings")
        .select("title")
        .eq("id", order.listing_id)
        .maybeSingle();
      listingTitle = listing?.title ?? null;
    }

    return NextResponse.json({
      id: order.id,
      status: order.status,
      amountTotal: order.amount_total,
      applicationFeeAmount: order.application_fee_amount,
      currency: order.currency,
      sellerEmail: order.seller_email,
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
