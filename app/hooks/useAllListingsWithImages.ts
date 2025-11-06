// hooks/useAllListingsWithImages.ts - Version corrigée avec filtrage géographique et transformation coordonnées

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { TABLES, LISTING_COLUMNS } from "@/lib/config";
import type { Listing, MapBounds } from "@/lib/types";

/**
 * Interface pour le résultat du hook
 */
interface UseAllListingsWithImagesResult {
  listings: Listing[];
  isLoading: boolean;
  error: string | null;
  refetch: (bounds?: MapBounds | null) => void;
}

/**
 * Options pour le hook
 */
interface UseAllListingsWithImagesOptions {
  bounds?: MapBounds | null;
  limit?: number;
  autoFetch?: boolean;
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
 * Hook pour récupérer tous les listings actifs avec leurs images
 *
 * ✅ AMÉLIORATIONS :
 * - Support du filtrage géographique
 * - Transformation coordonnées string → number
 * - Limite configurable pour éviter la surcharge
 * - Gestion du loading et des erreurs
 * - Fonction de refetch avec bounds
 * - Configuration centralisée des tables et colonnes
 *
 * @param options - Options de configuration
 * @returns {UseAllListingsWithImagesResult} État des listings avec actions
 */
export function useAllListingsWithImages(
  options: UseAllListingsWithImagesOptions = {}
): UseAllListingsWithImagesResult {
  const {
    bounds = null,
    limit = 100, // ✅ LIMITE par défaut pour éviter surcharge
    autoFetch = true,
  } = options;

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fonction pour récupérer tous les listings depuis Supabase
   * ✅ AVEC : Support des bounds géographiques + transformation coordonnées
   */
  const fetchAllListings = useCallback(
    async (customBounds?: MapBounds | null): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        // ✅ Base query avec configuration centralisée
        let query = supabase
          .from(TABLES.LISTING)
          .select(
            `
            *,
            ${TABLES.LISTING_IMAGES}(id, url)
          `
          )
          .eq(LISTING_COLUMNS.ACTIVE, true);

        // ✅ FILTRAGE GÉOGRAPHIQUE
        const activeBounds = customBounds || bounds;
        if (activeBounds) {
          query = query
            .gte("lat", activeBounds.sw.lat)
            .lte("lat", activeBounds.ne.lat)
            .gte("lng", activeBounds.sw.lng)
            .lte("lng", activeBounds.ne.lng);

          console.log(
            "[useAllListingsWithImages] Applied geographic filter:",
            activeBounds
          );
        }

        // ✅ Limite et ordre
        query = query
          .order(LISTING_COLUMNS.CREATED_AT, { ascending: false })
          .limit(limit);

        const { data, error } = await query;

        if (error) {
          throw new Error(error.message);
        }

        // ✅ TRANSFORMATION des coordonnées avant setState
        const transformedListings = (data || []).map(parseListingCoords);

        console.log(
          `[useAllListingsWithImages] Fetched ${transformedListings.length} listings${
            activeBounds ? " with geographic filter" : ""
          }`
        );

        setListings(transformedListings); // ✅ Données transformées
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";

        console.error("Erreur lors de la récupération des listings:", err);
        setError(errorMessage);

        toast.error("Erreur lors du chargement des listings.", {
          description: "Veuillez réessayer dans quelques instants.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [bounds, limit]
  );

  /**
   * Effet pour charger les listings au montage du composant
   * ✅ AVEC contrôle autoFetch
   */
  useEffect(() => {
    if (autoFetch) {
      fetchAllListings();
    }
  }, [fetchAllListings, autoFetch]);

  return {
    listings,
    isLoading,
    error,
    refetch: fetchAllListings,
  };
}

/**
 * ✅ HOOK spécialisé pour les listings dans une zone géographique
 * Utilise le hook principal avec des options optimisées pour la géolocalisation
 */
export function useListingsInBounds(bounds: MapBounds | null) {
  return useAllListingsWithImages({
    bounds,
    limit: 50, // Limite plus petite pour la géolocalisation
    autoFetch: !!bounds, // Fetch automatique seulement si bounds fournis
  });
}

/**
 * ✅ HOOK pour tous les listings (sans filtrage géographique)
 * Pour les pages d'administration ou de listing global
 */
export function useAllListingsGlobal() {
  return useAllListingsWithImages({
    bounds: null,
    limit: 200, // Limite plus élevée pour vue globale
    autoFetch: true,
  });
}

/**
 * ✅ HOOK avec synchronisation automatique pour une zone spécifique
 * Combine géolocalisation + refetch automatique
 */
export function useListingsWithAutoSync(
  bounds: MapBounds | null,
  interval: number = 30000
) {
  const result = useListingsInBounds(bounds);

  useEffect(() => {
    if (!bounds) return;

    const syncInterval = setInterval(() => {
      console.log("[useListingsWithAutoSync] Auto-refresh triggered");
      result.refetch(bounds);
    }, interval);

    return () => clearInterval(syncInterval);
  }, [bounds, interval, result.refetch]);

  return result;
}
