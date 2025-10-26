"use client";

import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import {
  useMapboxState,
  useListingsState,
  useInteractionsState,
  useInteractionsActions,
} from "@/lib/store/mapboxListingsStore";
import MarkerListingItem from "../../listings/components/MarkerListingItem";

/**
 * Composant qui gère l'affichage des markers et popups sur la carte Mapbox
 * pour tous les listings visibles
 */
export default function MapboxMarkers() {
  const { mapInstance } = useMapboxState();
  const { visible: visibleListings } = useListingsState();
  const { openInfoWindowId, hoveredListingId } = useInteractionsState();
  const { setOpenInfoWindowId, setHoveredListingId } = useInteractionsActions();

  // Refs pour stocker les markers et popups
  const markersRef = useRef(new Map()); // Map<listingId, { marker, popup, root }>

  // Nettoyage de tous les markers
  const cleanupMarkers = () => {
    markersRef.current.forEach(({ marker, root }) => {
      try {
        if (root) root.unmount();
        if (marker) marker.remove();
      } catch (e) {
        console.warn("Erreur lors du nettoyage d'un marker:", e);
      }
    });
    markersRef.current.clear();
  };

  // Mise à jour des markers quand les listings changent
  useEffect(() => {
    if (!mapInstance || !Array.isArray(visibleListings)) return;

    // Liste des IDs actuels
    const currentIds = new Set(visibleListings.map((l) => l.id));
    const existingIds = new Set(markersRef.current.keys());

    // 1. Supprimer les markers qui ne sont plus visibles
    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        const { marker, root } = markersRef.current.get(id) || {};
        try {
          if (root) root.unmount();
          if (marker) marker.remove();
        } catch (e) {
          console.warn("Erreur lors de la suppression d'un marker:", e);
        }
        markersRef.current.delete(id);
      }
    });

    // 2. Ajouter ou mettre à jour les markers pour les nouveaux listings
    visibleListings.forEach((listing) => {
      if (!listing.lat || !listing.lng) return;

      const { id, lat, lng } = listing;

      // Si le marker existe déjà, on le garde (évite les re-renders inutiles)
      if (markersRef.current.has(id)) return;

      try {
        // Créer l'élément du marker personnalisé
        const markerEl = document.createElement("div");
        markerEl.className = "custom-farm-marker";
        markerEl.innerHTML = `
          <div style="
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            <svg
              style="transform: rotate(45deg); width: 18px; height: 18px;"
              fill="white"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a6 6 0 00-6 6c0 4.314 6 10 6 10s6-5.686 6-10a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z"/>
            </svg>
          </div>
        `;

        // Effet de hover sur le marker
        markerEl.addEventListener("mouseenter", () => {
          markerEl.firstElementChild.style.transform = "rotate(-45deg) scale(1.15)";
          markerEl.firstElementChild.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.35)";
          setHoveredListingId(id);
        });
        markerEl.addEventListener("mouseleave", () => {
          markerEl.firstElementChild.style.transform = "rotate(-45deg) scale(1)";
          markerEl.firstElementChild.style.boxShadow = "0 3px 8px rgba(0, 0, 0, 0.25)";
          setHoveredListingId(null);
        });

        // Créer le conteneur pour le popup React
        const popupContainer = document.createElement("div");
        const root = createRoot(popupContainer);

        // Rendre le composant MarkerListingItem dans le popup
        root.render(<MarkerListingItem item={listing} />);

        // Créer le popup Mapbox
        const popup = new mapboxgl.Popup({
          offset: 35,
          closeButton: true,
          closeOnClick: false,
          maxWidth: "300px",
          className: "farm-marker-popup",
        }).setDOMContent(popupContainer);

        // Gérer la fermeture du popup
        popup.on("close", () => {
          setOpenInfoWindowId(null);
        });

        // Créer et configurer le marker
        const marker = new mapboxgl.Marker({
          element: markerEl,
          anchor: "bottom",
        })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(mapInstance);

        // Gérer le click sur le marker
        markerEl.addEventListener("click", () => {
          setOpenInfoWindowId(id);
        });

        // Stocker le marker, popup, root et element pour nettoyage ultérieur
        markersRef.current.set(id, { marker, popup, root, element: markerEl });
      } catch (error) {
        console.error(`Erreur lors de la création du marker pour listing ${id}:`, error);
      }
    });
  }, [mapInstance, visibleListings, setOpenInfoWindowId]);

  // Gérer l'ouverture/fermeture des popups via le store
  useEffect(() => {
    if (!mapInstance) return;

    markersRef.current.forEach(({ marker, popup }, listingId) => {
      if (listingId === openInfoWindowId) {
        // Ouvrir ce popup
        if (!popup.isOpen()) {
          popup.addTo(mapInstance);
        }
      } else {
        // Fermer les autres popups
        if (popup.isOpen()) {
          popup.remove();
        }
      }
    });
  }, [mapInstance, openInfoWindowId]);

  // Gérer l'effet visuel de hover depuis la liste vers les markers
  useEffect(() => {
    markersRef.current.forEach(({ element }, listingId) => {
      if (!element?.firstElementChild) return;

      if (listingId === hoveredListingId) {
        // Appliquer l'effet hover
        element.firstElementChild.style.transform = "rotate(-45deg) scale(1.15)";
        element.firstElementChild.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.35)";
        element.firstElementChild.style.zIndex = "1000";
      } else {
        // Retirer l'effet hover
        element.firstElementChild.style.transform = "rotate(-45deg) scale(1)";
        element.firstElementChild.style.boxShadow = "0 3px 8px rgba(0, 0, 0, 0.25)";
        element.firstElementChild.style.zIndex = "auto";
      }
    });
  }, [hoveredListingId]);

  // Nettoyage lors du démontage
  useEffect(() => {
    return () => {
      cleanupMarkers();
    };
  }, []);

  // Ce composant ne rend rien (il manipule directement la carte)
  return null;
}
