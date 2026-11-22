import { getSupabaseClient } from "@/lib/supabase";
import type { Listing } from "@/lib/types";
import type { CategoryFilter } from "@/lib/constants";

const LISTING_FIELDS =
  "id,title,description,price,category,seller_email,image_url,created_at";

export async function getListings({
  category,
  query,
}: {
  category: CategoryFilter;
  query: string;
}): Promise<{ data: Listing[]; error: string | null }> {
  const supabase = getSupabaseClient();
  let request = supabase
    .from("listings")
    .select(LISTING_FIELDS)
    .order("created_at", { ascending: false });

  if (category !== "All") {
    request = request.eq("category", category);
  }

  const normalizedQuery = query.replace(/[(),]/g, " ").trim();
  if (normalizedQuery) {
    request = request.or(
      `title.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%`,
    );
  }

  const { data, error } = await request;
  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data ?? [], error: null };
}

export async function getListingById(
  id: string,
): Promise<{ data: Listing | null; error: string | null }> {
  const { data, error } = await getSupabaseClient()
    .from("listings")
    .select(LISTING_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
