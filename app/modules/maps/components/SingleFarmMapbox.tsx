"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
// ⚠️ Choisis UN seul endroit pour importer le CSS Mapbox.
// Si tu l'importes déjà dans globals.css, supprime la ligne suivante.
// import "mapbox-gl/dist/mapbox-gl.css";

import { COLORS } from "@/lib/config";
import { escapeHTML } from "@/lib/utils/sanitize";

interface SingleFarmMapboxProps {
  lat: string | number;
  lng: string | number;
  name?: string;
  className?: string;
  mapStyle?: string;
  initialZoom?: number;
  showControls?: boolean;
  onMapLoad?: (map: mapboxgl.Map) => void;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

const SingleFarmMapbox: React.FC<SingleFarmMapboxProps> = ({
  lat,
  lng,
  name = "Ferme",
  className = "",
  mapStyle = "mapbox://styles/mapbox/streets-v12",
  initialZoom = 13,
  showControls = true,
  onMapLoad,
}) => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const markerElementRef = useRef<HTMLDivElement | null>(null);
  const markerHandlersRef = useRef<{
    mouseenter: (() => void) | null;
    mouseleave: (() => void) | null;
  }>({ mouseenter: null, mouseleave: null });

  const [isLoaded, setIsLoaded] = useState(false);

  // ✅ Erreur "runtime" (Mapbox load fail, coords invalid, etc.)
  // (Pas l’erreur "token manquant" => gérée en render)
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const validateCoordinates = useCallback(
    (latV: string | number, lngV: string | number): Coordinates | null => {
      const latitude = typeof latV === "string" ? parseFloat(latV) : latV;
      const longitude = typeof lngV === "string" ? parseFloat(lngV) : lngV;

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude))
        return null;
      if (latitude < -90 || latitude > 90) return null;
      if (longitude < -180 || longitude > 180) return null;

      return { latitude, longitude };
    },
    [],
  );

  const createCustomMarker = useCallback((): HTMLDivElement => {
    const markerElement = document.createElement("div");
    markerElement.className = "custom-marker";
    markerElement.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background-color: ${COLORS.PRIMARY};
        border: 3px solid ${COLORS.BG_WHITE};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
        cursor: pointer;
      ">
        <svg
          style="transform: rotate(45deg); width: 20px; height: 20px;"
          fill="${COLORS.BG_WHITE}"
          viewBox="0 0 20 20"
        >
          <path d="M10 2a6 6 0 00-6 6c0 4.314 6 10 6 10s6-5.686 6-10a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z"/>
        </svg>
      </div>
    `;

    const handleMouseEnter = () => {
      const div = markerElement.querySelector("div") as HTMLDivElement | null;
      if (!div) return;
      div.style.transform = "rotate(-45deg) scale(1.1)";
      div.style.backgroundColor = COLORS.PRIMARY_DARK;
    };

    const handleMouseLeave = () => {
      const div = markerElement.querySelector("div") as HTMLDivElement | null;
      if (!div) return;
      div.style.transform = "rotate(-45deg) scale(1)";
      div.style.backgroundColor = COLORS.PRIMARY;
    };

    markerHandlersRef.current = {
      mouseenter: handleMouseEnter,
      mouseleave: handleMouseLeave,
    };
    markerElementRef.current = markerElement;

    markerElement.addEventListener("mouseenter", handleMouseEnter);
    markerElement.addEventListener("mouseleave", handleMouseLeave);

    return markerElement;
  }, []);

  const createCustomPopup = useCallback((farmName: string): mapboxgl.Popup => {
    const safeName = escapeHTML(farmName);

    return new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      closeOnClick: false,
      className: "custom-popup",
    }).setHTML(`
      <div style="
        padding: 12px;
        background-color: ${COLORS.BG_WHITE};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: 1px solid ${COLORS.BORDER};
      ">
        <p style="
          font-weight: 600;
          font-size: 14px;
          margin: 0;
          color: ${COLORS.TEXT_PRIMARY};
        ">${safeName}</p>
      </div>
    `);
  }, []);

  // ✅ 1) Init map (once) — pas de setState sync dans l’effect hors callbacks
  useEffect(() => {
    if (!token) return;
    if (!mapContainer.current) return;
    if (mapRef.current) return;

    mapboxgl.accessToken = token;

    try {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [2.3522, 48.8566],
        zoom: initialZoom,
        minZoom: 3,
        maxZoom: 18,
        attributionControl: false,
      });

      mapRef.current = map;

      if (showControls) {
        map.addControl(
          new mapboxgl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true,
          }),
          "top-right",
        );
        map.addControl(
          new mapboxgl.ScaleControl({ maxWidth: 100, unit: "metric" }),
          "bottom-left",
        );
        map.addControl(
          new mapboxgl.AttributionControl({ compact: true }),
          "bottom-right",
        );
      }

      const onLoad = () => {
        setIsLoaded(true);
        setRuntimeError(null);
        onMapLoad?.(map);
      };

      const onError = (e: any) => {
        console.error("Erreur Mapbox:", e);
        setRuntimeError("Erreur de chargement de la carte");
      };

      map.on("load", onLoad);
      map.on("error", onError);

      return () => {
        try {
          map.off("load", onLoad);
          map.off("error", onError);
        } catch {
          // noop: listeners may already be detached during teardown
        }

        try {
          if (
            markerElementRef.current &&
            markerHandlersRef.current.mouseenter &&
            markerHandlersRef.current.mouseleave
          ) {
            markerElementRef.current.removeEventListener(
              "mouseenter",
              markerHandlersRef.current.mouseenter,
            );
            markerElementRef.current.removeEventListener(
              "mouseleave",
              markerHandlersRef.current.mouseleave,
            );
          }
          markerHandlersRef.current = { mouseenter: null, mouseleave: null };
          markerElementRef.current = null;

          markerRef.current?.remove();
          markerRef.current = null;

          map.remove();
          mapRef.current = null;
        } catch (err) {
          console.error("Erreur cleanup map:", err);
        }
      };
    } catch (error) {
      console.error("Erreur init map:", error);
      queueMicrotask(() =>
        setRuntimeError("Impossible d'initialiser la carte"),
      );
    }
  }, [token, mapStyle, initialZoom, showControls, onMapLoad]);

  // ✅ 2) Update marker / view quand coords changent
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const coords = validateCoordinates(lat, lng);

    // helper pour respecter ESLint (pas de setState sync dans l'effet)
    const setRuntimeErrorAsync = (msg: string | null) => {
      queueMicrotask(() => setRuntimeError(msg));
    };

    if (!coords) {
      setRuntimeErrorAsync(`Coordonnées invalides: lat=${lat}, lng=${lng}`);
      return;
    }

    const { latitude, longitude } = coords;

    try {
      setRuntimeErrorAsync(null);

      map.easeTo({
        center: [longitude, latitude],
        zoom: initialZoom,
        duration: 450,
        essential: true,
      });

      if (!markerRef.current) {
        const markerEl = createCustomMarker();
        const marker = new mapboxgl.Marker({
          element: markerEl,
          anchor: "bottom",
        })
          .setLngLat([longitude, latitude])
          .addTo(map);

        markerRef.current = marker;
      } else {
        markerRef.current.setLngLat([longitude, latitude]);
      }

      if (name?.trim()) {
        markerRef.current.setPopup(createCustomPopup(name.trim()));
      } else {
        // Mapbox n'accepte pas "undefined" proprement ici -> on "unset" via any
        markerRef.current.setPopup(undefined as any);
      }
    } catch (err) {
      console.error("Erreur update map/marker:", err);
      setRuntimeErrorAsync("Erreur lors de la mise à jour de la carte");
    }
  }, [
    lat,
    lng,
    name,
    initialZoom,
    validateCoordinates,
    createCustomMarker,
    createCustomPopup,
  ]);


  // ✅ Token manquant => géré SANS effect (donc pas de setState in effect)
  if (!token) {
    return (
      <div
        className={`flex items-center justify-center h-full text-center p-6 ${className}`}
        style={{
          backgroundColor: COLORS.BG_GRAY,
          color: COLORS.TEXT_SECONDARY,
          minHeight: "300px",
        }}
      >
        <div>
          <div
            className="text-lg font-semibold mb-2"
            style={{ color: COLORS.ERROR }}
          >
            Token Mapbox manquant
          </div>
          <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>
            Ajoutez NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN à votre .env.local
          </p>
        </div>
      </div>
    );
  }

  if (runtimeError) {
    return (
      <div
        className={`flex items-center justify-center h-full text-center p-6 ${className}`}
        style={{
          backgroundColor: COLORS.BG_GRAY,
          color: COLORS.TEXT_SECONDARY,
          minHeight: "300px",
        }}
      >
        <div>
          <div
            className="text-lg font-semibold mb-2"
            style={{ color: COLORS.ERROR }}
          >
            Erreur de carte
          </div>
          <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>
            {runtimeError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full relative ${className}`}>
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ minHeight: "300px" }}
      />

      {!isLoaded && (
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
};

export default SingleFarmMapbox;
