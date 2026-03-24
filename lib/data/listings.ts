// lib/data/listings.ts
// Server-only — ne pas importer dans des Client Components.
import { supabaseServerPublic } from "@/utils/supabase/server-public";
import { TABLES, LISTING_COLUMNS } from "@/lib/config";
import type { Listing } from "@/lib/types";

const parseListingCoords = (listing: any): Listing => {
  const lat =
    typeof listing?.lat === "string"
      ? parseFloat(listing.lat)
      : typeof listing?.lat === "number"
        ? listing.lat
        : null;

  const lng =
    typeof listing?.lng === "string"
      ? parseFloat(listing.lng)
      : typeof listing?.lng === "number"
        ? listing.lng
        : null;

  return { ...listing, lat, lng } as Listing;
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
      `id, name, address, lat, lng, active, clerk_user_id, osm_id,
       availability, product_type, certifications, purchase_mode,
       production_method, additional_services, rating, description,
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
