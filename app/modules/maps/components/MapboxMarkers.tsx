"use client";

import React, { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";

// ✅ Import du nouveau store unifié
import { COLORS } from "@/lib/config";
import { useListingsState, useMapState } from "@/lib/store";
import type { Listing } from "@/lib/store";

/**
 * Interface pour les données de marqueur
 */
interface MarkerData {
  marker: mapboxgl.Marker;
  listing: Listing;
}

/**
 * Composant MapboxMarkers ultra-robuste avec vérifications complètes
 *
 * Features:
 * - Vérification robuste de l'état de la carte
 * - Gestion d'erreurs complète avec try-catch
 * - Types TypeScript stricts pour la sécurité
 * - Marqueurs avec couleurs du design system
 * - Nettoyage automatique des ressources
 * - Logs détaillés pour le debugging
 * - Gestion des événements de style de carte
 *
 * @returns Composant null (marqueurs sont injectés dans la carte)
 */
export default function MapboxMarkers(): null {
  const { mapInstance } = useMapState();
  const { visible: visibleListings } = useListingsState();
  const markersRef = useRef<Map<string | number, MarkerData>>(new Map());

  /**
   * Nettoie tous les marqueurs de la carte
   */
  const cleanupMarkers = useCallback((): void => {
    markersRef.current.forEach((markerData, id) => {
      try {
        markerData.marker.remove();
      } catch (error) {
        console.warn(`Erreur lors de la suppression du marker ${id}:`, error);
      }
    });
    markersRef.current.clear();
  }, []);

  /**
   * Vérification robuste que la carte est prête à recevoir des marqueurs
   */
  const isMapReady = useCallback(
    (map: mapboxgl.Map | null): map is mapboxgl.Map => {
      if (!map) return false;

      try {
        // Vérifier que la carte a un container DOM
        const container = map.getContainer();
        if (!container) {
          console.debug("Carte sans container DOM");
          return false;
        }

        // Vérifier que le container est dans le DOM
        if (!container.isConnected) {
          console.debug("Container de carte non connecté au DOM");
          return false;
        }

        // Vérifier que le style est chargé
        if (typeof map.isStyleLoaded === "function" && !map.isStyleLoaded()) {
          console.debug("Style de carte non chargé");
          return false;
        }

        // Vérifier que la carte n'est pas en cours de suppression
        if ((map as any)._removed) {
          console.debug("Carte marquée comme supprimée");
          return false;
        }

        return true;
      } catch (error) {
        console.warn(
          "Erreur lors de la vérification de l'état de la carte:",
          error
        );
        return false;
      }
    },
    []
  );

  /**
   * ✅ Valide les coordonnées d'un listing avec le nouveau format
   */
  const validateCoordinates = useCallback(
    (listing: Listing): { lat: number; lng: number } | null => {
      try {
        // ✅ Utilise directement les propriétés lat/lng du type Listing
        const lat =
          typeof listing.lat === "number" ? listing.lat : Number(listing.lat);
        const lng =
          typeof listing.lng === "number" ? listing.lng : Number(listing.lng);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          console.debug(
            `Coordonnées invalides pour listing ${listing.id}: lat=${listing.lat}, lng=${listing.lng}`
          );
          return null;
        }

        // Validation des limites géographiques
        if (lat < -90 || lat > 90) {
          console.warn(
            `Latitude hors limites pour listing ${listing.id}: ${lat}`
          );
          return null;
        }

        if (lng < -180 || lng > 180) {
          console.warn(
            `Longitude hors limites pour listing ${listing.id}: ${lng}`
          );
          return null;
        }

        // Éviter le point (0,0) qui est souvent une erreur
        if (lat === 0 && lng === 0) {
          console.debug(
            `Coordonnées (0,0) rejetées pour listing ${listing.id}`
          );
          return null;
        }

        return { lat, lng };
      } catch (error) {
        console.error(
          `Erreur lors de la validation des coordonnées pour listing ${listing.id}:`,
          error
        );
        return null;
      }
    },
    []
  );

  /**
   * Crée un marqueur personnalisé pour un listing
   */
  const createMarker = useCallback(
    (
      listing: Listing,
      coordinates: { lat: number; lng: number }
    ): mapboxgl.Marker | null => {
      try {
        // ✅ Marqueur avec couleur du design system
        const marker = new mapboxgl.Marker({
          color: COLORS.PRIMARY,
          scale: 1,
          draggable: false,
        }).setLngLat([coordinates.lng, coordinates.lat]);

        // Optionnel : Popup avec informations du listing
        if (listing.name) {
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false,
            className: "listing-popup",
          }).setHTML(`
          <div style="
            padding: 8px 12px;
            font-family: system-ui, -apple-system, sans-serif;
            background: ${COLORS.BG_WHITE};
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          ">
            <p style="
              margin: 0;
              font-weight: 600;
              font-size: 14px;
              color: ${COLORS.TEXT_PRIMARY};
            ">${listing.name}</p>
            ${
              listing.address
                ? `
            <p style="
              margin: 4px 0 0 0;
              font-size: 12px;
              color: ${COLORS.TEXT_SECONDARY};
            ">${listing.address}</p>
            `
                : ""
            }
          </div>
        `);

          marker.setPopup(popup);
        }

        return marker;
      } catch (error) {
        console.error(
          `Erreur lors de la création du marker pour listing ${listing.id}:`,
          error
        );
        return null;
      }
    },
    []
  );

  /**
   * Création/mise à jour des marqueurs
   */
  useEffect(() => {
    // Attendre que la carte soit complètement prête
    if (!isMapReady(mapInstance)) {
      console.debug("Carte non prête, skip création marqueurs");
      return;
    }

    if (!Array.isArray(visibleListings)) {
      console.debug("Pas de listings visibles ou format invalide");
      return;
    }

    console.debug(
      `🎯 Mise à jour des marqueurs: ${visibleListings.length} listings`
    );

    // ✅ Debug des premiers listings pour vérifier la structure
    if (visibleListings.length > 0) {
      const firstListing = visibleListings[0];
      console.debug("📋 Structure du premier listing:", {
        id: firstListing.id,
        name: firstListing.name,
        lat: firstListing.lat,
        lng: firstListing.lng,
        type_lat: typeof firstListing.lat,
        type_lng: typeof firstListing.lng,
      });
    }

    // Nettoie les anciens marqueurs
    cleanupMarkers();

    let successCount = 0;
    let errorCount = 0;

    // Ajoute les nouveaux marqueurs
    visibleListings.forEach((listing: Listing) => {
      const id = listing?.id;

      if (!id) {
        console.debug("Listing sans ID, ignoré");
        errorCount++;
        return;
      }

      const coordinates = validateCoordinates(listing);
      if (!coordinates) {
        console.debug(`❌ Coordonnées invalides pour listing ${id}:`, {
          lat: listing.lat,
          lng: listing.lng,
          name: listing.name,
        });
        errorCount++;
        return;
      }

      try {
        const marker = createMarker(listing, coordinates);
        if (!marker) {
          errorCount++;
          return;
        }

        // ✅ Vérification finale avant l'ajout
        if (isMapReady(mapInstance)) {
          marker.addTo(mapInstance);
          markersRef.current.set(id, { marker, listing });
          successCount++;

          console.debug(
            `✅ Marker créé pour listing ${id} (${listing.name}) à [${coordinates.lng}, ${coordinates.lat}]`
          );
        } else {
          console.warn(`Carte non prête lors de l'ajout du marker ${id}`);
          marker.remove(); // Nettoyage
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Erreur création marker ${id}:`, error);
        errorCount++;
      }
    });

    console.info(
      `🎯 Marqueurs mis à jour: ${successCount} succès, ${errorCount} erreurs`
    );
  }, [
    mapInstance,
    visibleListings,
    isMapReady,
    cleanupMarkers,
    validateCoordinates,
    createMarker,
  ]);

  /**
   * Écouter les événements de la carte pour recréer les marqueurs si nécessaire
   */
  useEffect(() => {
    if (!mapInstance) return;

    const handleStyleLoad = (): void => {
      console.debug("Style de carte chargé, recréation des marqueurs");
      // Recréer les marqueurs quand le style est chargé
      setTimeout(() => {
        if (visibleListings && visibleListings.length > 0) {
          cleanupMarkers();
          // L'effet principal se déclenchera automatiquement
        }
      }, 100);
    };

    const handleMapLoad = (): void => {
      console.debug("Carte complètement chargée");
      handleStyleLoad();
    };

    try {
      mapInstance.on("styledata", handleStyleLoad);
      mapInstance.on("load", handleMapLoad);
    } catch (error) {
      console.error("Erreur lors de l'ajout des listeners de carte:", error);
    }

    return () => {
      try {
        mapInstance.off("styledata", handleStyleLoad);
        mapInstance.off("load", handleMapLoad);
      } catch (error) {
        console.warn("Erreur lors de la suppression des listeners:", error);
      }
    };
  }, [mapInstance, visibleListings, cleanupMarkers]);

  /**
   * Nettoyage final lors du démontage du composant
   */
  useEffect(() => {
    return () => {
      console.debug("Nettoyage final des marqueurs");
      cleanupMarkers();
    };
  }, [cleanupMarkers]);

  // Ce composant ne rend rien (les marqueurs sont injectés dans la carte)
  return null;
}
