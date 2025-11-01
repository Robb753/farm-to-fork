"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

// ✅ Import du nouveau store unifié
import {
  useMapState,
  useMapActions,
  MAPBOX_CONFIG,
} from "@/lib/store/migratedStore";

import MapboxMarkers from "./MapboxMarkers";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

// Helpers de validation
const isFiniteNumber = (n) => Number.isFinite(n);

// Fonction pour convertir les coordonnées du store vers le format Mapbox
const coordsToMapbox = (coords) => {
  if (!coords) return null;

  // Si c'est un objet {lat, lng}
  if (coords.lat !== undefined && coords.lng !== undefined) {
    return [coords.lng, coords.lat]; // Mapbox veut [lng, lat]
  }

  // Si c'est déjà un array [lng, lat]
  if (Array.isArray(coords) && coords.length === 2) {
    return coords;
  }

  return null;
};

// Fonction pour convertir les coordonnées Mapbox vers le format du store
const mapboxToStoreCoords = (lngLat) => {
  if (!lngLat) return null;

  // Si c'est un objet Mapbox LngLat
  if (lngLat.lng !== undefined && lngLat.lat !== undefined) {
    return { lng: lngLat.lng, lat: lngLat.lat };
  }

  // Si c'est un array [lng, lat]
  if (Array.isArray(lngLat) && lngLat.length === 2) {
    return { lng: lngLat[0], lat: lngLat[1] };
  }

  return null;
};

const isValidCoords = (coords) => {
  const mapboxCoords = coordsToMapbox(coords);
  if (!mapboxCoords) return false;

  const [lng, lat] = mapboxCoords;
  return (
    isFiniteNumber(lng) && isFiniteNumber(lat) && !(lng === 0 && lat === 0) // évite le (0,0) Afrique
  );
};

export default function MapboxSection({ isMapExpanded = false }) {
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const userInteractingRef = useRef(false);

  // ✅ Utilisation du nouveau store unifié - zoom devient "zoom" au lieu de "mapZoom"
  const { coordinates, zoom, isApiLoaded, isApiLoading } = useMapState();
  const {
    setMapInstance,
    setMapBounds,
    setApiLoaded,
    setApiLoading,
    setZoom, // ✅ setMapZoom → setZoom
    setCoordinates,
  } = useMapActions();

  // ---- 1️⃣ Initialisation (une seule fois) ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    setApiLoading(true);

    // Purge défensive
    try {
      containerRef.current.replaceChildren();
    } catch {
      containerRef.current.innerHTML = "";
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    }

    // Centre/zoom init avec Fallback France si coords invalides
    const initCenter = isValidCoords(coordinates)
      ? coordsToMapbox(coordinates)
      : MAPBOX_CONFIG.center; // [2.2137, 46.2276]

    const initZoom =
      typeof zoom === "number" && zoom >= MAPBOX_CONFIG.minZoom // ✅ mapZoom → zoom
        ? zoom
        : MAPBOX_CONFIG.zoom; // 4.6

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

    // Contrôles
    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "bottom-right"
    );
    map.addControl(
      new mapboxgl.ScaleControl({ maxWidth: 80, unit: "metric" }),
      "bottom-left"
    );

    const enforceFlatView = () => {
      try {
        if (map.getProjection?.().name !== "mercator")
          map.setProjection("mercator");
        map.setPitch(0);
        map.setBearing(0);
      } catch {}
    };

    map.on("style.load", enforceFlatView);

    map.on("load", () => {
      setMapInstance(map);
      setApiLoaded(true);
      setApiLoading(false);
      enforceFlatView();

      // Si le store était invalide, on pousse le fallback France
      if (!isValidCoords(coordinates)) {
        const fallbackCoords = mapboxToStoreCoords(MAPBOX_CONFIG.center);
        setCoordinates(fallbackCoords);
        setZoom(MAPBOX_CONFIG.zoom); // ✅ setMapZoom → setZoom
      }

      // Bounds init → store (format array pour compatibilité)
      const b = map.getBounds();
      setMapBounds([
        [b.getWest(), b.getSouth()],
        [b.getEast(), b.getNorth()],
      ]);
    });

    const onMoveStart = (e) => {
      if (e && e.originalEvent) userInteractingRef.current = true;
    };

    const onMoveEnd = () => {
      const b = map.getBounds();
      setMapBounds([
        [b.getWest(), b.getSouth()],
        [b.getEast(), b.getNorth()],
      ]);
      setZoom(map.getZoom()); // ✅ setMapZoom → setZoom

      // Mettre à jour les coordonnées du centre
      const center = map.getCenter();
      const centerCoords = mapboxToStoreCoords(center);
      if (centerCoords) {
        setCoordinates(centerCoords);
      }

      // reset flag après un tick
      setTimeout(() => {
        userInteractingRef.current = false;
      }, 100);
    };

    map.on("movestart", onMoveStart);
    map.on("zoomstart", onMoveStart);
    map.on("moveend", onMoveEnd);
    map.on("zoomend", onMoveEnd);

    return () => {
      if (mapRef.current) {
        map.off("style.load", enforceFlatView);
        map.off("movestart", onMoveStart);
        map.off("zoomstart", onMoveStart);
        map.off("moveend", onMoveEnd);
        map.off("zoomend", onMoveEnd);
        map.remove();
        mapRef.current = null;
      }
      try {
        containerRef.current?.replaceChildren();
      } catch {
        if (containerRef.current) containerRef.current.innerHTML = "";
      }
      setMapInstance(null);
      setApiLoaded(false);
      setApiLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- 2️⃣ Mise à jour de la vue ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Ne pas bouger si l'utilisateur manipule
    if (userInteractingRef.current) return;

    // Ignore toute coordonnée invalide
    if (!isValidCoords(coordinates)) return;

    const mapboxCoords = coordsToMapbox(coordinates);
    if (!mapboxCoords) return;

    const newZoom =
      typeof zoom === "number" && zoom >= MAPBOX_CONFIG.minZoom // ✅ mapZoom → zoom
        ? zoom
        : MAPBOX_CONFIG.zoom;

    const curCenter = map.getCenter();
    const curZoom = map.getZoom();

    // évite micro-ajustements
    if (
      Math.abs(curCenter.lat - mapboxCoords[1]) < 1e-4 &&
      Math.abs(curCenter.lng - mapboxCoords[0]) < 1e-4 &&
      Math.abs(curZoom - newZoom) < 0.01
    )
      return;

    map.easeTo({
      center: mapboxCoords,
      zoom: newZoom,
      duration: 500,
      essential: true,
    });
  }, [coordinates, zoom]); // ✅ mapZoom → zoom

  // ---- 3️⃣ Resize ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const t = setTimeout(() => map.resize(), 350);
    return () => clearTimeout(t);
  }, [isMapExpanded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const onResize = () => map.resize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div ref={wrapperRef} className="h-full w-full relative">
      {/* ⚠️ Cette DIV DOIT rester vide : Mapbox y injecte son canvas */}
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ contain: "layout paint size" }}
      />

      {/* Markers + popups contrôlés */}
      <MapboxMarkers />
    </div>
  );
}
