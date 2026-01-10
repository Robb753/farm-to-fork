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

const ListingMapView = dynamic(
  () => import("../../modules/listings/components/ListingMapView"),
  { ssr: false, loading: () => null }
);

const approx = (a: number, b: number, eps: number = 1e-6): boolean =>
  Math.abs(a - b) <= eps;

export default function Explore(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();

  // ✅ GLOBAL fetch (active=true + images)
  const { listings, isLoading, error } = useAllListingsWithImages({
    limit: 500, // ajuste selon ton volume
    autoFetch: true,
  });

  const { setAllListings, setFilteredListings } = useListingsActions();
  const { all } = useListingsState();

  const { bounds } = useMapState();
  const { setCoordinates, setZoom } = useMapActions();

  const filters = useCurrentFilters();
  const { filterListings } = useFiltersActions();

  const lastUrlViewRef = useRef<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);

  // ✅ Normalise URL si lat/lng/zoom manquants
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

  // ✅ URL -> store (déclenche uniquement quand l'URL change)
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

    const prev = lastUrlViewRef.current;

    if (
      prev &&
      approx(prev.lat, targetLat, 1e-6) &&
      approx(prev.lng, targetLng, 1e-6) &&
      approx(prev.zoom, targetZoom, 1e-3)
    )
      return;

    lastUrlViewRef.current = {
      lat: targetLat,
      lng: targetLng,
      zoom: targetZoom,
    };

    const newCoords: LatLng = { lat: targetLat, lng: targetLng };
    setCoordinates(newCoords);
    setZoom(targetZoom);
  }, [paramsKey, searchParams, setCoordinates, setZoom]);

  // ✅ Injecter le global dataset dans le store
  useEffect(() => {
    if (
      !isLoading &&
      !error &&
      Array.isArray(listings) &&
      listings.length > 0
    ) {
      const normalized = listings.map((l: any) => ({
        ...l,
        active: l.active ?? true,
        created_at: l.created_at ?? new Date().toISOString(),
      }));
      setAllListings(normalized);
    }
  }, [listings, isLoading, error, setAllListings]);

  // ✅ Filtrage 100% store-driven (bounds + filtres métier)
  useEffect(() => {
    if (!all || all.length === 0) return;

    const filtered = filterListings(all, bounds);
    setFilteredListings(filtered);
  }, [all, bounds, filters, filterListings, setFilteredListings]);

  return <ListingMapView />;
}
