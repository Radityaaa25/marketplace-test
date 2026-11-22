"use client";

import { useState } from "react";
import { PackageSearch } from "lucide-react";
import type { Listing } from "@/lib/types";
import { ListingCard } from "@/components/listing-card";
import { ViewToggle, type ListingView } from "@/components/view-toggle";

export function ListingGrid({ listings }: { listings: Listing[] }) {
  const [view, setView] = useState<ListingView>("grid");

  if (listings.length === 0) {
    return (
      <div className="flex min-h-[310px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
        <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <PackageSearch size={25} aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold text-slate-900">
          No listings found
        </h2>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          Try another search or category. New finds show up every day.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <ViewToggle view={view} onChange={setView} />
      </div>
      <div
        className={
          view === "grid"
            ? "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 2xl:grid-cols-5"
            : "grid grid-cols-1 gap-3"
        }
      >
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} view={view} />
        ))}
      </div>
    </>
  );
}
