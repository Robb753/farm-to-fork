"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Configuration du token Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const SingleFarmMapbox = ({ lat, lng, name = "Ferme" }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Vérifier que les coordonnées sont valides
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      console.error("Coordonnées invalides:", { lat, lng });
      return;
    }

    try {
      // Initialiser la carte
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [longitude, latitude],
        zoom: 13,
        minZoom: 3,
        maxZoom: 18,
      });

      mapRef.current = map;

      map.on("load", () => {
        setIsLoaded(true);

        // Ajouter un marqueur personnalisé
        const el = document.createElement("div");
        el.className = "custom-marker";
        el.innerHTML = `
          <div style="
            width: 40px;
            height: 40px;
            background-color: #22c55e;
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg
              style="transform: rotate(45deg); width: 20px; height: 20px;"
              fill="white"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a6 6 0 00-6 6c0 4.314 6 10 6 10s6-5.686 6-10a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z"/>
            </svg>
          </div>
        `;

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat([longitude, latitude])
          .addTo(map);

        markerRef.current = marker;

        // Ajouter un popup avec le nom
        if (name) {
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            closeOnClick: false,
          }).setHTML(`
            <div class="p-2">
              <p class="font-medium text-sm">${name}</p>
            </div>
          `);

          marker.setPopup(popup);
        }
      });

      // Ajouter les contrôles de navigation
      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Ajouter le contrôle d'échelle
      map.addControl(
        new mapboxgl.ScaleControl({
          maxWidth: 80,
          unit: "metric",
        }),
        "bottom-left"
      );
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la carte:", error);
    }

    // Nettoyage
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, name]);

  // Vérifier le token Mapbox
  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 text-gray-600">
        <div className="text-center p-6">
          <p className="text-red-600 font-medium">Token Mapbox manquant</p>
          <p className="text-sm text-gray-600 mt-2">
            Ajoutez NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN à votre .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ minHeight: "300px" }}
      />

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Chargement de la carte...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleFarmMapbox;
