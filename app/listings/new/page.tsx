import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ListingForm } from "@/components/listing-form";
import { Navbar } from "@/components/navbar";

export default function NewListingPage() {
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Navbar initialQuery="" />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#1877f2]"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to Marketplace
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7">
            <p className="text-sm font-semibold text-[#1877f2]">
              Sell to your community
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Create a listing
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Add a few details to help your item find a new home.
            </p>
          </div>
          <ListingForm />
        </div>
      </main>
    </div>
  );
}
