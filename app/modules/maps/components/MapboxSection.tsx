"use client";

import React, { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";

// ✅ Store unifié
import {
  useMapState,
  useMapActions,
  MAPBOX_CONFIG,
} from "@/lib/store/migratedStore";

// ✅ Types centraux du projet
import type { MapBounds, LatLng } from "@/lib/types";

import MapboxMarkers from "./MapboxMarkers";
import { COLORS } from "@/lib/config";

// Token Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

/** Props du composant carte */
interface MapboxSectionProps {
  isMapExpanded?: boolean;
  className?: string;
  onMapReady?: (map: mapboxgl.Map) => void;
  onViewChange?: (center: Coordinates, zoom: number, bounds: MapBounds) => void;
}

/** Réutilise le type central LatLng */
type Coordinates = LatLng;
type MapboxCoordinates = [number, number]; // [lng, lat]

/* ---------------- Helpers ---------------- */

const isFiniteNumber = (n: unknown): n is number => Number.isFinite(n);

/** Convertit {lat,lng} ou [lng,lat] → [lng,lat] */
const coordsToMapbox = (
  coords: Coordinates | MapboxCoordinates | null | undefined
): MapboxCoordinates | null => {
  if (!coords) return null;

  if (typeof coords === "object" && "lat" in coords && "lng" in coords) {
    return [coords.lng, coords.lat];
  }
  if (Array.isArray(coords) && coords.length === 2) {
    return coords as MapboxCoordinates;
  }
  return null;
};

/** Convertit LngLat ou [lng,lat] → {lat,lng} */
const mapboxToStoreCoords = (
  lngLat: mapboxgl.LngLat | MapboxCoordinates | null | undefined
): Coordinates | null => {
  if (!lngLat) return null;

  if (typeof lngLat === "object" && "lng" in lngLat && "lat" in lngLat) {
    return { lng: lngLat.lng, lat: lngLat.lat };
  }
  if (Array.isArray(lngLat) && lngLat.length === 2) {
    return { lng: lngLat[0], lat: lngLat[1] };
  }
  return null;
};

/** Valide des coordonnées géographiques */
const isValidCoords = (
  coords: Coordinates | MapboxCoordinates | null | undefined
): boolean => {
  const m = coordsToMapbox(coords);
  if (!m) return false;
  const [lng, lat] = m;
  return (
    isFiniteNumber(lng) &&
    isFiniteNumber(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lng === 0 && lat === 0)
  );
};

/* --------------- Composant principal --------------- */

/**
 * Composant section Mapbox principal avec gestion des couleurs centralisée
 *
 * Features:
 * - Configuration des couleurs via COLORS
 * - Types MapBounds compatibles avec le store
 * - Gestion d'erreurs robuste
 * - Synchronisation bidirectionnelle avec le store
 * - Loading state stylé avec le design system
 */
export default function MapboxSection({
  isMapExpanded = false,
  className = "",
  onMapReady,
  onViewChange,
}: MapboxSectionProps): JSX.Element {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userInteractingRef = useRef<boolean>(false);

  const { coordinates, zoom, isApiLoaded, isApiLoading } = useMapState();
  const {
    setMapInstance,
    setMapBounds,
    setApiLoaded,
    setApiLoading,
    setZoom,
    setCoordinates,
  } = useMapActions();

  /** Force la projection Mercator et une vue plane */
  const enforceFlatView = useCallback((map: mapboxgl.Map): void => {
    try {
      if (map.getProjection?.().name !== "mercator") {
        map.setProjection("mercator");
      }
      map.setPitch(0);
      map.setBearing(0);
    } catch (error) {
      console.warn("Erreur configuration vue plate:", error);
    }
  }, []);

  /** Met à jour les bounds dans le store (typés MapBounds) */
  const updateStoreBounds = useCallback(
    (map: mapboxgl.Map): void => {
      try {
        const b = map.getBounds();
        // ✅ Format objet {sw, ne} comme attendu par MapBounds
        const storeBounds: MapBounds = {
          sw: { lat: b.getSouth(), lng: b.getWest() },
          ne: { lat: b.getNorth(), lng: b.getEast() },
        };
        setMapBounds(storeBounds);
      } catch (error) {
        console.error("Erreur update bounds:", error);
      }
    },
    [setMapBounds]
  );

  /** Met à jour centre/zoom + notifie onViewChange avec MapBounds */
  const updateStorePosition = useCallback(
    (map: mapboxgl.Map): void => {
      try {
        const currentZoom = map.getZoom();
        setZoom(currentZoom);

        const center = map.getCenter();
        const centerCoords = mapboxToStoreCoords(center);
        if (centerCoords) {
          setCoordinates(centerCoords);
        }

        if (onViewChange && centerCoords) {
          const b = map.getBounds();
          // ✅ Format objet {sw, ne} comme attendu par MapBounds
          const changedBounds: MapBounds = {
            sw: { lat: b.getSouth(), lng: b.getWest() },
            ne: { lat: b.getNorth(), lng: b.getEast() },
          };
          onViewChange(centerCoords, currentZoom, changedBounds);
        }
      } catch (error) {
        console.error("Erreur update position:", error);
      }
    },
    [setZoom, setCoordinates, onViewChange]
  );

  const cleanContainer = useCallback((container: HTMLDivElement): void => {
    try {
      container.replaceChildren();
    } catch {
      container.innerHTML = "";
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
  }, []);

  /** Init carte (une seule fois) */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    setApiLoading(true);
    cleanContainer(containerRef.current);

    try {
      const initCenter: MapboxCoordinates = isValidCoords(coordinates)
        ? coordsToMapbox(coordinates)!
        : (MAPBOX_CONFIG.center as MapboxCoordinates);

      const initZoom: number =
        typeof zoom === "number" && zoom >= MAPBOX_CONFIG.minZoom
          ? zoom
          : MAPBOX_CONFIG.zoom;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: MAPBOX_CONFIG.style,
        center: initCenter,
        zoom: initZoom,
        minZoom: MAPBOX_CONFIG.minZoom,
        maxZoom: MAPBOX_CONFIG.maxZoom,
        cooperativeGestures: true,
        attributionControl: false,
        pitch: 0,
        bearing: 0,
        projection: "mercator",
      });

      mapRef.current = map;

      map.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
          showCompass: true,
          showZoom: true,
        }),
        "bottom-right"
      );

      map.addControl(
        new mapboxgl.ScaleControl({ maxWidth: 100, unit: "metric" }),
        "bottom-left"
      );

      const handleStyleLoad = () => enforceFlatView(map);

      const handleMapLoad = () => {
        try {
          setMapInstance(map);
          setApiLoaded(true);
          setApiLoading(false);
          enforceFlatView(map);

          if (!isValidCoords(coordinates)) {
            const fb = mapboxToStoreCoords(
              MAPBOX_CONFIG.center as MapboxCoordinates
            );
            if (fb) {
              setCoordinates(fb);
              setZoom(MAPBOX_CONFIG.zoom);
            }
          }

          updateStoreBounds(map);
          onMapReady?.(map);
        } catch (error) {
          console.error("Erreur load carte:", error);
          setApiLoading(false);
        }
      };

      const handleMoveStart = (e?: any): void => {
        if (e && (e.originalEvent || e.type)) {
          userInteractingRef.current = true;
        }
      };

      const handleMoveEnd = (): void => {
        try {
          updateStoreBounds(map);
          updateStorePosition(map);
          setTimeout(() => {
            userInteractingRef.current = false;
          }, 100);
        } catch (error) {
          console.error("Erreur moveend:", error);
        }
      };

      map.on("style.load", handleStyleLoad);
      map.on("load", handleMapLoad);
      map.on("movestart", handleMoveStart);
      map.on("zoomstart", handleMoveStart);
      map.on("moveend", handleMoveEnd);
      map.on("zoomend", handleMoveEnd);

      const handleMapError = (e: any) => {
        console.error("Erreur Mapbox:", e);
        setApiLoading(false);
      };
      map.on("error", handleMapError);

      return () => {
        if (mapRef.current) {
          map.off("style.load", handleStyleLoad);
          map.off("load", handleMapLoad);
          map.off("movestart", handleMoveStart);
          map.off("zoomstart", handleMoveStart);
          map.off("moveend", handleMoveEnd);
          map.off("zoomend", handleMoveEnd);
          map.off("error", handleMapError);

          try {
            map.remove();
          } catch (error) {
            console.warn("Erreur remove map:", error);
          }
          mapRef.current = null;
        }

        if (containerRef.current) cleanContainer(containerRef.current);

        setMapInstance(null);
        setApiLoaded(false);
        setApiLoading(false);
      };
    } catch (error) {
      console.error("Erreur init carte:", error);
      setApiLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Suit les changements externes coords/zoom → met à jour la vue */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isApiLoaded) return;
    if (userInteractingRef.current) return;
    if (!isValidCoords(coordinates)) return;

    const mapboxCoords = coordsToMapbox(coordinates);
    if (!mapboxCoords) return;

    const newZoom: number =
      typeof zoom === "number" && zoom >= MAPBOX_CONFIG.minZoom
        ? zoom
        : MAPBOX_CONFIG.zoom;

    try {
      const currentCenter = map.getCenter();
      const currentZoom = map.getZoom();

      const TOLERANCE = 1e-4;
      const ZOOM_TOLERANCE = 0.01;

      if (
        Math.abs(currentCenter.lat - mapboxCoords[1]) < TOLERANCE &&
        Math.abs(currentCenter.lng - mapboxCoords[0]) < TOLERANCE &&
        Math.abs(currentZoom - newZoom) < ZOOM_TOLERANCE
      ) {
        return;
      }

      map.easeTo({
        center: mapboxCoords,
        zoom: newZoom,
        duration: 500,
        essential: true,
      });
    } catch (error) {
      console.error("Erreur MAJ vue:", error);
    }
  }, [coordinates, zoom, isApiLoaded]);

  /** Resize quand mode étendu change */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const t = setTimeout(() => {
      try {
        map.resize();
      } catch (e) {
        console.warn("Erreur resize carte:", e);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [isMapExpanded]);

  /** Resize sur window resize */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onResize = (): void => {
      try {
        map.resize();
      } catch (e) {
        console.warn("Erreur resize window:", e);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div ref={wrapperRef} className={`h-full w-full relative ${className}`}>
      {/* ⚠️ Mapbox injecte son canvas ici */}
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ contain: "layout paint size" }}
      />

      {/* Markers + popups contrôlés */}
      <MapboxMarkers />

      {/* ✅ Loading state avec couleurs du design system */}
      {isApiLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backgroundColor: `${COLORS.BG_WHITE}BF`, // 75% opacity
          }}
        >
          <div className="text-center">
            <div
              className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-3"
              style={{
                borderColor: `${COLORS.PRIMARY} transparent transparent transparent`,
              }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Chargement de la carte...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
