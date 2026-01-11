"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useListingsActions, useMapActions, useMapState } from "@/lib/store";
import { logger } from "@/lib/logger";

/**
 * Interfaces TypeScript pour le contrôle de recherche de ville
 */
interface CitySearchResult {
  place_name?: string;
  text?: string;
  center?: [number, number];
  location?: { lng: number; lat: number };
  bbox?: [number, number, number, number];
  zoom?: number;
}

interface BoundingBox {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

interface NavigationParams {
  lat?: number;
  lng?: number;
  zoom?: number;
  cityLabel?: string;
  bbox?: [number, number, number, number] | null;
}

interface FetchListingsOptions {
  page?: number;
  append?: boolean;
  forceRefresh?: boolean;
  bounds?: any; // MapBounds du store
  bbox?: number[]; // Format tableau uniquement
}

interface UseCitySearchControlProps {
  setSearchCity?: (city: string) => void;
}

interface UseCitySearchControlReturn {
  handleCitySelect: (
    city: CitySearchResult | [number, number]
  ) => Promise<void>;
}

/**
 * Hook personnalisé pour gérer la recherche et sélection de ville
 *
 * Features:
 * - Navigation intelligente (landing → /explore, /explore → replace)
 * - Synchronisation avec la carte Mapbox
 * - Gestion des bounding boxes flexibles
 * - Fetching automatique des listings
 * - Gestion d'erreurs robuste
 *
 * @param props - Configuration du hook
 * @returns Handlers pour la sélection de ville
 */
export default function useCitySearchControl({
  setSearchCity,
}: UseCitySearchControlProps): UseCitySearchControlReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { mapInstance } = useMapState();
  const { setCoordinates, setZoom } = useMapActions();
  const { fetchListings } = useListingsActions();

  /**
   * Anime la carte vers un centre avec un zoom donné
   */
  const easeToCenter = useCallback(
    (map: any, center: [number, number], zoom = 12): Promise<boolean> =>
      new Promise((resolve) => {
        if (!map) return resolve(false);

        const handleMoveEnd = () => {
          map.off("moveend", handleMoveEnd);
          resolve(true);
        };

        map.on("moveend", handleMoveEnd);
        map.easeTo({ center, zoom, duration: 600, essential: true });
      }),
    []
  );

  /**
   * Récupère la bounding box actuelle de la carte
   */
  const getCurrentBBox = useCallback((map: any): BoundingBox | null => {
    if (!map) return null;

    try {
      const bounds = map.getBounds();
      return {
        sw: { lat: bounds.getSouth(), lng: bounds.getWest() },
        ne: { lat: bounds.getNorth(), lng: bounds.getEast() },
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la bounding box:",
        error
      );
      return null;
    }
  }, []);

  /**
   * Construit l'URL cible et navigue intelligemment :
   * - depuis la landing ("/") → push("/explore?...")
   * - depuis /explore → replace("/explore?...")
   */
  const navigateWithParams = useCallback(
    ({ lat, lng, zoom, cityLabel, bbox }: NavigationParams): void => {
      try {
        const params = new URLSearchParams(searchParams?.toString() || "");

        // Coordonnées géographiques
        if (Number.isFinite(lat)) params.set("lat", lat!.toFixed(6));
        if (Number.isFinite(lng)) params.set("lng", lng!.toFixed(6));
        if (Number.isFinite(zoom)) params.set("zoom", String(zoom));
        if (cityLabel?.trim()) params.set("city", cityLabel.trim());

        // ✅ Gestion de la bbox (format tableau uniquement)
        if (Array.isArray(bbox) && bbox.length === 4) {
          params.set("bbox", bbox.map((n) => Number(n).toFixed(6)).join(","));
        }

        const target = `/explore?${params.toString()}`;

        if (pathname === "/") {
          router.push(target); // Navigation depuis la landing
        } else {
          router.replace(target, { scroll: false }); // Mise à jour sur /explore
        }
      } catch (error) {
        console.error("Erreur lors de la navigation avec paramètres:", error);
        // Fallback: navigation simple vers /explore
        router.push("/explore");
      }
    },
    [router, pathname, searchParams]
  );

  /**
   * Handler principal pour la sélection d'une ville
   * Normalise les données, met à jour l'URL, synchronise la carte et fetch les listings
   */
  const handleCitySelect = useCallback(
    async (city: CitySearchResult | [number, number]): Promise<void> => {
      try {
        // 1) Normalisation des données d'entrée
        let lng: number | undefined, lat: number | undefined;
        let zoom = 12;
        let bbox: [number, number, number, number] | null = null;

        if (Array.isArray(city)) {
          [lng, lat] = city;
        } else if (city?.center && Array.isArray(city.center)) {
          [lng, lat] = city.center;
        } else if (city?.location) {
          lng = Number(city.location.lng);
          lat = Number(city.location.lat);
        }

        if (
          typeof city === "object" &&
          !Array.isArray(city) &&
          city?.bbox &&
          Array.isArray(city.bbox) &&
          city.bbox.length === 4
        ) {
          bbox = city.bbox;
        }
        if (
          typeof city === "object" &&
          !Array.isArray(city) &&
          Number.isFinite(city?.zoom)
        ) {
          zoom = Number(city.zoom);
        }

        const cityLabel =
          typeof city === "object" && !Array.isArray(city) && city
            ? String(city.place_name || city.text || "").trim()
            : "";

        if (setSearchCity && cityLabel) {
          setSearchCity(cityLabel);
        }

        const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

        // 2) Navigation intelligente (landing → /explore ; /explore → replace)
        navigateWithParams({
          lat: hasCoords ? lat : undefined,
          lng: hasCoords ? lng : undefined,
          zoom,
          cityLabel: cityLabel || undefined,
          bbox,
        });

        // 3) Mise à jour de l'état de la carte (si elle existe)
        try {
          if (setCoordinates && hasCoords) {
            setCoordinates({ lat: lat!, lng: lng! });
          }
        } catch (error) {
          console.error(
            "Erreur lors de la mise à jour des coordonnées:",
            error
          );
        }

        try {
          if (setZoom && Number.isFinite(zoom)) {
            setZoom(zoom);
          }
        } catch (error) {
          logger.error("listing.create failed", error);
        }

        // 4) Fetch des listings seulement sur la page /explore
        if (!pathname.startsWith("/explore")) {
          return;
        }

        // Animation de la carte et fetch des données
        if (mapInstance && hasCoords) {
          try {
            await easeToCenter(mapInstance, [lng!, lat!], zoom);
            const currentBBox = getCurrentBBox(mapInstance);

            // Conversion de BoundingBox vers number[] si nécessaire
            let bboxArray: number[] | undefined;
            if (currentBBox) {
              bboxArray = [
                currentBBox.sw.lng,
                currentBBox.sw.lat,
                currentBBox.ne.lng,
                currentBBox.ne.lat,
              ];
            } else if (bbox) {
              bboxArray = bbox;
            }

            await fetchListings({
              page: 1,
              forceRefresh: true,
              bbox: bboxArray,
            });
          } catch (error) {
            console.error("Erreur lors de l'animation de la carte:", error);
            // Fallback: fetch sans animation
            await fetchListings({
              page: 1,
              forceRefresh: true,
              bbox: bbox || undefined,
            });
          }
        } else {
          // Pas de carte prête : fetch par bbox si disponible
          try {
            await fetchListings({
              page: 1,
              forceRefresh: true,
              bbox: bbox || undefined,
            });
          } catch (error) {
            console.error("Erreur lors du fetch des listings:", error);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la sélection de ville:", error);
        // En cas d'erreur critique, navigation simple vers /explore
        router.push("/explore");
      }
    },
    [
      pathname,
      mapInstance,
      easeToCenter,
      getCurrentBBox,
      fetchListings,
      setCoordinates,
      setZoom,
      navigateWithParams,
      setSearchCity,
      router,
    ]
  );

  return { handleCitySelect };
}
