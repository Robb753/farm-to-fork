"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  useMapState, // ✅ Import corrigé
  useMapActions, // ✅ Import corrigé
  useListingsActions,
} from "@/lib/store/mapListingsStore";

export default function useCitySearchControl({ setSearchCity }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { mapInstance } = useMapState(); // ✅ Hook corrigé
  const { setCoordinates, setMapZoom } = useMapActions(); // ✅ Actions corrigées
  const { fetchListings } = useListingsActions();

  const easeToCenter = useCallback(
    (map, center, zoom = 12) =>
      new Promise((resolve) => {
        if (!map) return resolve(false);
        const done = () => {
          map.off("moveend", done);
          resolve(true);
        };
        map.on("moveend", done);
        map.easeTo({ center, zoom, duration: 600, essential: true });
      }),
    []
  );

  const getCurrentBBox = useCallback((map) => {
    if (!map) return null;
    const b = map.getBounds();
    // ✅ Format cohérent avec le store
    return {
      sw: { lat: b.getSouth(), lng: b.getWest() },
      ne: { lat: b.getNorth(), lng: b.getEast() },
    };
  }, []);

  /** Construit l'URL cible et navigue :
   * - depuis la landing ("/") → push("/explore?...")
   * - depuis /explore → replace("/explore?...")
   */
  const navigateWithParams = useCallback(
    ({ lat, lng, zoom, cityLabel, bbox }) => {
      const params = new URLSearchParams(searchParams?.toString() || "");

      if (Number.isFinite(lat)) params.set("lat", lat.toFixed(6));
      if (Number.isFinite(lng)) params.set("lng", lng.toFixed(6));
      if (Number.isFinite(zoom)) params.set("zoom", String(zoom));
      if (cityLabel) params.set("city", cityLabel);

      // ✅ Gestion flexible des formats de bbox
      if (Array.isArray(bbox) && bbox.length === 4) {
        params.set("bbox", bbox.map((n) => Number(n).toFixed(6)).join(","));
      } else if (bbox && bbox.sw && bbox.ne) {
        // Format objet vers tableau [west, south, east, north]
        const bboxArray = [bbox.sw.lng, bbox.sw.lat, bbox.ne.lng, bbox.ne.lat];
        params.set(
          "bbox",
          bboxArray.map((n) => Number(n).toFixed(6)).join(",")
        );
      }

      const target = `/explore?${params.toString()}`;
      if (pathname === "/") {
        router.push(target); // on quitte la landing
      } else {
        router.replace(target, { scroll: false }); // on reste sur /explore
      }
    },
    [router, pathname, searchParams]
  );

  const handleCitySelect = useCallback(
    async (city) => {
      // 1) Normaliser les données
      let lng, lat;
      let zoom = 12;
      let bbox = null;

      if (city?.center && Array.isArray(city.center)) [lng, lat] = city.center;
      else if (Array.isArray(city)) [lng, lat] = city;
      else if (city?.location) {
        lng = Number(city.location.lng);
        lat = Number(city.location.lat);
      }

      if (Array.isArray(city?.bbox) && city.bbox.length === 4) bbox = city.bbox;
      if (Number.isFinite(city?.zoom)) zoom = Number(city.zoom);

      const cityLabel = String(city?.place_name || city?.text || "").trim();
      setSearchCity?.(cityLabel);

      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

      // 2) Navigation (landing → /explore ; /explore → replace)
      navigateWithParams({
        lat: hasCoords ? lat : undefined,
        lng: hasCoords ? lng : undefined,
        zoom,
        cityLabel,
        bbox,
      });

      // 3) Mettre à jour la carte (si elle existe déjà)
      try {
        if (setCoordinates && hasCoords) {
          setCoordinates({ lat, lng }); // ✅ Format objet
        }
      } catch {}
      try {
        if (setMapZoom && Number.isFinite(zoom)) setMapZoom(zoom);
      } catch {}

      // 4) Fetch listings seulement sur /explore
      if (!pathname.startsWith("/explore")) return;

      if (mapInstance && hasCoords) {
        await easeToCenter(mapInstance, [lng, lat], zoom);
        const current = getCurrentBBox(mapInstance);
        await fetchListings({
          page: 1,
          forceRefresh: true,
          bbox: current || bbox || undefined,
        });
      } else {
        // pas de carte prête : au moins déclencher un fetch par bbox si dispo
        await fetchListings({
          page: 1,
          forceRefresh: true,
          bbox: bbox || undefined,
        });
      }
    },
    [
      pathname,
      mapInstance,
      easeToCenter,
      getCurrentBBox,
      fetchListings,
      setCoordinates, // ✅ Nom corrigé
      setMapZoom,
      navigateWithParams,
      setSearchCity,
    ]
  );

  return { handleCitySelect };
}
