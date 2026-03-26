// app/_components/layout/Explore.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MAPBOX_CONFIG } from "@/lib/config";
import type { LatLng, Listing } from "@/lib/store";
import {
  useSetAllListings,
  useSetListingsLoading,
  useSetMapCoordinates,
  useSetMapZoom,
} from "@/lib/store";
import ListingMapView from "../../modules/listings/components/ListingMapView";

const approx = (a: number, b: number, eps: number = 1e-6): boolean =>
  Math.abs(a - b) <= eps;

interface ExploreProps {
  listings: Listing[];
}

export default function Explore({ listings }: ExploreProps): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();

  const setAllListings = useSetAllListings();
  const setListingsLoading = useSetListingsLoading();
  const setCoordinates = useSetMapCoordinates();
  const setZoom = useSetMapZoom();

  const lastUrlViewRef = useRef<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);

  // ✅ Normalise URL + syncs to store in one effect, keyed on paramsKey (string)
  // avoids redundant runs caused by the searchParams object reference changing every render
  useEffect(() => {
    const sp = new URLSearchParams(paramsKey);
    const [fallbackLng, fallbackLat] = MAPBOX_CONFIG.center;

    // 1. Normalise missing params
    const hasLat = sp.has("lat");
    const hasLng = sp.has("lng");
    const hasZoom = sp.has("zoom");

    if (!hasLat || !hasLng || !hasZoom) {
      if (!hasLat) sp.set("lat", String(fallbackLat));
      if (!hasLng) sp.set("lng", String(fallbackLng));
      if (!hasZoom) sp.set("zoom", String(MAPBOX_CONFIG.zoom));
      router.replace(`/explore?${sp.toString()}`, { scroll: false });
    }

    // 2. Sync to store (reads from sp so fallback values are used immediately)
    const lat = Number(sp.get("lat"));
    const lng = Number(sp.get("lng"));
    const zoomFromUrl = Number(sp.get("zoom"));

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

    lastUrlViewRef.current = { lat: targetLat, lng: targetLng, zoom: targetZoom };

    const newCoords: LatLng = { lat: targetLat, lng: targetLng };
    setCoordinates(newCoords);
    setZoom(targetZoom);
  }, [paramsKey, router, setCoordinates, setZoom]);

  // Initialise le store au montage avec les listings chargés côté serveur.
  useEffect(() => {
    const normalized = listings.map((l: any) => ({
      ...l,
      active: l.active ?? true,
      created_at: l.created_at ?? new Date().toISOString(),
    }));
    setAllListings(normalized);
    setListingsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <ListingMapView />;
}
