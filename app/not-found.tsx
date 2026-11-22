import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-blue-50 text-[#1877f2]">
          <SearchX size={29} aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          This listing isn’t available
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          It may have been removed, or the link might be incorrect.
        </p>
        <Button href="/" className="mt-6">
          <ArrowLeft size={17} aria-hidden="true" />
          Back to Marketplace
        </Button>
      </div>
    </main>
  );
}
