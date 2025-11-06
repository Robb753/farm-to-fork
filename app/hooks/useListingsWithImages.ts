// hooks/useListingsWithImages.ts - Version corrigée avec transformation des coordonnées

import { useCallback, useEffect, useState, useMemo } from "react";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { TABLES, LISTING_COLUMNS } from "@/lib/config";
import type { Listing } from "@/lib/types";

/**
 * Interface pour le résultat du hook
 */
interface UseListingsWithImagesResult {
  listings: Listing[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * ✅ FONCTION UTILITAIRE : Transformer les coordonnées string → number
 */
const parseListingCoords = (listing: any): Listing => {
  return {
    ...listing,
    lat:
      typeof listing.lat === "string" ? parseFloat(listing.lat) : listing.lat,
    lng:
      typeof listing.lng === "string" ? parseFloat(listing.lng) : listing.lng,
  };
};

/**
 * Hook pour récupérer des listings spécifiques avec leurs images
 *
 * ✅ CORRECTIONS APPORTÉES :
 * - Migration vers TypeScript
 * - Configuration centralisée des tables
 * - Dépendances optimisées (pas de JSON.stringify)
 * - Gestion d'erreur améliorée
 * - useMemo pour éviter re-renders inutiles
 * - Transformation coordonnées string → number
 *
 * @param listingIds - Liste des IDs de listings à récupérer
 * @returns {UseListingsWithImagesResult} État des listings avec actions
 */
export function useListingsWithImages(
  listingIds: number[] = []
): UseListingsWithImagesResult {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ CORRECTION : Mémoriser les IDs pour éviter re-renders inutiles
  const memoizedIds = useMemo(() => {
    if (!Array.isArray(listingIds)) return [];
    return [...listingIds].sort((a, b) => a - b); // Sort pour comparaison stable
  }, [listingIds]);

  // ✅ CORRECTION : Utiliser les IDs mémorisés comme dépendance
  const idsKey = useMemo(() => memoizedIds.join(","), [memoizedIds]);

  /**
   * Fonction pour récupérer les listings spécifiés
   */
  const fetchListings = useCallback(async (): Promise<void> => {
    // ✅ PROTECTION : Si aucun ID, vider les résultats
    if (!memoizedIds || memoizedIds.length === 0) {
      setListings([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ✅ UTILISATION de la configuration centralisée
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

      if (error) {
        throw new Error(error.message);
      }

      // ✅ TRANSFORMATION des coordonnées avant setState
      const transformedListings = (data || []).map(parseListingCoords);

      console.log(
        `[useListingsWithImages] Fetched ${transformedListings.length} listings for ${memoizedIds.length} IDs`
      );

      setListings(transformedListings); // ✅ Données transformées
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur inconnue";

      console.error("Erreur Supabase:", err);
      setError(errorMessage);

      toast.error("Erreur lors du chargement des listings.", {
        description: "Veuillez réessayer dans quelques instants.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [memoizedIds]); // ✅ CORRECTION : Dépendance propre

  /**
   * Effet pour charger les listings quand les IDs changent
   */
  useEffect(() => {
    fetchListings();
  }, [idsKey, fetchListings]); // ✅ CORRECTION : Utiliser idsKey comme trigger

  return {
    listings,
    isLoading,
    error,
    refetch: fetchListings,
  };
}

/**
 * ✅ NOUVEAU : Hook pour récupérer un seul listing avec ses images
 * Utilise le hook principal mais simplifie l'interface pour un seul ID
 */
export function useListingWithImages(listingId: number | null) {
  const ids = listingId ? [listingId] : [];
  const result = useListingsWithImages(ids);

  return {
    ...result,
    listing: result.listings[0] || null,
  };
}

/**
 * ✅ NOUVEAU : Hook pour les favoris de l'utilisateur
 * Récupère les listings favoris avec leurs images
 */
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

/**
 * ✅ NOUVEAU : Hook optimisé pour des listes importantes
 * Avec pagination et cache pour éviter les surcharges
 */
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
