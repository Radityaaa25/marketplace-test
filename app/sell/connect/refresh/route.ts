import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppUrl } from "@/lib/app-url";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const parsed = z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase())
    .safeParse(new URL(request.url).searchParams.get("email"));

  if (!parsed.success) {
    return NextResponse.redirect(
      `${getAppUrl(request)}/sell/connect?error=invalid_email`,
    );
  }

  try {
    const { data: seller } = await getSupabaseAdmin()
      .from("sellers")
      .select("stripe_account_id")
      .eq("email", parsed.data)
      .maybeSingle();

    if (!seller) {
      return NextResponse.redirect(
        `${getAppUrl(request)}/sell/connect?error=seller_not_found`,
      );
    }

    const appUrl = getAppUrl(request);
    const accountLink = await getStripe().accountLinks.create({
      account: seller.stripe_account_id,
      type: "account_onboarding",
      refresh_url: `${appUrl}/sell/connect/refresh?email=${encodeURIComponent(parsed.data)}`,
      return_url: `${appUrl}/sell/connect/return?email=${encodeURIComponent(parsed.data)}`,
    });
    return NextResponse.redirect(accountLink.url);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Stripe onboarding refresh failed:", error.message);
    }
    return NextResponse.redirect(
      `${getAppUrl(request)}/sell/connect?error=onboarding_refresh_failed`,
    );
  }
}
