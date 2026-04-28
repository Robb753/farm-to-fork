// lib/data/listings.ts
// Server-only — ne pas importer dans des Client Components.
import { cache } from "react";
import { supabaseServerPublic } from "@/utils/supabase/server-public";
import { TABLES, LISTING_COLUMNS } from "@/lib/config";
import type { Listing } from "@/lib/types";
import type { Database } from "@/lib/types/database";

export type ListingWithImages =
  Database["public"]["Tables"]["listing"]["Row"] & {
    listingImages: Database["public"]["Tables"]["listingImages"]["Row"][];
  };

const parseListingCoords = (listing: Record<string, unknown>): Listing => {
  const lat =
    typeof listing.lat === "string"
      ? parseFloat(listing.lat)
      : typeof listing.lat === "number"
        ? listing.lat
        : null;

  const lng =
    typeof listing.lng === "string"
      ? parseFloat(listing.lng)
      : typeof listing.lng === "number"
        ? listing.lng
        : null;

  return { ...listing, lat, lng } as unknown as Listing;
};

export interface GetLieuxFilters {
  ville?: string;
  type?: string;
}

/**
 * Fetch server-side de tous les lieux actifs ou non revendiqués.
 * Filtrage géographique et par critères : côté client via Zustand.
 */
export async function getLieux(
  _filters?: GetLieuxFilters
): Promise<Listing[]> {
  const { data, error } = await supabaseServerPublic
    .from(TABLES.LISTING)
    .select(
      `id, name, address, lat, lng, active, clerk_user_id, osm_id, slug,
       availability, product_type, certifications, purchase_mode,
       production_method, additional_services, description,
       created_at, ${TABLES.LISTING_IMAGES}(id, url)`
    )
    .or("active.eq.true,and(osm_id.not.is.null,clerk_user_id.is.null)")
    .order(LISTING_COLUMNS.CREATED_AT, { ascending: false })
    .limit(200);

  if (error) {
    console.error("[getLieux] Supabase error:", error);
    return [];
  }

  return (data ?? []).map(parseListingCoords);
}

export const getListing = cache(
  async (id: string): Promise<ListingWithImages | null> => {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) return null;

    const { data, error } = await supabaseServerPublic
      .from(TABLES.LISTING)
      .select(`*, ${TABLES.LISTING_IMAGES}(*)`)
      .eq("id", parsedId)
      .or(
        "active.eq.true,and(active.eq.false,osm_id.not.is.null,clerk_user_id.is.null)",
      )
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // no rows
      console.error("[getListing] Supabase error:", error);
      return null;
    }

    return data as ListingWithImages;
  }
);

export const getListingBySlug = cache(
  async (slug: string): Promise<ListingWithImages | null> => {
    const { data, error } = await supabaseServerPublic
      .from(TABLES.LISTING)
      .select(`*, ${TABLES.LISTING_IMAGES}(*)`)
      .eq("slug", slug)
      .or("active.eq.true,and(active.eq.false,osm_id.not.is.null,clerk_user_id.is.null)")
      .single();
    if (error) {
      if (error.code === "PGRST116") return null;
      console.error("[getListingBySlug] Supabase error:", error);
      return null;
    }
    return data as ListingWithImages;
  }
);
