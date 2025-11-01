"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

// ✅ Import du nouveau store unifié
import { useMapState, useListingsState } from "@/lib/store/migratedStore";

/**
 * Version ultra-simple avec vérification robuste de l'état de la carte
 */
export default function MapboxMarkers() {
  const { mapInstance } = useMapState();
  const { visible: visibleListings } = useListingsState();
  const markersRef = useRef(new Map());

  // Nettoyage de tous les marqueurs
  const cleanupMarkers = () => {
    markersRef.current.forEach((marker) => {
      try {
        marker.remove();
      } catch (e) {
        // Silent cleanup
      }
    });
    markersRef.current.clear();
  };

  // Vérification robuste que la carte est prête
  const isMapReady = (map) => {
    if (!map) return false;

    try {
      // Vérifier que la carte a un container DOM
      const container = map.getContainer();
      if (!container) return false;

      // Vérifier que le container est dans le DOM
      if (!container.isConnected) return false;

      // Vérifier que le style est chargé
      if (typeof map.isStyleLoaded === "function" && !map.isStyleLoaded()) {
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  };

  // Création/mise à jour des markers
  useEffect(() => {
    // Attendre que la carte soit complètement prête
    if (!isMapReady(mapInstance)) {
      return;
    }

    if (!Array.isArray(visibleListings)) {
      return;
    }

    // Nettoie les anciens markers
    cleanupMarkers();

    // Ajoute les nouveaux markers
    visibleListings.forEach((listing) => {
      const lat = Number(listing?.lat);
      const lng = Number(listing?.lng);
      const id = listing?.id;

      // Validation stricte
      if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        return;
      }

      try {
        // ✅ Marqueur Mapbox standard - le plus simple possible
        const marker = new mapboxgl.Marker({
          color: "#22c55e", // Vert
        }).setLngLat([lng, lat]);

        // ✅ Vérification finale avant l'ajout
        if (isMapReady(mapInstance)) {
          marker.addTo(mapInstance);
          markersRef.current.set(id, marker);
          console.log(`Marker created for listing ${id} at [${lng}, ${lat}]`);
        }
      } catch (err) {
        console.error(`Erreur création marker ${id}:`, err);
      }
    });
  }, [mapInstance, visibleListings]);

  // Écouter les événements de la carte pour s'assurer qu'elle est prête
  useEffect(() => {
    if (!mapInstance) return;

    const handleStyleLoad = () => {
      // Recréer les markers quand le style est chargé
      setTimeout(() => {
        // Re-trigger l'effet principal
        if (visibleListings && visibleListings.length > 0) {
          cleanupMarkers();
          // L'effet principal se déclenchera automatiquement
        }
      }, 100);
    };

    mapInstance.on("styledata", handleStyleLoad);
    mapInstance.on("load", handleStyleLoad);

    return () => {
      try {
        mapInstance.off("styledata", handleStyleLoad);
        mapInstance.off("load", handleStyleLoad);
      } catch (e) {
        // Silent cleanup
      }
    };
  }, [mapInstance, visibleListings]);

  // Nettoyage final
  useEffect(() => {
    return cleanupMarkers;
  }, []);

  return null;
}
