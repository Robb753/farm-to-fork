// hooks/useAllListingsWithImages.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { TABLES, LISTING_COLUMNS } from "@/lib/config";
import type { Listing } from "@/lib/types";
import { useSupabaseWithClerk } from "@/utils/supabase/client";

/**
 * ✅ Convertit lat/lng string → number (Supabase peut renvoyer string selon types)
 * + garde une valeur number si possible
 */
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

  return {
    ...listing,
    lat,
    lng,
  } as Listing;
};

interface UseAllListingsWithImagesResult {
  listings: Listing[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseAllListingsWithImagesOptions {
  limit?: number;
  autoFetch?: boolean;
  onSuccess?: (listings: Listing[]) => void;
}

/**
 * ✅ GLOBAL (par défaut)
 * - Récupère TOUS les listings actifs + images
 * - Le filtrage géographique se fait dans Explore/store (filterListings)
 */
export function useAllListingsWithImages(
  options: UseAllListingsWithImagesOptions = {}
): UseAllListingsWithImagesResult {
  const { limit = 200, autoFetch = true, onSuccess } = options;

  // Keep a fresh ref so the callback never goes stale inside fetchAllListings
  // without adding it to useCallback deps (which would re-create the fetch fn).
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const supabase = useSupabaseWithClerk();

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchAllListings = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Récupère les fermes actives ET toutes les fermes non encore revendiquées (clerk_user_id null)
      const { data, error } = await supabase
        .from(TABLES.LISTING)
        .select(
          `id, name, address, lat, lng, active, clerk_user_id, osm_id,
           availability, product_type, certifications, created_at,
           ${TABLES.LISTING_IMAGES}(id, url)`
        )
        .or("active.eq.true,clerk_user_id.is.null")
        .order(LISTING_COLUMNS.CREATED_AT, { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);

      const transformed = (data || []).map(parseListingCoords);
      setListings(transformed);
      onSuccessRef.current?.(transformed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("Erreur lors de la récupération des listings:", err);
      setError(msg);

      toast.error("Erreur lors du chargement des listings.", {
        description: "Veuillez réessayer dans quelques instants.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, limit]);

  useEffect(() => {
    if (autoFetch) fetchAllListings();
  }, [autoFetch, fetchAllListings]);

  return {
    listings,
    isLoading,
    error,
    refetch: fetchAllListings,
  };
}

