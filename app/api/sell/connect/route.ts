import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppUrl } from "@/lib/app-url";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const inputSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
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
    return NextResponse.json(
      { error: "Enter a valid seller email." },
      { status: 400 },
    );
  }

  try {
    const admin = getSupabaseAdmin();
    const stripe = getStripe();
    const email = parsed.data.email;

    const { data: existing, error: lookupError } = await admin
      .from("sellers")
      .select("id,stripe_account_id,charges_enabled")
      .eq("email", email)
      .maybeSingle();
    if (lookupError) {
      console.error("Seller lookup failed.");
      return NextResponse.json(
        { error: "Could not look up the seller." },
        { status: 500 },
      );
    }

    if (existing?.charges_enabled) {
      return NextResponse.json({
        alreadyConnected: true,
        chargesEnabled: true,
      });
    }

    let accountId = existing?.stripe_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;

      const { error: insertError } = await admin.from("sellers").insert({
        email,
        stripe_account_id: accountId,
        charges_enabled: account.charges_enabled ?? false,
        payouts_enabled: account.payouts_enabled ?? false,
        details_submitted: account.details_submitted ?? false,
      });
      if (insertError) {
        console.error("Seller save failed.");
        return NextResponse.json(
          { error: "Could not save the Stripe account." },
          { status: 500 },
        );
      }
    }

    const appUrl = getAppUrl(request);
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${appUrl}/sell/connect/refresh?email=${encodeURIComponent(email)}`,
      return_url: `${appUrl}/sell/connect/return?email=${encodeURIComponent(email)}`,
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Stripe seller onboarding failed:", error.message);
    }
    return NextResponse.json(
      { error: "Could not start Stripe onboarding." },
      { status: 500 },
    );
  }
}
