import { Navbar } from "@/components/navbar";
import { OrderSuccess } from "@/components/order-success";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; account?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Navbar initialQuery="" />
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <OrderSuccess
          sessionId={params.session_id ?? null}
        />
      </main>
    </div>
  );
}
