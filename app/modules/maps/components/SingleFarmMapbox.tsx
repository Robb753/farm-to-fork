"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { COLORS } from "@/lib/config";
import { escapeHTML } from "@/lib/utils/sanitize";

// Configuration du token Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

/**
 * Interfaces TypeScript pour SingleFarmMapbox
 */
interface SingleFarmMapboxProps {
  /** Latitude de la ferme */
  lat: string | number;
  /** Longitude de la ferme */
  lng: string | number;
  /** Nom de la ferme à afficher */
  name?: string;
  /** Classe CSS personnalisée */
  className?: string;
  /** Style de carte Mapbox */
  mapStyle?: string;
  /** Zoom initial */
  initialZoom?: number;
  /** Afficher les contrôles de navigation */
  showControls?: boolean;
  /** Callback appelé quand la carte est prête */
  onMapLoad?: (map: mapboxgl.Map) => void;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Composant carte Mapbox pour afficher une ferme unique
 */
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
  // Refs pour la gestion de la carte et du marqueur
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const markerElementRef = useRef<HTMLDivElement | null>(null);
  const markerHandlersRef = useRef<{
    mouseenter: (() => void) | null;
    mouseleave: (() => void) | null;
  }>({ mouseenter: null, mouseleave: null });

  // États locaux
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  /**
   * Valide et convertit les coordonnées
   */
  const validateCoordinates = useCallback(
    (lat: string | number, lng: string | number): Coordinates | null => {
      try {
        const latitude = typeof lat === "string" ? parseFloat(lat) : lat;
        const longitude = typeof lng === "string" ? parseFloat(lng) : lng;

        if (isNaN(latitude) || isNaN(longitude)) {
          throw new Error(`Coordonnées invalides: lat=${lat}, lng=${lng}`);
        }

        if (latitude < -90 || latitude > 90) {
          throw new Error(
            `Latitude hors limites: ${latitude} (doit être entre -90 et 90)`
          );
        }

        if (longitude < -180 || longitude > 180) {
          throw new Error(
            `Longitude hors limites: ${longitude} (doit être entre -180 et 180)`
          );
        }

        return { latitude, longitude };
      } catch (error) {
        console.error("Erreur de validation des coordonnées:", error);
        setHasError(true);
        setErrorMessage(
          error instanceof Error ? error.message : "Coordonnées invalides"
        );
        return null;
      }
    },
    []
  );

  /**
   * Crée un marqueur personnalisé avec le design du système
   */
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

    // Create named event handlers for proper cleanup
    const handleMouseEnter = () => {
      const div = markerElement.querySelector("div") as HTMLDivElement;
      if (div) {
        div.style.transform = "rotate(-45deg) scale(1.1)";
        div.style.backgroundColor = COLORS.PRIMARY_DARK;
      }
    };

    const handleMouseLeave = () => {
      const div = markerElement.querySelector("div") as HTMLDivElement;
      if (div) {
        div.style.transform = "rotate(-45deg) scale(1)";
        div.style.backgroundColor = COLORS.PRIMARY;
      }
    };

    // Store handlers and element for cleanup
    markerHandlersRef.current = {
      mouseenter: handleMouseEnter,
      mouseleave: handleMouseLeave,
    };
    markerElementRef.current = markerElement;

    // Add event listeners
    markerElement.addEventListener("mouseenter", handleMouseEnter);
    markerElement.addEventListener("mouseleave", handleMouseLeave);

    return markerElement;
  }, []);

  /**
   * Crée un popup personnalisé (avec échappement XSS)
   */
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

  /**
   * Initialise la carte Mapbox
   */
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const coordinates = validateCoordinates(lat, lng);
    if (!coordinates) return;

    const { latitude, longitude } = coordinates;

    try {
      // Initialiser la carte
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [longitude, latitude],
        zoom: initialZoom,
        minZoom: 3,
        maxZoom: 18,
        attributionControl: false, // On l'ajoutera manuellement
      });

      mapRef.current = map;

      // Gestion des événements de carte
      map.on("load", () => {
        try {
          setIsLoaded(true);
          setHasError(false);

          // Créer et ajouter le marqueur personnalisé
          const markerElement = createCustomMarker();
          const marker = new mapboxgl.Marker({
            element: markerElement,
            anchor: "bottom",
          })
            .setLngLat([longitude, latitude])
            .addTo(map);

          markerRef.current = marker;

          // Ajouter un popup si un nom est fourni
          if (name?.trim()) {
            const popup = createCustomPopup(name.trim());
            marker.setPopup(popup);
          }

          // Callback optionnel
          onMapLoad?.(map);
        } catch (error) {
          console.error("Erreur lors du chargement de la carte:", error);
          setHasError(true);
          setErrorMessage("Erreur lors du chargement de la carte");
        }
      });

      map.on("error", (e) => {
        console.error("Erreur Mapbox:", e);
        setHasError(true);
        setErrorMessage("Erreur de chargement de la carte");
      });

      // Ajouter les contrôles si demandé
      if (showControls) {
        // Contrôles de navigation
        map.addControl(
          new mapboxgl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true,
          }),
          "top-right"
        );

        // Contrôle d'échelle
        map.addControl(
          new mapboxgl.ScaleControl({
            maxWidth: 100,
            unit: "metric",
          }),
          "bottom-left"
        );

        // Attribution
        map.addControl(
          new mapboxgl.AttributionControl({
            compact: true,
          }),
          "bottom-right"
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la carte:", error);
      setHasError(true);
      setErrorMessage("Impossible d'initialiser la carte");
    }

    // Nettoyage
    return () => {
      try {
        // Remove event listeners before removing marker
        if (
          markerElementRef.current &&
          markerHandlersRef.current.mouseenter &&
          markerHandlersRef.current.mouseleave
        ) {
          markerElementRef.current.removeEventListener(
            "mouseenter",
            markerHandlersRef.current.mouseenter
          );
          markerElementRef.current.removeEventListener(
            "mouseleave",
            markerHandlersRef.current.mouseleave
          );
        }
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
        markerElementRef.current = null;
        markerHandlersRef.current = { mouseenter: null, mouseleave: null };
      } catch (error) {
        console.error("Erreur lors du nettoyage de la carte:", error);
      }
    };
  }, [
    lat,
    lng,
    name,
    mapStyle,
    initialZoom,
    showControls,
    validateCoordinates,
    createCustomMarker,
    createCustomPopup,
    onMapLoad,
  ]);

  /**
   * Vérification du token Mapbox
   */
  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
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

  /**
   * Affichage en cas d'erreur
   */
  if (hasError) {
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
            {errorMessage || "Impossible de charger la carte"}
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

      {/* Loading state */}
      {!isLoaded && !hasError && (
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
}; 

export default SingleFarmMapbox;
