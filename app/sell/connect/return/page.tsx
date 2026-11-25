import { CheckCircle2, CircleAlert } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { z } from "zod";
import { Button } from "@/components/ui/button";

export default async function ConnectReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const parsed = z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase())
    .safeParse(params.email);

  let complete = false;
  let resumeUrl: string | null = null;

  if (parsed.success) {
    try {
      const admin = getSupabaseAdmin();
      const { data: seller } = await admin
        .from("sellers")
        .select("stripe_account_id")
        .eq("email", parsed.data)
        .maybeSingle();

      if (seller) {
        const account = await getStripe().accounts.retrieve(seller.stripe_account_id);
        const update = {
          charges_enabled: account.charges_enabled ?? false,
          payouts_enabled: account.payouts_enabled ?? false,
          details_submitted: account.details_submitted ?? false,
        };
        const { error: updateError } = await admin
          .from("sellers")
          .update(update)
          .eq("stripe_account_id", seller.stripe_account_id);
        if (updateError) {
          throw new Error("Could not save seller onboarding status.");
        }
        complete = account.charges_enabled === true;
        if (!complete) {
          resumeUrl = `/sell/connect/refresh?email=${encodeURIComponent(parsed.data)}`;
        }
      }
    } catch {
      console.error("Could not refresh seller onboarding status.");
      complete = false;
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Navbar initialQuery="" />
      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          {complete ? (
            <>
              <CheckCircle2 className="mx-auto text-green-600" size={38} />
              <h1 className="mt-4 text-2xl font-bold text-slate-900">
                Onboarding complete
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                This seller is ready to receive payments.
              </p>
            </>
          ) : (
            <>
              <CircleAlert className="mx-auto text-amber-500" size={38} />
              <h1 className="mt-4 text-2xl font-bold text-slate-900">
                Onboarding incomplete
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Continue Stripe onboarding before accepting payments.
              </p>
              {resumeUrl && (
                <Button href={resumeUrl} className="mt-5">
                  Continue onboarding
                </Button>
              )}
            </>
          )}
          <Button href="/" variant="secondary" className="mt-4">
            Back to Marketplace
          </Button>
        </div>
      </main>
    </div>
  );
}
