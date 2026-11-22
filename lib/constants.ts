import type { ListingCategory } from "@/lib/types";

export const CATEGORIES = [
  "Vehicles",
  "Property Rentals",
  "Electronics",
  "Home & Garden",
  "Clothing",
  "Hobbies",
  "Family",
  "Free Stuff",
  "Other",
] as const satisfies readonly ListingCategory[];

export type CategoryFilter = "All" | ListingCategory;

export function isCategory(value: unknown): value is ListingCategory {
  return (
    typeof value === "string" &&
    CATEGORIES.includes(value as ListingCategory)
  );
}

export function formatPrice(price: number): string {
  if (price === 0) {
    return "Free";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatPostedDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}
