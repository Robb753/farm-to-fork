// app/_components/layout/Explore.tsx
"use client";

import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useAllListingsWithImages } from "@/app/hooks/useAllListingsWithImages";
import { MAPBOX_CONFIG } from "@/lib/config";
import type { LatLng } from "@/lib/store";
import {
  useListingsActions,
  useListingsState,
  useMapActions,
  useMapState,
  useFiltersActions,
  useCurrentFilters,
} from "@/lib/store";

/**
 * Chargement dynamique du composant de carte
 */
const ListingMapView = dynamic(
  () => import("../../modules/listings/components/ListingMapView"),
  {
    ssr: false,
    loading: () => null, // Évite un second spinner
  }
);

/**
 * Fonction utilitaire pour comparer des nombres avec tolérance
 */
const approx = (a: number, b: number, eps: number = 1e-6): boolean =>
  Math.abs(a - b) <= eps;

/**
 * Composant principal d'exploration avec carte interactive
 *
 * Features:
 * - Synchronisation entre URL et store unifié
 * - Gestion des coordonnées et zoom depuis l'URL
 * - Intégration avec le hook de listings
 * - Configuration Mapbox centralisée
 * - Filtrage auto en fonction de la carte
 */
export default function Explore(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();

  // ✅ Hook pour les listings avec images
  const { listings, isLoading, error } = useAllListingsWithImages();

  // ✅ Store listings
  const { setAllListings, setFilteredListings } = useListingsActions();
  const { all } = useListingsState();

  // ✅ Store carte
  const { bounds } = useMapState();
  const { setCoordinates, setZoom } = useMapActions();

  // ✅ Store filtres
  const filters = useCurrentFilters();
  const { filterListings } = useFiltersActions();

  // ✅ Mémoire de la dernière vue issue de l'URL
  const lastUrlViewRef = useRef<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);

  /**
   * Normalise l'URL si elle n'a pas les paramètres requis (lat/lng/zoom)
   * Utilise les valeurs par défaut de la configuration Mapbox
   */
  useEffect(() => {
    const hasLat = searchParams.has("lat");
    const hasLng = searchParams.has("lng");
    const hasZoom = searchParams.has("zoom");

    if (!hasLat || !hasLng || !hasZoom) {
      const [lng, lat] = MAPBOX_CONFIG.center;
      const sp = new URLSearchParams(searchParams.toString());

      if (!hasLat) sp.set("lat", String(lat));
      if (!hasLng) sp.set("lng", String(lng));
      if (!hasZoom) sp.set("zoom", String(MAPBOX_CONFIG.zoom));

      router.replace(`/explore?${sp.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);

  /**
   * Synchronise les paramètres d'URL avec le store
   * 👉 Ne se déclenche QUE quand l'URL change,
   *    pas quand l'utilisateur bouge la carte.
   */
  useEffect(() => {
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const zoomFromUrl = Number(searchParams.get("zoom"));

    // ✅ Valeurs de fallback depuis la configuration
    const [fallbackLng, fallbackLat] = MAPBOX_CONFIG.center;
    const targetLat = Number.isFinite(lat) ? lat : fallbackLat;
    const targetLng = Number.isFinite(lng) ? lng : fallbackLng;
    const targetZoom = Number.isFinite(zoomFromUrl)
      ? zoomFromUrl
      : MAPBOX_CONFIG.zoom;

    const prev = lastUrlViewRef.current;

    // Si l'URL n'a pas vraiment changé, on ne fait rien
    if (
      prev &&
      approx(prev.lat, targetLat, 1e-6) &&
      approx(prev.lng, targetLng, 1e-6) &&
      approx(prev.zoom, targetZoom, 1e-3)
    ) {
      return;
    }

    // On mémorise la nouvelle vue issue de l'URL
    lastUrlViewRef.current = {
      lat: targetLat,
      lng: targetLng,
      zoom: targetZoom,
    };

    // On pousse dans le store → la carte suivra
    const newCoords: LatLng = { lat: targetLat, lng: targetLng };
    setCoordinates(newCoords);
    setZoom(targetZoom);
  }, [paramsKey, searchParams, setCoordinates, setZoom]);

  /**
   * Injecte les listings préchargés si disponibles
   * Ne déclenche pas de nouveau fetch
   */
  useEffect(() => {
    if (
      !isLoading &&
      !error &&
      Array.isArray(listings) &&
      listings.length > 0
    ) {
      // ✅ Conversion des listings avec les champs requis par le nouveau type
      const normalizedListings = listings.map((listing) => ({
        ...listing,
        active: listing.active ?? true, // ✅ Assurer que active est défini
        created_at: listing.created_at ?? new Date().toISOString(), // ✅ Assurer que created_at est défini
      }));

      setAllListings(normalizedListings);
    }
  }, [listings, isLoading, error, setAllListings]);

  /**
   * 🎯 FILTRAGE AUTOMATIQUE - Carte dynamique
   *
   * Applique automatiquement les filtres quand :
   * - Les bounds de la carte changent (déplacement/zoom)
   * - Les filtres métier changent (produits, certifications, etc.)
   */
  useEffect(() => {
    if (!all || all.length === 0) return;

    const filtered = filterListings(all, bounds);
    setFilteredListings(filtered);
    
  }, [all, bounds, filters, filterListings, setFilteredListings]);

  return <ListingMapView />;
}
