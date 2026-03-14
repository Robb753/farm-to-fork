"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import "@/lib/config/mapbox-init";

import React, { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";

import {
  useMapCoordinates,
  useSetMapCoordinates,
  useSetMapBounds,
  useSetMapZoom,
  useUnifiedStore,
} from "@/lib/store";

import type { LatLng } from "@/lib/store/shared/types";
import MapboxClusterLayer from "./MapboxClusterLayer";
// Stage 4 → décommenter : import FarmSelectedPanel from "./FarmSelectedPanel";
import { COLORS } from "@/lib/config";
import {
  useSetMapApiLoaded,
  useSetMapInstance,
} from "@/lib/store/unifiedStore";

const MAPBOX_CONFIG = {
  style: "mapbox://styles/mapbox/streets-v12",
  center: [2.3522, 48.8566] as [number, number],
  zoom: 4.6,
  minZoom: 3,
  maxZoom: 18,
};

interface MapboxSectionProps {
  isMapExpanded?: boolean;
  className?: string;
  onMapReady?: (map: mapboxgl.Map) => void;
  onViewChange?: (
    center: LatLng,
    zoom: number,
    bounds: { north: number; south: number; east: number; west: number }
  ) => void;
}

type MapboxCoordinates = [number, number];

const isFiniteNumber = (n: unknown): n is number => Number.isFinite(n);

const coordsToMapbox = (
  coords: LatLng | MapboxCoordinates | null | undefined
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

const mapboxToStoreCoords = (
  lngLat: mapboxgl.LngLat | MapboxCoordinates | null | undefined
): LatLng | null => {
  if (!lngLat) return null;

  if (typeof lngLat === "object" && "lng" in lngLat && "lat" in lngLat) {
    return { lng: lngLat.lng, lat: lngLat.lat };
  }
  if (Array.isArray(lngLat) && lngLat.length === 2) {
    return { lng: lngLat[0], lat: lngLat[1] };
  }
  return null;
};

const isValidCoords = (
  coords: LatLng | MapboxCoordinates | null | undefined
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
  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ Store-driven flags (plus de useState local)
  const isApiLoaded = useUnifiedStore((s) => s.map.isApiLoaded);
  const isApiLoading = useUnifiedStore((s) => s.map.isLoading);

  const setApiLoaded = useSetMapApiLoaded();
  const setInstance = useSetMapInstance();
  const setMapLoading = useUnifiedStore((s) => s.mapActions.setMapLoading);

  const coordinates = useMapCoordinates();
  const zoom = useUnifiedStore((s) => s.map.zoom);

  // ✅ actions atomiques (stables)
  const setCoordinates = useSetMapCoordinates();
  const setBounds = useSetMapBounds();
  const setZoom = useSetMapZoom();

  /* ---------------- refs anti-stale closures ---------------- */
  const coordsRef = useRef(coordinates);
  const zoomRef = useRef(zoom);
  const onMapReadyRef = useRef(onMapReady);
  const onViewChangeRef = useRef(onViewChange);

  useEffect(() => {
    coordsRef.current = coordinates;
  }, [coordinates]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    onViewChangeRef.current = onViewChange;
  }, [onViewChange]);

  /* ---------------- helpers ---------------- */

  const cleanContainer = useCallback((container: HTMLDivElement): void => {
    try {
      container.replaceChildren();
    } catch {
      container.innerHTML = "";
      while (container.firstChild) container.removeChild(container.firstChild);
    }
  }, []);

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

  const updateStoreBounds = useCallback(
    (map: mapboxgl.Map): void => {
      try {
        const b = map.getBounds();
        if (!b) return;

        setBounds({
          north: b.getNorth(),
          south: b.getSouth(),
          east: b.getEast(),
          west: b.getWest(),
        });
      } catch (error) {
        console.error("Erreur update bounds:", error);
      }
    },
    [setBounds]
  );

  const updateStorePosition = useCallback(
    (map: mapboxgl.Map): void => {
      try {
        const currentZoom = map.getZoom();
        setZoom(currentZoom);

        const centerCoords = mapboxToStoreCoords(map.getCenter());
        if (centerCoords) setCoordinates(centerCoords);

        const cb = onViewChangeRef.current;
        if (cb && centerCoords) {
          const b = map.getBounds();
          if (!b) return;

          cb(centerCoords, currentZoom, {
            north: b.getNorth(),
            south: b.getSouth(),
            east: b.getEast(),
            west: b.getWest(),
          });
        }
      } catch (error) {
        console.error("Erreur update position:", error);
      }
    },
    [setZoom, setCoordinates]
  );

  /* ---------------- init map (once) ---------------- */

  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl || mapRef.current) return;

    cleanContainer(containerEl);
    let destroyed = false;

    setMapLoading(true);

    try {
      const initialCoords = coordsRef.current;
      const initialZoom = zoomRef.current;

      const initCenter: MapboxCoordinates = isValidCoords(initialCoords)
        ? (coordsToMapbox(initialCoords) as MapboxCoordinates)
        : MAPBOX_CONFIG.center;

      const initZoomValue: number =
        typeof initialZoom === "number" && initialZoom >= MAPBOX_CONFIG.minZoom
          ? initialZoom
          : MAPBOX_CONFIG.zoom;

      if (!mapboxgl.accessToken) {
        console.error("[MapboxSection] mapboxgl.accessToken manquant — vérifiez NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN");
        setMapLoading(false);
        return;
      }

      const map = new mapboxgl.Map({
        container: containerEl,
        style: MAPBOX_CONFIG.style,
        center: initCenter,
        zoom: initZoomValue,
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
        if (destroyed) return;

        try {
          setApiLoaded(true);
          setInstance(map);
          setMapLoading(false);

          enforceFlatView(map);

          if (!isValidCoords(coordsRef.current)) {
            const fb = mapboxToStoreCoords(MAPBOX_CONFIG.center);
            if (fb) {
              setCoordinates(fb);
              setZoom(MAPBOX_CONFIG.zoom);
            }
          }

          updateStoreBounds(map);
          onMapReadyRef.current?.(map);
        } catch (error) {
          console.error("Erreur load carte:", error);
          setMapLoading(false);
        }
      };

      const handleMoveStart = (e?: any) => {
        if (e && (e.originalEvent || e.type)) userInteractingRef.current = true;
      };

      const handleMoveEnd = () => {
        try {
          if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current);
          boundsTimerRef.current = setTimeout(() => updateStoreBounds(map), 150);
          updateStorePosition(map);
          setTimeout(() => {
            userInteractingRef.current = false;
          }, 100);
        } catch (error) {
          console.error("Erreur moveend:", error);
        }
      };

      const handleMapError = (e: any) => {
        console.error("Erreur Mapbox:", e);
        setMapLoading(false);
      };

      map.on("style.load", handleStyleLoad);
      map.on("load", handleMapLoad);
      map.on("movestart", handleMoveStart);
      map.on("moveend", handleMoveEnd);
      map.on("error", handleMapError);

      return () => {
        destroyed = true;

        if (boundsTimerRef.current) {
          clearTimeout(boundsTimerRef.current);
          boundsTimerRef.current = null;
        }

        if (mapRef.current) {
          map.off("style.load", handleStyleLoad);
          map.off("load", handleMapLoad);
          map.off("movestart", handleMoveStart);
          map.off("moveend", handleMoveEnd);
          map.off("error", handleMapError);

          try {
            map.remove();
          } catch (error) {
            console.warn("Erreur remove map:", error);
          }
          mapRef.current = null;
        }

        if (containerEl) cleanContainer(containerEl);

        setApiLoaded(false);
        setInstance(null);
        setMapLoading(false);
      };
    } catch (error) {
      console.error("Erreur init carte:", error);
      setMapLoading(false);
      setApiLoaded(false);
      setInstance(null);
    }
  }, [
    cleanContainer,
    enforceFlatView,
    updateStoreBounds,
    updateStorePosition,
    setCoordinates,
    setZoom,
    setBounds,
    setApiLoaded,
    setInstance,
    setMapLoading,
  ]);

  /* ---------------- sync store -> map view ---------------- */

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

  /* ---------------- resize handlers ---------------- */

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onResize = () => {
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
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ contain: "layout paint size" }}
      />

      <MapboxClusterLayer />
      {/* Stage 4 → décommenter : <FarmSelectedPanel /> */}

      {isApiLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: `${COLORS.BG_WHITE}BF` }}
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
