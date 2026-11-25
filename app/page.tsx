import { CategorySidebar, CategoryTabs } from "@/components/category-navigation";
import { ListingGrid } from "@/components/listing-grid";
import { Navbar } from "@/components/navbar";
import { CATEGORIES, isCategory } from "@/lib/constants";
import { getListings } from "@/lib/listings";
import type { Listing } from "@/lib/types";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const category = isCategory(params.category) ? params.category : "All";
  const query = params.q?.trim() ?? "";

  let listings: Listing[] = [];
  let errorMessage: string | null = null;
  try {
    const result = await getListings({ category, query });
    listings = result.data.map((listing) => ({
      ...listing,
      status: listing.status ?? "available",
      sold_at: listing.sold_at ?? null,
    }));
    errorMessage = result.error;
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to connect to the marketplace.";
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Navbar initialQuery={query} />
      <div className="mx-auto flex max-w-[1440px] gap-8 px-4 pb-14 pt-7 sm:px-6 lg:px-8">
        <CategorySidebar activeCategory={category} query={query} />
        <main className="min-w-0 flex-1">
          <CategoryTabs activeCategory={category} query={query} />
          <section aria-labelledby="marketplace-heading">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h1
                  id="marketplace-heading"
                  className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]"
                >
                  {query ? "Search results" : "Today’s picks"}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {query
                    ? `Results for “${query}”`
                    : category === "All"
                      ? "Discover great finds in your community"
                      : `Browse ${category.toLowerCase()} near you`}
                </p>
              </div>
            </div>
            {errorMessage ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
              >
                <p className="font-semibold">We couldn’t load listings.</p>
                <p className="mt-1">
                  {errorMessage}. Check your Supabase environment variables and
                  run <code>supabase/marketplace.sql</code>.
                </p>
              </div>
            ) : (
              <ListingGrid listings={listings} />
            )}
          </section>
          <p className="sr-only">{CATEGORIES.length} marketplace categories</p>
        </main>
      </div>
    </div>
  );
}
