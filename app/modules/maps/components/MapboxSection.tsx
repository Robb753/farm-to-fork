"use client";

import React, { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";

import {
  useMapState,
  useSetMapCoordinates,
  useSetMapBounds,
  useSetMapZoom,
  useUnifiedStore,
} from "@/lib/store";

import type { LatLng } from "@/lib/store/shared/types";
import MapboxMarkers from "./MapboxMarkers";
import { COLORS } from "@/lib/config";
import { useSetMapApiLoaded, useSetMapInstance } from "@/lib/store/unifiedStore";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

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

  const markersRef = useRef<
    Array<{
      id: number;
      marker: mapboxgl.Marker;
      element: HTMLDivElement;
      handlers: {
        mouseenter: () => void;
        mouseleave: () => void;
        click: () => void;
      };
    }>
  >([]);

  // ✅ Store-driven flags (plus de useState local)
  const isApiLoaded = useUnifiedStore((s) => s.map.isApiLoaded);
  const isApiLoading = useUnifiedStore((s) => s.map.isLoading);

  const setApiLoaded = useSetMapApiLoaded();
  const setInstance = useSetMapInstance();
  const setMapLoading = useUnifiedStore((s) => s.mapActions.setMapLoading);

  const { coordinates, zoom } = useMapState();

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

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(({ marker, element, handlers }) => {
      try {
        element.removeEventListener("mouseenter", handlers.mouseenter);
        element.removeEventListener("mouseleave", handlers.mouseleave);
        element.removeEventListener("click", handlers.click);
        marker.remove();
      } catch (e) {
        console.warn("Erreur suppression marqueur:", e);
      }
    });
    markersRef.current = [];
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

  /* ---------------- markers bridge via window events ---------------- */

  const addMarkersToMap = useCallback(
    (listings: any[]) => {
      const map = mapRef.current;
      if (!map) return;

      clearMarkers();

      listings.forEach((listing) => {
        if (
          typeof listing?.lat === "number" &&
          typeof listing?.lng === "number"
        ) {
          try {
            const markerEl = document.createElement("div");
            markerEl.className = "custom-marker";
            markerEl.style.cssText = `
              width: 24px;
              height: 24px;
              background-color: ${COLORS.PRIMARY};
              border: 2px solid ${COLORS.BG_WHITE};
              border-radius: 50%;
              cursor: pointer;
              transition: all 0.2s ease;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              opacity: 1;
            `;

            const handleMouseEnter = () => {
              markerEl.style.transform = "scale(1.2)";
              markerEl.style.backgroundColor = COLORS.PRIMARY_DARK;
              markerEl.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
              markerEl.style.opacity = "1";
            };

            const handleMouseLeave = () => {
              markerEl.style.transform = "scale(1)";
              markerEl.style.backgroundColor = COLORS.PRIMARY;
              markerEl.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
              markerEl.style.opacity = "1";
            };

            const handleClick = () => {
              window.dispatchEvent(
                new CustomEvent("listingSelected", {
                  detail: { id: listing.id, fromMap: true },
                })
              );
            };

            markerEl.addEventListener("mouseenter", handleMouseEnter);
            markerEl.addEventListener("mouseleave", handleMouseLeave);
            markerEl.addEventListener("click", handleClick);

            const marker = new mapboxgl.Marker(markerEl)
              .setLngLat([listing.lng, listing.lat])
              .addTo(map);

            markersRef.current.push({
              id: listing.id,
              marker,
              element: markerEl,
              handlers: {
                mouseenter: handleMouseEnter,
                mouseleave: handleMouseLeave,
                click: handleClick,
              },
            });
          } catch (error) {
            console.warn("Erreur création marqueur pour", listing?.id, error);
          }
        }
      });
    },
    [clearMarkers]
  );

  const highlightMarker = useCallback((id: number | null) => {
    markersRef.current.forEach(({ id: markerId, element }) => {
      if (id === null) {
        element.style.transform = "scale(1)";
        element.style.backgroundColor = COLORS.PRIMARY;
        element.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
        element.style.opacity = "1";
        return;
      }

      if (markerId === id) {
        element.style.transform = "scale(1.2)";
        element.style.backgroundColor = COLORS.PRIMARY_DARK;
        element.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
        element.style.opacity = "1";
      } else {
        element.style.transform = "scale(1)";
        element.style.backgroundColor = COLORS.PRIMARY;
        element.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
        element.style.opacity = "0.6";
      }
    });
  }, []);

  const selectMarker = useCallback((id: number | null) => {
    markersRef.current.forEach(({ id: markerId, element }) => {
      if (id !== null && markerId === id) {
        element.style.transform = "scale(1.3)";
        element.style.backgroundColor = COLORS.PRIMARY_DARK;
        element.style.border = `3px solid ${COLORS.ACCENT || "#FFD700"}`;
        element.style.boxShadow = "0 6px 12px rgba(0,0,0,0.4)";
        element.style.opacity = "1";
        element.style.zIndex = "1000";
      } else {
        element.style.transform = "scale(1)";
        element.style.backgroundColor = COLORS.PRIMARY;
        element.style.border = `2px solid ${COLORS.BG_WHITE}`;
        element.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
        element.style.opacity = id === null ? "1" : "0.5";
        element.style.zIndex = "1";
      }
    });
  }, []);

  const openInfoWindow = useCallback((id: number | null) => {
    const map = mapRef.current;
    if (!map || id === null) return;

    const markerData = markersRef.current.find(
      ({ id: markerId }) => markerId === id
    );
    if (!markerData) return;

    const lngLat = markerData.marker.getLngLat();
    new mapboxgl.Popup({ offset: 25, closeButton: true })
      .setLngLat(lngLat)
      .setHTML(
        `<div style="padding: 8px; font-family: sans-serif;">
          <p style="margin: 0; font-weight: bold;">Listing #${id}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Click for details</p>
        </div>`
      )
      .addTo(map);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const handleListingsUpdated = (event: Event) => {
      const e = event as CustomEvent;
      addMarkersToMap(e.detail?.listings ?? []);
    };

    const handleListingHovered = (event: Event) => {
      const e = event as CustomEvent;
      highlightMarker(e.detail?.id ?? null);
    };

    const handleListingSelected = (event: Event) => {
      const e = event as CustomEvent;
      selectMarker(e.detail?.id ?? null);
    };

    const handleInfoWindowRequested = (event: Event) => {
      const e = event as CustomEvent;
      openInfoWindow(e.detail?.id ?? null);
    };

    window.addEventListener("listingsUpdated", handleListingsUpdated);
    window.addEventListener("listingHovered", handleListingHovered);
    window.addEventListener("listingSelected", handleListingSelected);
    window.addEventListener("infoWindowRequested", handleInfoWindowRequested);

    return () => {
      window.removeEventListener("listingsUpdated", handleListingsUpdated);
      window.removeEventListener("listingHovered", handleListingHovered);
      window.removeEventListener("listingSelected", handleListingSelected);
      window.removeEventListener(
        "infoWindowRequested",
        handleInfoWindowRequested
      );
    };
  }, [addMarkersToMap, highlightMarker, selectMarker, openInfoWindow]);

  /* ---------------- init map (once) ---------------- */

  useEffect(() => {
    const containerEl = containerRef.current; // ✅ capture ref pour cleanup
    if (!containerEl || mapRef.current) return;

    cleanContainer(containerEl);
    let destroyed = false;

    // ✅ indique loading via store (pas de setState)
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

          // fallback coords si store vide
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
          updateStoreBounds(map);
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
      map.on("zoomstart", handleMoveStart);
      map.on("moveend", handleMoveEnd);
      map.on("zoomend", handleMoveEnd);
      map.on("error", handleMapError);

      return () => {
        destroyed = true;

        clearMarkers();

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

        if (containerEl) cleanContainer(containerEl);

        // ✅ reset store flags
        setApiLoaded(false);
        setInstance(null);
        setMapLoading(true);
      };
    } catch (error) {
      console.error("Erreur init carte:", error);
      setMapLoading(false);
      setApiLoaded(false);
      setInstance(null);
    }
  }, [
    cleanContainer,
    clearMarkers,
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

      <MapboxMarkers />

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
