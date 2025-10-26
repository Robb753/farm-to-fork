"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import {
  useMapboxState,
  useMapboxActions,
  MAPBOX_CONFIG,
} from "@/lib/store/mapboxListingsStore";
import MapboxMarkers from "./MapboxMarkers";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

// Helpers de validation
const isFiniteNumber = (n) => Number.isFinite(n);
const isValidLngLat = (v) =>
  Array.isArray(v) &&
  v.length === 2 &&
  isFiniteNumber(v[0]) &&
  isFiniteNumber(v[1]) &&
  !(v[0] === 0 && v[1] === 0); // évite le (0,0) Afrique

export default function MapboxSection({ isMapExpanded = false }) {
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const userInteractingRef = useRef(false);

  const { coordinates, zoom, style } = useMapboxState();
  const {
    setMapInstance,
    setMapBounds,
    setMapLoaded,
    setMapLoading,
    setMapZoom,
    setMapPitch,
    setMapBearing,
    setCoordinates, // ⚠️ on l’utilise pour pousser le fallback France si nécessaire
  } = useMapboxActions();

  // ---- 1️⃣ Initialisation (une seule fois) ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    setMapLoading(true);

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
    const initCenter = isValidLngLat(coordinates)
      ? coordinates
      : MAPBOX_CONFIG.center; // [2.2137, 46.2276]
    const initZoom =
      typeof zoom === "number" && zoom >= MAPBOX_CONFIG.minZoom
        ? zoom
        : MAPBOX_CONFIG.zoom; // 5.6

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: style || MAPBOX_CONFIG.style,
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
        setMapPitch(0);
        setMapBearing(0);
      } catch {}
    };

    map.on("style.load", enforceFlatView);

    map.on("load", () => {
      setMapInstance(map);
      setMapLoaded(true);
      setMapLoading(false);
      enforceFlatView();

      // Si le store était invalide (ex: [0,0] ou undefined), on pousse le fallback France
      if (!isValidLngLat(coordinates)) {
        setCoordinates(MAPBOX_CONFIG.center);
        setMapZoom(MAPBOX_CONFIG.zoom);
      }

      // Bounds init → store
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
      setMapZoom(map.getZoom());
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
      setMapLoaded(false);
      setMapLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- 2️⃣ Mise à jour de la vue ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Ne pas bouger si l'utilisateur manipule
    if (userInteractingRef.current) return;

    // Ignore toute coordonnée invalide (évite le saut vers Afrique)
    if (!isValidLngLat(coordinates)) return;

    const [lng, lat] = coordinates;
    const newZoom =
      typeof zoom === "number" && zoom >= MAPBOX_CONFIG.minZoom
        ? zoom
        : MAPBOX_CONFIG.zoom;

    const curCenter = map.getCenter();
    const curZoom = map.getZoom();

    // évite micro-ajustements
    if (
      Math.abs(curCenter.lat - lat) < 1e-4 &&
      Math.abs(curCenter.lng - lng) < 1e-4 &&
      Math.abs(curZoom - newZoom) < 0.01
    )
      return;

    map.easeTo({
      center: [lng, lat],
      zoom: newZoom,
      duration: 500,
      essential: true,
    });
  }, [coordinates, zoom]);

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
