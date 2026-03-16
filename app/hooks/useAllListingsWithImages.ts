// hooks/useAllListingsWithImages.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { TABLES, LISTING_COLUMNS } from "@/lib/config";
import type { Listing } from "@/lib/types";
import { useSupabaseWithClerk } from "@/utils/supabase/client";

/**
 * ✅ Supporte 2 formats de bounds si tu veux un jour filtrer SQL :
 * A) { north, south, east, west }  (ton store Mapbox)
 * B) { ne:{lat,lng}, sw:{lat,lng} } (ancien format)
 */
type BoundsStore = { north: number; south: number; east: number; west: number };
type BoundsSWNE = {
  ne: { lat: number; lng: number };
  sw: { lat: number; lng: number };
};

const isBoundsStore = (b: any): b is BoundsStore =>
  b &&
  typeof b.north === "number" &&
  typeof b.south === "number" &&
  typeof b.east === "number" &&
  typeof b.west === "number";

const isBoundsSWNE = (b: any): b is BoundsSWNE =>
  b &&
  b.ne &&
  b.sw &&
  typeof b.ne.lat === "number" &&
  typeof b.ne.lng === "number" &&
  typeof b.sw.lat === "number" &&
  typeof b.sw.lng === "number";

const toSWNE = (b: any): BoundsSWNE | null => {
  if (isBoundsSWNE(b)) return b;
  if (isBoundsStore(b)) {
    return {
      ne: { lat: b.north, lng: b.east },
      sw: { lat: b.south, lng: b.west },
    };
  }
  return null;
};

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

/**
 * (OPTIONNEL) ✅ Si un jour tu veux filtrer SQL par bounds (mais PAS nécessaire pour ton flow global)
 * - Robuste car accepte {north,south,east,west} ou {ne,sw}
 */
export function useListingsInBounds(
  bounds: any,
  options: { limit?: number; autoFetch?: boolean } = {}
) {
  const { limit = 100, autoFetch = !!bounds } = options;

  const supabase = useSupabaseWithClerk();

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extraire les primitives pour éviter qu'un objet bounds recréé à chaque
  // render du parent ne déclenche un re-fetch inutile.
  const b = toSWNE(bounds);
  const swLat = b?.sw.lat;
  const swLng = b?.sw.lng;
  const neLat = b?.ne.lat;
  const neLng = b?.ne.lng;

  const fetchInBounds = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from(TABLES.LISTING)
        .select(
          `id, name, address, lat, lng, active, clerk_user_id, osm_id,
           availability, product_type, certifications, created_at,
           ${TABLES.LISTING_IMAGES}(id, url)`
        )
        .eq(LISTING_COLUMNS.ACTIVE, true);

      if (swLat !== undefined && swLng !== undefined && neLat !== undefined && neLng !== undefined) {
        query = query
          .gte("lat", swLat)
          .lte("lat", neLat)
          .gte("lng", swLng)
          .lte("lng", neLng);
      }

      const { data, error } = await query
        .order(LISTING_COLUMNS.CREATED_AT, { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);

      setListings((data || []).map(parseListingCoords));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, swLat, swLng, neLat, neLng, limit]);

  useEffect(() => {
    if (autoFetch) fetchInBounds();
  }, [autoFetch, fetchInBounds]);

  return { listings, isLoading, error, refetch: fetchInBounds };
}
