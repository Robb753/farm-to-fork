// app/_components/layout/Explore.jsx
"use client";

import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useAllListingsWithImages } from "@/app/hooks/useAllListingsWithImages";
import {
  useListingsActions,
  useMapboxActions,
  useMapboxState,
  MAPBOX_CONFIG,
} from "@/lib/store/mapboxListingsStore";

const ListingMapView = dynamic(
  () => import("../../modules/listings/components/ListingMapView"),
  { ssr: false, loading: () => null } // 👈 évite un 2e spinner
);

// petites aides pour comparer avec tolérance
const approx = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

export default function Explore() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();

  const { listings: listingsWithImages, isLoading: listingsLoading } = useAllListingsWithImages();
  const { setAllListings, fetchListings } = useListingsActions();

  const {
    coordinates: curCoords,
    zoom: curZoom,
    mapInstance,
  } = useMapboxState();
  const { setCoordinates, setMapZoom } = useMapboxActions();

  // 0) Normalise l’URL si elle n’a pas lat/lng/zoom (fallback Europe)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1) Applique les paramètres d’URL -> store (sans appeler map.easeTo ni fetch ici)
  useEffect(() => {
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const zoomFromUrl = Number(searchParams.get("zoom"));

    const [fallbackLng, fallbackLat] = MAPBOX_CONFIG.center;
    const targetLat = Number.isFinite(lat) ? lat : fallbackLat;
    const targetLng = Number.isFinite(lng) ? lng : fallbackLng;
    const targetZoom = Number.isFinite(zoomFromUrl)
      ? zoomFromUrl
      : MAPBOX_CONFIG.zoom;

    // Ne push dans le store que si ça change vraiment
    const needCenter =
      !curCoords ||
      !approx(curCoords.lat, targetLat, 1e-6) ||
      !approx(curCoords.lng, targetLng, 1e-6);

    const needZoom = curZoom == null || !approx(curZoom, targetZoom, 1e-3);

    if (needCenter) setCoordinates({ lat: targetLat, lng: targetLng });
    if (needZoom) setMapZoom(targetZoom);

    // IMPORTANT : pas de mapInstance.easeTo ici, MapboxSection le fera déjà
    // IMPORTANT : pas de fetchListings ici non plus (évite la boucle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]); // réagit uniquement aux changements d’URL

  // 2) Injecte les listings préchargés si dispo (ne déclenche pas de refetch)
  useEffect(() => {
    if (Array.isArray(listingsWithImages) && listingsWithImages.length > 0) {
      console.log("📦 Explore: Chargement de", listingsWithImages.length, "listings", {
        premiers: listingsWithImages.slice(0, 3).map((l) => ({
          id: l.id,
          name: l.name,
          lat: l.lat,
          lng: l.lng,
        })),
      });
      setAllListings(listingsWithImages);
    }
  }, [listingsWithImages, setAllListings]);

  // 3) Déclencher un fetch basé sur les bounds de la carte quand elle est chargée
  useEffect(() => {
    if (mapInstance && !listingsLoading) {
      // Attendre un peu que la carte soit vraiment prête
      const timer = setTimeout(() => {
        console.log("🗺️ Explore: Carte chargée, fetch des listings dans la zone visible");
        fetchListings({ page: 1, forceRefresh: true });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [mapInstance, fetchListings, listingsLoading]);

  return <ListingMapView />;
}
