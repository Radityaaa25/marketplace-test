import Image from "next/image";
import Link from "next/link";
import { formatPostedDate, formatPrice } from "@/lib/constants";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ListingCard({
  listing,
  view = "grid",
}: {
  listing: Listing;
  view?: "grid" | "list";
}) {
  const isList = view === "list";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={cn(
        "group overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(15,23,42,0.07)] outline-none transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.12)] focus-visible:ring-2 focus-visible:ring-[#1877f2] focus-visible:ring-offset-2",
        isList && "flex items-center",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-slate-100",
          isList ? "aspect-square w-28 shrink-0 sm:w-40" : "aspect-square w-full",
        )}
      >
        <Image
          src={listing.image_url}
          alt={listing.title}
          fill
          sizes={isList ? "(max-width: 640px) 112px, 160px" : "(max-width: 768px) 50vw, 240px"}
          className="object-cover transition duration-300 group-hover:scale-[1.035]"
          unoptimized
        />
      </div>
      <div className={cn("min-w-0", isList ? "p-4 sm:p-5" : "p-3.5")}>
        <p className="text-lg font-bold tracking-tight text-slate-900">
          {formatPrice(listing.price)}
        </p>
        <h2 className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-slate-800">
          {listing.title}
        </h2>
        <p className="mt-2 truncate text-xs text-slate-500">
          {listing.category} <span aria-hidden="true">·</span> {listing.location}
        </p>
        <p className="mt-1 truncate text-xs text-slate-400">
          {formatPostedDate(listing.created_at)}
        </p>
      </div>
    </Link>
  );
}
