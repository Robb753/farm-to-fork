// app/contexts/MapDataContext/useMapData.js
import { useCallback, useEffect, useRef, useState } from "react";
import { useMapState } from "./MapStateContext";
import { useListingState } from "./ListingStateContext";
import { useFilterState } from "./FilterStateContext";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

export function useMapData() {
  const { coordinates, setCoordinates, mapBounds, mapZoom } = useMapState();
  const {
    allListings,
    setAllListings,
    setFilteredListings,
    isLoading,
    setIsLoading,
    hasMore,
    setHasMore,
    setSelectedListingId,
  } = useListingState();

  const { filters, filterListings } = useFilterState();

  const previousBoundsRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Effet pour filtrer les listings quand les filtres changent
  useEffect(() => {
    if (allListings && allListings.length > 0) {
      // Appliquer les filtres aux résultats chargés
      const filtered = filterListings(allListings);
      setFilteredListings(filtered);
    }
  }, [allListings, filters, filterListings, setFilteredListings]);

  // Fonction pour récupérer les fermes
  const fetchListings = useCallback(
    async ({ page = 1, append = false, forceRefresh = false } = {}) => {
      // Éviter les appels multiples simultanés
      if (isFetchingRef.current && !forceRefresh) return;
      isFetchingRef.current = true;

      try {
        setIsLoading(true);

        // Si on rafraîchit la liste, on repart de zéro
        if (page === 1 && !append) {
          setHasMore(true);
        }

        // Création de la requête de base
        let query = supabase
          .from("listing")
          .select("*, listingImages(url, listing_id)", { count: "exact" });

        // Stocker les filtres actuels à utiliser pour cette requête
        const currentFilters = filters;

        // Ajout des filtres si présents
        if (
          currentFilters.product_type &&
          currentFilters.product_type.length > 0
        ) {
          query = query.contains("product_type", currentFilters.product_type);
        }

        if (
          currentFilters.certifications &&
          currentFilters.certifications.length > 0
        ) {
          query = query.contains(
            "certifications",
            currentFilters.certifications
          );
        }

        if (
          currentFilters.purchase_mode &&
          currentFilters.purchase_mode.length > 0
        ) {
          query = query.contains("purchase_mode", currentFilters.purchase_mode);
        }

        if (
          currentFilters.production_method &&
          currentFilters.production_method.length > 0
        ) {
          query = query.contains(
            "production_method",
            currentFilters.production_method
          );
        }

        if (
          currentFilters.additional_services &&
          currentFilters.additional_services.length > 0
        ) {
          query = query.contains(
            "additional_services",
            currentFilters.additional_services
          );
        }

        if (
          currentFilters.availability &&
          currentFilters.availability.length > 0
        ) {
          query = query.contains("availability", currentFilters.availability);
        }

        // Si nous avons des limites de carte, nous les utilisons pour filtrer
        if (mapBounds) {
          query = query
            .gte("lat", mapBounds.sw.lat)
            .lte("lat", mapBounds.ne.lat)
            .gte("lng", mapBounds.sw.lng)
            .lte("lng", mapBounds.ne.lng);
        } else if (coordinates) {
          // Si nous n'avons pas de bounds mais des coordonnées, nous cherchons dans un rayon
          // Calcul approximatif d'un rayon de recherche basé sur le zoom
          const radius = mapZoom ? Math.max(20 - mapZoom, 1) * 5 : 10; // en km

          // Conversion approximative en degrés (1 degré ~ 111km à l'équateur)
          const latDelta = radius / 111;
          const lngDelta =
            radius / (111 * Math.cos((coordinates.lat * Math.PI) / 180));

          query = query
            .gte("lat", coordinates.lat - latDelta)
            .lte("lat", coordinates.lat + latDelta)
            .gte("lng", coordinates.lng - lngDelta)
            .lte("lng", coordinates.lng + lngDelta);
        }

        // Pagination
        const limit = 20;
        query = query
          .range((page - 1) * limit, page * limit - 1)
          .order("created_at", { ascending: false });

        const { data, error, count } = await query;

        if (error) throw error;

        // Mise à jour de la liste
        if (append) {
          setAllListings((prev) => [...prev, ...data]);
        } else {
          setAllListings(data);
        }

        // Mise à jour de hasMore
        setHasMore(count > page * limit);

        // Si c'est la première fois ou s'il y a un forceRefresh, mettre à jour les bounds précédents
        if (!previousBoundsRef.current || forceRefresh) {
          previousBoundsRef.current = mapBounds;
        }

        return data;
      } catch (error) {
        console.error("Error fetching listings:", error);
        toast.error("Erreur lors du chargement des fermes");
        return [];
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [
      filters,
      mapBounds,
      coordinates,
      mapZoom,
      setAllListings,
      setHasMore,
      setIsLoading,
    ]
  );

  // Mise à jour des fermes quand les bounds changent significativement
  useEffect(() => {
    // Si nous n'avons pas encore de bounds précédents, ou si les bounds n'ont pas encore été définis, on ne fait rien
    if (!previousBoundsRef.current || !mapBounds) return;

    // Vérifier si les bounds ont significativement changé (pour éviter des requêtes trop fréquentes)
    const isBoundsChangeSignificant = () => {
      const prevBounds = previousBoundsRef.current;
      const currentBounds = mapBounds;

      // Calculer le chevauchement des zones
      const latOverlap =
        Math.min(prevBounds.ne.lat, currentBounds.ne.lat) -
        Math.max(prevBounds.sw.lat, currentBounds.sw.lat);
      const lngOverlap =
        Math.min(prevBounds.ne.lng, currentBounds.ne.lng) -
        Math.max(prevBounds.sw.lng, currentBounds.sw.lng);

      // Calculer les surfaces
      const prevArea =
        (prevBounds.ne.lat - prevBounds.sw.lat) *
        (prevBounds.ne.lng - prevBounds.sw.lng);
      const currentArea =
        (currentBounds.ne.lat - currentBounds.sw.lat) *
        (currentBounds.ne.lng - currentBounds.sw.lng);
      const overlapArea = Math.max(0, latOverlap) * Math.max(0, lngOverlap);

      // Si le chevauchement est inférieur à 70% de l'une des zones, considérer comme un changement significatif
      const overlapRatio = overlapArea / Math.min(prevArea, currentArea);
      return overlapRatio < 0.7;
    };

    // Si le changement est significatif, mettre à jour
    if (isBoundsChangeSignificant()) {
      previousBoundsRef.current = mapBounds;
      fetchListings({ page: 1, forceRefresh: true });
    }
  }, [mapBounds, fetchListings, filters]);

  // Au montage ou quand les coordonnées changent, on récupère les fermes
  useEffect(() => {
    if (coordinates) {
      fetchListings({ page: 1 });
    }
  }, [coordinates, fetchListings, filters]);

  return {
    filters,
    coordinates,
    setCoordinates,
    isLoading,
    fetchListings,
    hasMore,
    setSelectedListingId,
  };
}
