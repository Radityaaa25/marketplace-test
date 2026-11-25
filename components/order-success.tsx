"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type OrderSummary = {
  id: string;
  status: "pending" | "paid" | "needs_refund" | "expired";
  amountTotal: number | null;
  applicationFeeAmount: number | null;
  currency: string;
  sellerEmail: string | null;
  listingTitle: string | null;
};

function formatCents(amount: number | null, currency: string): string {
  if (amount === null) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export function OrderSuccess({
  sessionId,
}: {
  sessionId: string | null;
}) {
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing Stripe checkout session.");
      return;
    }

    let stopped = false;
    let timer: number | null = null;

    async function poll() {
      try {
        const response = await fetch(
          `/api/stripe/order?session_id=${encodeURIComponent(sessionId ?? "")}`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as
          | OrderSummary
          | { error?: string };
        if (!response.ok) {
          if (!stopped) {
            setError(
              "error" in payload
                ? payload.error ?? "Could not load the order."
                : "Could not load the order.",
            );
          }
          return;
        }
        if ("id" in payload) {
          setOrder(payload);
          if (
            payload.status === "paid" ||
            payload.status === "needs_refund" ||
            payload.status === "expired"
          ) {
            stopped = true;
            return;
          }
        }
      } catch {
        if (!stopped) {
          setError("Could not check payment status.");
        }
      }

      setAttempts((current) => {
        const next = current + 1;
        if (next >= 15) {
          stopped = true;
          return next;
        }
        timer = window.setTimeout(poll, 2000);
        return next;
      });
    }

    void poll();
    return () => {
      stopped = true;
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [sessionId]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
      {error ? (
        <>
          <h1 className="text-xl font-bold text-slate-900">
            Order status unavailable
          </h1>
          <p role="alert" className="mt-2 text-sm text-red-700">
            {error}
          </p>
        </>
      ) : order?.status === "paid" ? (
        <>
          <CheckCircle2 className="mx-auto text-green-600" size={38} />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Payment confirmed
          </h1>
          <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4 text-left text-sm">
            <SummaryRow label="Item" value={order.listingTitle ?? "Marketplace listing"} />
            <SummaryRow label="Seller" value={order.sellerEmail ?? "—"} />
            <SummaryRow
              label="Amount"
              value={formatCents(order.amountTotal, order.currency)}
            />
            <SummaryRow
              label="Platform fee (10%)"
              value={formatCents(order.applicationFeeAmount, order.currency)}
            />
            <SummaryRow label="Status" value="Paid" />
          </div>
        </>
      ) : order?.status === "needs_refund" ? (
        <>
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Refund required
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This listing was already sold. The payment must be refunded.
          </p>
        </>
      ) : order?.status === "expired" ? (
        <>
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Checkout expired
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This payment session expired. Return to the listing to try again.
          </p>
        </>
      ) : (
        <>
          <LoaderCircle className="mx-auto animate-spin text-[#1877f2]" size={36} />
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Processing payment…
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            We are confirming the payment with Stripe.
          </p>
          {attempts >= 15 && (
            <p className="mt-3 text-sm text-slate-500">
              Confirmation is taking longer than usual. You can refresh this page.
            </p>
          )}
        </>
      )}
      <Button href="/" variant="secondary" className="mt-6 w-full">
        Back to Marketplace
      </Button>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="break-all text-right font-semibold text-slate-900">{value}</span>
    </div>
  );
}
