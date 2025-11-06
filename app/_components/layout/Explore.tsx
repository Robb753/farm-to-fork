// app/_components/layout/Explore.tsx
"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useAllListingsWithImages } from "@/app/hooks/useAllListingsWithImages";
import {
  useListingsActions,
  useMapActions,
  useMapState,
} from "@/lib/store/migratedStore";
import { MAPBOX_CONFIG } from "@/lib/config";
import type { LatLng } from "@/lib/types";

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
 * - Évite les boucles de re-fetch infinies
 */
export default function Explore(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();

  // ✅ Hook pour les listings avec images
  const { listings, isLoading, error } = useAllListingsWithImages();

  // ✅ Actions du store unifié
  const { setAllListings } = useListingsActions();

  // ✅ État de la carte depuis le store unifié
  const { coordinates: curCoords, zoom: curZoom, mapInstance } = useMapState();

  // ✅ Actions de la carte
  const { setCoordinates, setZoom } = useMapActions();

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
   * Évite les appels inutiles à map.easeTo et fetch
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

    // ✅ Ne met à jour le store que si les valeurs changent vraiment
    const needCenter =
      !curCoords ||
      !approx(curCoords.lat, targetLat, 1e-6) ||
      !approx(curCoords.lng, targetLng, 1e-6);

    const needZoom = curZoom == null || !approx(curZoom, targetZoom, 1e-3);

    if (needCenter) {
      const newCoords: LatLng = { lat: targetLat, lng: targetLng };
      setCoordinates(newCoords);
    }

    if (needZoom) {
      setZoom(targetZoom);
    }

    // ⚠️ IMPORTANT :
    // - Pas de mapInstance.easeTo ici, MapboxSection le fera déjà
    // - Pas de fetchListings ici non plus (évite les boucles infinies)
  }, [paramsKey, curCoords, curZoom, setCoordinates, setZoom]);

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
      setAllListings(listings);
    }
  }, [listings, isLoading, error, setAllListings]);

  return <ListingMapView />;
}
