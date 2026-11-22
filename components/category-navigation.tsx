import Link from "next/link";
import {
  Armchair,
  Baby,
  CarFront,
  CircleEllipsis,
  Gamepad2,
  Gift,
  House,
  Laptop,
  Shirt,
  Store,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES, type CategoryFilter } from "@/lib/constants";
import type { ListingCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const categoryIcons: Record<ListingCategory, LucideIcon> = {
  Vehicles: CarFront,
  "Property Rentals": House,
  Electronics: Laptop,
  "Home & Garden": Armchair,
  Clothing: Shirt,
  Hobbies: Gamepad2,
  Family: Baby,
  "Free Stuff": Gift,
  Other: CircleEllipsis,
};

function categoryHref(category: CategoryFilter, query: string) {
  const params = new URLSearchParams();
  if (category !== "All") {
    params.set("category", category);
  }
  if (query) {
    params.set("q", query);
  }
  const search = params.toString();
  return search ? `/?${search}` : "/";
}

function CategoryLink({
  category,
  active,
  query,
  compact = false,
}: {
  category: CategoryFilter;
  active: boolean;
  query: string;
  compact?: boolean;
}) {
  const Icon = category === "All" ? Store : categoryIcons[category];

  return (
    <Link
      href={categoryHref(category, query)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl text-sm font-medium transition-colors",
        compact ? "shrink-0 px-3.5 py-2.5" : "px-3 py-2.5",
        active
          ? "bg-blue-50 text-[#1877f2]"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      <Icon
        size={18}
        strokeWidth={active ? 2.2 : 1.8}
        className="shrink-0"
        aria-hidden="true"
      />
      <span className="whitespace-nowrap">{category}</span>
    </Link>
  );
}

export function CategorySidebar({
  activeCategory,
  query,
}: {
  activeCategory: CategoryFilter;
  query: string;
}) {
  return (
    <aside className="sticky top-[92px] hidden h-fit w-[236px] shrink-0 self-start lg:block">
      <h2 className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
        Browse by category
      </h2>
      <nav aria-label="Marketplace categories" className="space-y-1">
        <CategoryLink
          category="All"
          active={activeCategory === "All"}
          query={query}
        />
        {CATEGORIES.map((category) => (
          <CategoryLink
            key={category}
            category={category}
            active={activeCategory === category}
            query={query}
          />
        ))}
      </nav>
      <div className="mt-7 rounded-2xl bg-blue-50 p-4">
        <p className="text-sm font-semibold text-slate-900">
          Have something to sell?
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          List it for free and find a buyer nearby.
        </p>
        <Link
          href="/listings/new"
          className="mt-3 inline-block text-xs font-bold text-[#1877f2] hover:underline"
        >
          Create a listing →
        </Link>
      </div>
    </aside>
  );
}

export function CategoryTabs({
  activeCategory,
  query,
}: {
  activeCategory: CategoryFilter;
  query: string;
}) {
  return (
    <nav
      aria-label="Marketplace categories"
      className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:hidden"
    >
      <CategoryLink
        category="All"
        active={activeCategory === "All"}
        query={query}
        compact
      />
      {CATEGORIES.map((category) => (
        <CategoryLink
          key={category}
          category={category}
          active={activeCategory === category}
          query={query}
          compact
        />
      ))}
    </nav>
  );
}
