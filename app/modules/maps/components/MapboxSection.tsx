"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";

// ✅ IMPORTS CORRECTS : Store modulaire équilibré
import { useMapState, useMapActions } from "@/lib/store";

// ✅ Types du projet - utiliser les types de unifiedStore
import type { LatLng } from "@/lib/store/shared/types";

import MapboxMarkers from "./MapboxMarkers";
import { COLORS } from "@/lib/config";

// Token Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

// ✅ Configuration Mapbox centralisée
const MAPBOX_CONFIG = {
  style: "mapbox://styles/mapbox/streets-v12",
  center: [2.3522, 48.8566] as [number, number], // Paris
  zoom: 4.6,
  minZoom: 3,
  maxZoom: 18,
};

/** Props du composant carte */
interface MapboxSectionProps {
  isMapExpanded?: boolean;
  className?: string;
  onMapReady?: (map: mapboxgl.Map) => void;
  onViewChange?: (
    center: LatLng,
    zoom: number,
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    }
  ) => void;
}

type MapboxCoordinates = [number, number]; // [lng, lat]

/* ---------------- Helpers ---------------- */

const isFiniteNumber = (n: unknown): n is number => Number.isFinite(n);

/** Convertit {lat,lng} ou [lng,lat] → [lng,lat] */
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

/** Convertit LngLat ou [lng,lat] → {lat,lng} */
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

/** Valide des coordonnées géographiques */
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

/* --------------- Composant principal --------------- */

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
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // ✅ CORRECTION : États locaux pour loading
  const [isApiLoading, setIsApiLoading] = useState<boolean>(true);
  const [isApiLoaded, setIsApiLoaded] = useState<boolean>(false);

  // ✅ CORRECTION : Utiliser seulement les états et actions disponibles
  const { coordinates, zoom, bounds, mapInstance } = useMapState();
  const mapActions = useMapActions();

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

  /** Met à jour les bounds dans le store */
  const updateStoreBounds = useCallback(
    (map: mapboxgl.Map): void => {
      try {
        const b = map.getBounds();
        if (!b) {
          console.warn("Bounds Mapbox indisponibles");
          return;
        }

        // ✅ Format attendu par unifiedStore : { north, south, east, west }
        const storeBounds = {
          north: b.getNorth(),
          south: b.getSouth(),
          east: b.getEast(),
          west: b.getWest(),
        };
        mapActions.setBounds(storeBounds);
      } catch (error) {
        console.error("Erreur update bounds:", error);
      }
    },
    [mapActions]
  );

  /** Met à jour centre/zoom + notifie onViewChange */
  const updateStorePosition = useCallback(
    (map: mapboxgl.Map): void => {
      try {
        const currentZoom = map.getZoom();
        mapActions.setZoom(currentZoom);

        const center = map.getCenter();
        const centerCoords = mapboxToStoreCoords(center);
        if (centerCoords) {
          mapActions.setCoordinates(centerCoords);
        }

        if (onViewChange && centerCoords) {
          const b = map.getBounds();
          if (!b) {
            console.warn("Bounds Mapbox indisponibles pour onViewChange");
            return;
          }

          // ✅ Format attendu : { north, south, east, west }
          const changedBounds = {
            north: b.getNorth(),
            south: b.getSouth(),
            east: b.getEast(),
            west: b.getWest(),
          };
          onViewChange(centerCoords, currentZoom, changedBounds);
        }
      } catch (error) {
        console.error("Erreur update position:", error);
      }
    },
    [mapActions.setZoom, mapActions.setCoordinates, onViewChange]
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

  // ✅ FONCTIONS POUR LES MARQUEURS
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      try {
        marker.remove();
      } catch (e) {
        console.warn("Erreur suppression marqueur:", e);
      }
    });
    markersRef.current = [];
  }, []);

  const addMarkersToMap = useCallback(
    (listings: any[]) => {
      const map = mapRef.current;
      if (!map) return;

      clearMarkers(); // Nettoyer les anciens marqueurs

      listings.forEach((listing) => {
        if (
          listing.lat &&
          listing.lng &&
          typeof listing.lat === "number" &&
          typeof listing.lng === "number"
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
            `;

            markerEl.addEventListener("mouseenter", () => {
              markerEl.style.transform = "scale(1.2)";
              markerEl.style.backgroundColor = COLORS.PRIMARY_DARK;
              markerEl.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
            });

            markerEl.addEventListener("mouseleave", () => {
              markerEl.style.transform = "scale(1)";
              markerEl.style.backgroundColor = COLORS.PRIMARY;
              markerEl.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
            });

            markerEl.addEventListener("click", () => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("listingSelected", {
                    detail: { id: listing.id, fromMap: true },
                  })
                );
              }
            });

            const marker = new mapboxgl.Marker(markerEl)
              .setLngLat([listing.lng, listing.lat])
              .addTo(map);

            markersRef.current.push(marker);
          } catch (error) {
            console.warn("Erreur création marqueur pour", listing.id, error);
          }
        }
      });
    },
    [clearMarkers]
  );

  const highlightMarker = useCallback((id: number | null) => {
    // TODO: Implémenter la logique de highlight
  }, []);

  const selectMarker = useCallback((id: number | null) => {
    // TODO: Implémenter la logique de sélection
  }, []);

  const openInfoWindow = useCallback((id: number | null) => {
    // TODO: Implémenter la logique d'info window
  }, []);

  // ✅ ÉCOUTE DES ÉVÉNEMENTS DU STORE
  useEffect(() => {
    if (!mapRef.current) return;

    const handleListingsUpdated = (event: CustomEvent) => {
      const { listings } = event.detail;
      addMarkersToMap(listings);
    };

    const handleListingHovered = (event: CustomEvent) => {
      const { id } = event.detail;
      highlightMarker(id);
    };

    const handleListingSelected = (event: CustomEvent) => {
      const { id } = event.detail;
      selectMarker(id);
    };

    const handleInfoWindowRequested = (event: CustomEvent) => {
      const { id } = event.detail;
      openInfoWindow(id);
    };

    window.addEventListener(
      "listingsUpdated",
      handleListingsUpdated as EventListener
    );
    window.addEventListener(
      "listingHovered",
      handleListingHovered as EventListener
    );
    window.addEventListener(
      "listingSelected",
      handleListingSelected as EventListener
    );
    window.addEventListener(
      "infoWindowRequested",
      handleInfoWindowRequested as EventListener
    );

    return () => {
      window.removeEventListener(
        "listingsUpdated",
        handleListingsUpdated as EventListener
      );
      window.removeEventListener(
        "listingHovered",
        handleListingHovered as EventListener
      );
      window.removeEventListener(
        "listingSelected",
        handleListingSelected as EventListener
      );
      window.removeEventListener(
        "infoWindowRequested",
        handleInfoWindowRequested as EventListener
      );
    };
  }, [addMarkersToMap, highlightMarker, selectMarker, openInfoWindow]);

  /** Init carte (une seule fois) */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    setIsApiLoading(true);
    cleanContainer(containerRef.current);

    try {
      const initCenter: MapboxCoordinates = isValidCoords(coordinates)
        ? coordsToMapbox(coordinates)!
        : MAPBOX_CONFIG.center;

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
          // mapActions.setMapInstance removed - not needed
          setIsApiLoaded(true);
          setIsApiLoading(false);
          enforceFlatView(map);

          if (!isValidCoords(coordinates)) {
            const fb = mapboxToStoreCoords(MAPBOX_CONFIG.center);
            if (fb) {
              mapActions.setCoordinates(fb);
              mapActions.setZoom(MAPBOX_CONFIG.zoom);
            }
          }

          updateStoreBounds(map);
          onMapReady?.(map);
        } catch (error) {
          console.error("Erreur load carte:", error);
          setIsApiLoading(false);
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
        setIsApiLoading(false);
      };
      map.on("error", handleMapError);

      return () => {
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

        if (containerRef.current) cleanContainer(containerRef.current);

        // mapActions.setMapInstance removed - not needed
        setIsApiLoaded(false);
        setIsApiLoading(false);
      };
    } catch (error) {
      console.error("Erreur init carte:", error);
      setIsApiLoading(false);
    }
  }, []);

  /** Suit les changements coords/zoom → met à jour la vue */
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
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ contain: "layout paint size" }}
      />

      <MapboxMarkers />

      {isApiLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backgroundColor: `${COLORS.BG_WHITE}BF`,
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
