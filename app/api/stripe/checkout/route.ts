import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppUrl } from "@/lib/app-url";
import { getStripe, PLATFORM_FEE_PERCENT } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const inputSchema = z.object({
  listingId: z.string().uuid(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid listing." }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: listing, error: listingError } = await admin
      .from("listings")
      .select("id,title,description,price,seller_email,image_url,status")
      .eq("id", parsed.data.listingId)
      .maybeSingle();

    if (listingError) {
      console.error("Checkout listing lookup failed.");
      return NextResponse.json(
        { error: "Could not verify this listing." },
        { status: 500 },
      );
    }
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    if (listing.status === "sold") {
      return NextResponse.json(
        { error: "This listing has already been sold." },
        { status: 409 },
      );
    }

    const amountTotal = Math.round(Number(listing.price) * 100);
    if (!Number.isFinite(amountTotal) || amountTotal < 50) {
      return NextResponse.json(
        { error: "Free item" },
        { status: 400 },
      );
    }

    const { data: seller, error: sellerError } = await admin
      .from("sellers")
      .select("stripe_account_id,charges_enabled")
      .ilike("email", listing.seller_email)
      .maybeSingle();

    if (sellerError) {
      console.error("Checkout seller lookup failed.");
      return NextResponse.json(
        { error: "Could not verify the seller." },
        { status: 500 },
      );
    }
    if (!seller?.charges_enabled) {
      return NextResponse.json(
        { error: "Seller hasn't connected Stripe yet" },
        { status: 409 },
      );
    }

    const applicationFeeAmount = Math.round(
      (amountTotal * PLATFORM_FEE_PERCENT) / 100,
    );
    const orderId = crypto.randomUUID();
    const { error: orderError } = await admin.from("orders").insert({
      id: orderId,
      listing_id: listing.id,
      seller_email: listing.seller_email,
      stripe_account_id: seller.stripe_account_id,
      amount_total: amountTotal,
      application_fee_amount: applicationFeeAmount,
      currency: "usd",
      stripe_session_id: null,
      stripe_payment_intent_id: null,
      buyer_email: null,
      status: "pending",
    });
    if (orderError) {
      console.error("Could not create checkout order.");
      return NextResponse.json(
        { error: "Could not start checkout." },
        { status: 500 },
      );
    }

    const appUrl = getAppUrl(request);
    const session = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: amountTotal,
              product_data: {
                name: listing.title,
                description: listing.description.slice(0, 250),
                images: listing.image_url ? [listing.image_url] : undefined,
              },
            },
          },
        ],
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
        },
        metadata: {
          listing_id: listing.id,
          order_id: orderId,
        },
        success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&account=${encodeURIComponent(seller.stripe_account_id)}`,
        cancel_url: `${appUrl}/listings/${listing.id}?cancelled=1`,
      },
      { stripeAccount: seller.stripe_account_id },
    );

    await admin
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", orderId);

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout did not return a redirect URL." },
        { status: 500 },
      );
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Stripe checkout failed:", error.message);
    }
    return NextResponse.json(
      { error: "Could not start Stripe checkout." },
      { status: 500 },
    );
  }
}
