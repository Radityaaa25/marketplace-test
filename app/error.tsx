"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Marketplace page error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          We couldn’t load this page. Please try again.
        </p>
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
