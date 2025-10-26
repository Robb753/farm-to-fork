"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import {
  useMapboxState,
  useMapboxActions,
  MAPBOX_CONFIG,
} from "@/lib/store/mapboxListingsStore";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

export default function MapboxSection({ isMapExpanded = false }) {
  // Wrapper (peut accueillir d'autres éléments) et conteneur map STRICTEMENT vide
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  const { coordinates, zoom, style } = useMapboxState();
  const {
    setMapInstance,
    setMapBounds,
    setMapLoaded,
    setMapLoading,
    setMapZoom,
    setMapPitch,
    setMapBearing,
  } = useMapboxActions();

  // ---- 1️⃣ Initialisation (une seule fois) ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    setMapLoading(true);

    // 🧹 IMPORTANT: purger tout contenu éventuel du conteneur
    try {
      containerRef.current.replaceChildren(); // supprime tous les enfants sans recréer le nœud
    } catch {
      containerRef.current.innerHTML = "";
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    }

    const [lng, lat] = Array.isArray(coordinates)
      ? coordinates
      : MAPBOX_CONFIG.center;

    const map = new mapboxgl.Map({
      container: containerRef.current, // NE PAS passer le wrapper ici
      style: style || MAPBOX_CONFIG.style,
      center: [lng, lat],
      zoom: typeof zoom === "number" ? zoom : MAPBOX_CONFIG.zoom,
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

      const b = map.getBounds();
      setMapBounds([
        [b.getWest(), b.getSouth()],
        [b.getEast(), b.getNorth()],
      ]);
    });

    const onMoveEnd = () => {
      const b = map.getBounds();
      setMapBounds([
        [b.getWest(), b.getSouth()],
        [b.getEast(), b.getNorth()],
      ]);
      setMapZoom(map.getZoom());
    };

    map.on("moveend", onMoveEnd);
    map.on("zoomend", onMoveEnd);

    return () => {
      if (mapRef.current) {
        map.off("style.load", enforceFlatView);
        map.off("moveend", onMoveEnd);
        map.off("zoomend", onMoveEnd);
        map.remove(); // retire canvas + contrôles du container
        mapRef.current = null;
      }
      // 🧹 Purge finale du container pour éviter tout résidu au prochain mount
      if (containerRef.current) {
        try {
          containerRef.current.replaceChildren();
        } catch {
          containerRef.current.innerHTML = "";
        }
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

    const [lng, lat] = Array.isArray(coordinates)
      ? coordinates
      : MAPBOX_CONFIG.center;

    const newZoom = typeof zoom === "number" ? zoom : MAPBOX_CONFIG.zoom;
    const curCenter = map.getCenter();
    const curZoom = map.getZoom();

    if (
      Math.abs(curCenter.lat - lat) < 1e-6 &&
      Math.abs(curCenter.lng - lng) < 1e-6 &&
      Math.abs(curZoom - newZoom) < 1e-3
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
      {/* Place ici d'éventuels overlays, pas dans containerRef */}
      {/* <div className="pointer-events-none absolute inset-0">…</div> */}
    </div>
  );
}
