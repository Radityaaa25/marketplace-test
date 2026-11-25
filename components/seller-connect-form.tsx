"use client";

import { CheckCircle2, LoaderCircle, WalletCards } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SellerConnectForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [alreadyConnected, setAlreadyConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAlreadyConnected(false);
    setIsLoading(true);
    try {
      const response = await fetch("/api/sell/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as {
        url?: string;
        alreadyConnected?: boolean;
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? "Could not start Stripe onboarding.");
        return;
      }
      if (payload.alreadyConnected) {
        setAlreadyConnected(true);
        return;
      }
      if (payload.url) {
        window.location.assign(payload.url);
      }
    } catch {
      setError("Could not start Stripe onboarding.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
      {alreadyConnected ? (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-green-800">
            <CheckCircle2 size={18} aria-hidden="true" />
            Already connected
          </div>
          <p className="mt-1 text-sm text-green-700">
            This seller is onboarded and ready to receive payments.
          </p>
        </div>
      ) : (
        <>
          <label htmlFor="seller-connect-email" className="block text-sm font-semibold text-slate-800">
            Seller email
          </label>
          <Input
            id="seller-connect-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seller@example.com"
          />
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                Connecting…
              </>
            ) : (
              <>
                <WalletCards size={17} aria-hidden="true" />
                Connect with Stripe
              </>
            )}
          </Button>
        </>
      )}
    </form>
  );
}
