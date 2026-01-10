// hooks/useListingsWithImages.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { TABLES, LISTING_COLUMNS } from "@/lib/config";
import type { Listing } from "@/lib/types";

interface UseListingsWithImagesResult {
  listings: Listing[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const parseListingCoords = (listing: any): Listing => ({
  ...listing,
  lat: typeof listing.lat === "string" ? parseFloat(listing.lat) : listing.lat,
  lng: typeof listing.lng === "string" ? parseFloat(listing.lng) : listing.lng,
});

export function useListingsWithImages(
  listingIds: number[] = []
): UseListingsWithImagesResult {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ IDs stables (triés) => évite re-fetch inutiles
  const memoizedIds = useMemo(() => {
    if (!Array.isArray(listingIds)) return [];
    return [...listingIds]
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
  }, [listingIds]);

  // ✅ Anti race condition / setState after unmount
  const requestIdRef = useRef(0);

  const fetchListings = useCallback(async (): Promise<void> => {
    // ✅ Aucun ID => état vide (pas de fetch)
    if (memoizedIds.length === 0) {
      setListings([]);
      setError(null);
      return;
    }

    const reqId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from(TABLES.LISTING)
        .select(
          `
            *,
            ${TABLES.LISTING_IMAGES}(id, url)
          `
        )
        .in("id", memoizedIds)
        .eq(LISTING_COLUMNS.ACTIVE, true)
        .order(LISTING_COLUMNS.CREATED_AT, { ascending: false });

      if (reqId !== requestIdRef.current) return; // ✅ réponse “ancienne” ignorée

      if (error) throw new Error(error.message);

      setListings((data || []).map(parseListingCoords));
    } catch (err) {
      if (reqId !== requestIdRef.current) return;

      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      console.error("Erreur Supabase:", err);
      setError(msg);

      toast.error("Erreur lors du chargement des listings.", {
        description: "Veuillez réessayer dans quelques instants.",
      });
    } finally {
      if (reqId === requestIdRef.current) setIsLoading(false);
    }
  }, [memoizedIds]);

  // ✅ Un seul trigger, propre
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return { listings, isLoading, error, refetch: fetchListings };
}

/* Helpers identiques à toi */

export function useListingWithImages(listingId: number | null) {
  const ids = listingId ? [listingId] : [];
  const result = useListingsWithImages(ids);
  return { ...result, listing: result.listings[0] || null };
}

export function useFavoriteListings(favoriteIds: number[]) {
  const { listings, isLoading, error, refetch } =
    useListingsWithImages(favoriteIds);
  return {
    favorites: listings,
    isLoadingFavorites: isLoading,
    favoritesError: error,
    refetchFavorites: refetch,
  };
}

export function useBatchListingsWithImages(
  listingIds: number[],
  batchSize: number = 20
) {
  const [currentBatch, setCurrentBatch] = useState(0);

  const currentIds = useMemo(() => {
    const start = currentBatch * batchSize;
    const end = start + batchSize;
    return listingIds.slice(start, end);
  }, [listingIds, currentBatch, batchSize]);

  const result = useListingsWithImages(currentIds);

  const loadMore = useCallback(() => {
    if ((currentBatch + 1) * batchSize < listingIds.length) {
      setCurrentBatch((prev) => prev + 1);
    }
  }, [currentBatch, batchSize, listingIds.length]);

  const hasMore = (currentBatch + 1) * batchSize < listingIds.length;

  return {
    ...result,
    loadMore,
    hasMore,
    currentBatch,
    totalBatches: Math.ceil(listingIds.length / batchSize),
  };
}
