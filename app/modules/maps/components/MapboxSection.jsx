"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import {
  useMapState, // ✅ Import corrigé
  useMapActions, // ✅ Import corrigé
  MAPBOX_CONFIG,
} from "@/lib/store/mapListingsStore";
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

export default function MapboxSection({
  isMapExpanded = false,
  isMobile = false,
}) {
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const userInteractingRef = useRef(false);

  // ✅ États locaux pour gérer le loading et autres propriétés non présentes dans le store
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);

  // ✅ Hooks corrigés
  const { coordinates, mapZoom, mapInstance } = useMapState();
  const { setMapInstance, setMapBounds, setMapZoom, setCoordinates } =
    useMapActions();

  // ---- 1️⃣ Initialisation (une seule fois) ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    setIsMapLoading(true);

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
      typeof mapZoom === "number" && mapZoom >= MAPBOX_CONFIG.minZoom
        ? mapZoom
        : MAPBOX_CONFIG.zoom; // 4.6

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_CONFIG.style,
      center: initCenter,
      zoom: initZoom,
      minZoom: MAPBOX_CONFIG.minZoom,
      maxZoom: MAPBOX_CONFIG.maxZoom,
      cooperativeGestures: !isMobile, // ✅ Désactive les gestes coopératifs sur mobile
      attributionControl: false,
      pitch: 0,
      bearing: 0,
      projection: "mercator",
    });

    mapRef.current = map;

    // Contrôles (pas sur mobile pour éviter l'encombrement)
    if (!isMobile) {
      map.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        "bottom-right"
      );
      map.addControl(
        new mapboxgl.ScaleControl({ maxWidth: 80, unit: "metric" }),
        "bottom-left"
      );
    }

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
      setIsMapLoaded(true);
      setIsMapLoading(false);
      enforceFlatView();

      // Si le store était invalide (ex: [0,0] ou undefined), on pousse le fallback France
      if (!isValidLngLat(coordinates)) {
        setCoordinates({
          lat: MAPBOX_CONFIG.center[1],
          lng: MAPBOX_CONFIG.center[0],
        });
        setMapZoom(MAPBOX_CONFIG.zoom);
      }

      // Bounds init → store
      const b = map.getBounds();
      setMapBounds({
        sw: { lat: b.getSouth(), lng: b.getWest() },
        ne: { lat: b.getNorth(), lng: b.getEast() },
      });
    });

    const onMoveStart = (e) => {
      if (e && e.originalEvent) userInteractingRef.current = true;
    };

    const onMoveEnd = () => {
      const b = map.getBounds();
      setMapBounds({
        sw: { lat: b.getSouth(), lng: b.getWest() },
        ne: { lat: b.getNorth(), lng: b.getEast() },
      });
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
      setIsMapLoaded(false);
      setIsMapLoading(false);
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
    if (!coordinates || !isValidLngLat([coordinates.lng, coordinates.lat]))
      return;

    const { lng, lat } = coordinates;
    const newZoom =
      typeof mapZoom === "number" && mapZoom >= MAPBOX_CONFIG.minZoom
        ? mapZoom
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
  }, [coordinates, mapZoom]);

  // ---- 3️⃣ Resize ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    // Force resize après changement de layout avec délai plus long
    const t1 = setTimeout(() => {
      try {
        map.resize();
        console.log("Map resized after layout change");
      } catch (e) {
        console.warn("Map resize error:", e);
      }
    }, 100);

    const t2 = setTimeout(() => {
      try {
        map.resize();
      } catch (e) {
        console.warn("Map resize error 2:", e);
      }
    }, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isMapExpanded, isMapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onResize = () => {
      try {
        map.resize();
      } catch (e) {
        console.warn("Window resize error:", e);
      }
    };

    window.addEventListener("resize", onResize);

    // Force resize initial après le chargement
    setTimeout(() => {
      try {
        map.resize();
      } catch (e) {}
    }, 1000);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const onResize = () => map.resize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ✅ Indicateur de chargement
  if (isMapLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="h-full w-full relative">
      {/* ⚠️ Cette DIV DOIT rester vide : Mapbox y injecte son canvas */}
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ contain: "layout paint size" }}
      />

      {/* Markers + popups contrôlés - seulement si la carte est chargée */}
      {isMapLoaded && <MapboxMarkers />}
    </div>
  );
}
