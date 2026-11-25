import { Navbar } from "@/components/navbar";
import { SellerConnectForm } from "@/components/seller-connect-form";

export default async function SellerConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const messages: Record<string, string> = {
    invalid_email: "Enter a valid seller email.",
    seller_not_found: "No Stripe seller account was found for that email.",
    onboarding_refresh_failed: "Stripe onboarding could not be resumed.",
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Navbar initialQuery="" />
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-[#1877f2]">Seller payments</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Sell / Get paid
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Connect a Stripe Express account to receive direct payments.
          </p>
          {params.error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {messages[params.error] ?? "Could not continue Stripe onboarding."}
            </p>
          )}
          <SellerConnectForm />
        </div>
      </main>
    </div>
  );
}
