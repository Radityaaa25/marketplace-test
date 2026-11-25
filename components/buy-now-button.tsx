"use client";

import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BuyNowButton({
  listingId,
  sellerReady,
  status,
  price,
}: {
  listingId: string;
  sellerReady: boolean;
  status: "available" | "sold";
  price: number;
}) {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("cancelled") === "1"
      ? "Checkout cancelled. The listing is still available."
      : null,
  );

  let reason: string | null = null;
  if (status === "sold") {
    reason = "Sold";
  } else if (price < 0.5) {
    reason = "Free item";
  } else if (!sellerReady) {
    reason = "Seller hasn't connected Stripe yet";
  }

  async function handleBuy() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? "Checkout could not be started.");
        return;
      }
      if (!payload.url) {
        setError("Checkout did not return a redirect URL.");
        return;
      }
      window.location.assign(payload.url);
    } catch {
      setError("Checkout could not be started. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-4">
      {reason ? (
        <button
          type="button"
          disabled
          className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-500"
        >
          {reason}
        </button>
      ) : (
        <Button
          type="button"
          onClick={handleBuy}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
              Starting checkout…
            </>
          ) : (
            <>
              <LockKeyhole size={16} aria-hidden="true" />
              Buy Now
            </>
          )}
        </Button>
      )}
      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
