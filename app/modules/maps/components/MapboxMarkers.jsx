"use client";

import React, { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import mapboxgl from "mapbox-gl";
import {
  useMapState, // ✅ Import corrigé
  useListingsState,
  useInteractionsState,
  useInteractionsActions,
} from "@/lib/store/mapListingsStore";
import MarkerListingItem from "../../listings/components/MarkerListingItem";

/**
 * Gère les markers + popups React sur la carte Mapbox
 */
export default function MapboxMarkers() {
  const { mapInstance } = useMapState(); // ✅ Hook corrigé
  const { visible: visibleListings } = useListingsState();
  const { openInfoWindowId, hoveredListingId } = useInteractionsState();
  const { setOpenInfoWindowId, setHoveredListingId } = useInteractionsActions();

  // Map<listingId, { marker, popup, root, element, popupContainer, listing }>
  const markersRef = useRef(new Map());

  /** Nettoyage de tous les marqueurs et popups */
  const cleanupMarkers = () => {
    markersRef.current.forEach(({ marker, root, popup }) => {
      try {
        if (popup) popup.remove();
        if (root) root.unmount();
        if (marker) marker.remove();
      } catch (e) {
        console.warn("Cleanup marker error:", e);
      }
    });
    markersRef.current.clear();
  };

  /** Crée (ou recrée) le contenu React d'un popup pour un listing donné */
  const mountPopupContent = (listingId) => {
    const entry = markersRef.current.get(listingId);
    if (!entry) return;

    // (Re)crée un container vierge si nécessaire
    if (!entry.popupContainer || !entry.popupContainer.isConnected) {
      entry.popupContainer = document.createElement("div");
    }

    // (Re)monte le contenu React
    if (entry.root) {
      try {
        entry.root.unmount();
      } catch {}
    }
    entry.root = createRoot(entry.popupContainer);
    entry.root.render(<MarkerListingItem item={entry.listing} />);
    entry.popup.setDOMContent(entry.popupContainer);
  };

  /** Ouvre le popup d'un marker et centre/zoome la carte dessus */
  const openPopupFor = (listingId, { animate = true } = {}) => {
    const entry = markersRef.current.get(listingId);
    if (!entry || !mapInstance) return;

    // Monte (ou remonte) le contenu du popup avant l'ouverture
    mountPopupContent(listingId);

    // Ouvrir le popup (attaché au marker via setPopup)
    if (!entry.popup.isOpen()) {
      // addTo n'est pas nécessaire si le popup est attaché au marker,
      // on utilise le mécanisme natif de Mapbox:
      entry.marker.togglePopup(); // ouvre si fermé
    }

    // Centre + zoom doux sur le marker
    const { listing } = entry;
    if (listing?.lng != null && listing?.lat != null) {
      const target = [listing.lng, listing.lat];
      const curZoom = mapInstance.getZoom();
      const nextZoom = curZoom < 13 ? 13.5 : curZoom;

      if (animate) {
        mapInstance.easeTo({
          center: target,
          zoom: nextZoom,
          duration: 700,
          essential: true,
        });
      } else {
        mapInstance.jumpTo({ center: target, zoom: nextZoom });
      }
    }
  };

  /** Ferme tous les popups sauf celui d'un éventuel ID à garder ouvert */
  const closeAllPopupsExcept = (keepId = null) => {
    markersRef.current.forEach(({ marker, popup }, id) => {
      if (id !== keepId && popup?.isOpen()) {
        // togglePopup ferme si déjà ouvert
        try {
          marker.togglePopup();
        } catch {
          popup.remove();
        }
      }
    });
  };

  // (1) Création / mise à jour des markers quand les listings visibles évoluent
  useEffect(() => {
    if (!mapInstance || !Array.isArray(visibleListings)) return;

    // Supprime les markers qui ne sont plus visibles
    const currentIds = new Set(visibleListings.map((l) => l.id));
    for (const [id, entry] of markersRef.current.entries()) {
      if (!currentIds.has(id)) {
        try {
          entry.popup?.remove();
          entry.root?.unmount();
          entry.marker?.remove();
        } catch (e) {
          console.warn("Remove marker error:", e);
        }
        markersRef.current.delete(id);
      }
    }

    // Ajoute les nouveaux markers
    visibleListings.forEach((listing) => {
      if (!listing?.lat || !listing?.lng || !listing?.id) return;

      const id = listing.id;
      if (markersRef.current.has(id)) {
        // Met à jour la data (utile si listing a changé)
        const existing = markersRef.current.get(id);
        existing.listing = listing;
        return;
      }

      try {
        // Élément du marker (pin custom)
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
            <svg style="transform: rotate(45deg); width: 18px; height: 18px;" fill="white" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6c0 4.314 6 10 6 10s6-5.686 6-10a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z"/>
            </svg>
          </div>
        `;

        // Hover (carte -> store)
        markerEl.addEventListener("mouseenter", () => {
          const pin = markerEl.firstElementChild;
          if (pin) {
            pin.style.transform = "rotate(-45deg) scale(1.15)";
            pin.style.boxShadow = "0 4px 12px rgba(0,0,0,0.35)";
          }
          setHoveredListingId(id);
        });
        markerEl.addEventListener("mouseleave", () => {
          const pin = markerEl.firstElementChild;
          if (pin) {
            pin.style.transform = "rotate(-45deg) scale(1)";
            pin.style.boxShadow = "0 3px 8px rgba(0,0,0,0.25)";
          }
          setHoveredListingId(null);
        });

        // Popup attaché au marker
        const popup = new mapboxgl.Popup({
          offset: 35,
          closeButton: true,
          closeOnClick: false,
          maxWidth: "300px",
          className: "farm-marker-popup",
        });

        // Marker + popup
        const marker = new mapboxgl.Marker({
          element: markerEl,
          anchor: "bottom",
        })
          .setLngLat([listing.lng, listing.lat])
          .setPopup(popup)
          .addTo(mapInstance);

        // Ouvrir le popup via clic sur le pin
        markerEl.addEventListener("click", (e) => {
          e.stopPropagation();
          // Met à jour le store (déclenchera l'effet d'ouverture/fermeture)
          setOpenInfoWindowId(id);
        });

        // Crée l'entrée dans notre registry
        markersRef.current.set(id, {
          marker,
          popup,
          root: null,
          element: markerEl,
          popupContainer: null,
          listing,
        });

        // Nettoyage React quand le popup se ferme manuellement
        popup.on("close", () => {
          const entry = markersRef.current.get(id);
          if (!entry) return;
          try {
            entry.root?.unmount();
          } catch {}
          entry.root = null;
          // On remet à jour le store si c'était le popup ouvert
          if (openInfoWindowId === id) setOpenInfoWindowId(null);
        });
      } catch (err) {
        console.error(`Erreur création marker ${id}:`, err);
      }
    });

    return () => {
      // pas de cleanup global ici (on garde les markers tant que la carte vit)
    };
  }, [
    mapInstance,
    visibleListings,
    setOpenInfoWindowId,
    setHoveredListingId,
    openInfoWindowId,
  ]);

  // (2) Ouvrir/fermer les popups selon le store + centrer la carte
  useEffect(() => {
    if (!mapInstance) return;

    if (!openInfoWindowId) {
      // Ferme tout si aucun sélectionné
      closeAllPopupsExcept(null);
      return;
    }

    // Ferme les autres, ouvre celui demandé + centre
    closeAllPopupsExcept(openInfoWindowId);
    openPopupFor(openInfoWindowId, { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openInfoWindowId, mapInstance]);

  // (3) Effet de hover depuis la liste → marker
  useEffect(() => {
    markersRef.current.forEach(({ element }, id) => {
      const pin = element?.firstElementChild;
      if (!pin) return;
      if (id === hoveredListingId) {
        pin.style.transform = "rotate(-45deg) scale(1.15)";
        pin.style.boxShadow = "0 4px 12px rgba(0,0,0,0.35)";
        pin.style.zIndex = "1000";
      } else {
        pin.style.transform = "rotate(-45deg) scale(1)";
        pin.style.boxShadow = "0 3px 8px rgba(0,0,0,0.25)";
        pin.style.zIndex = "auto";
      }
    });
  }, [hoveredListingId]);

  // (4) Nettoyage intégral au démontage
  useEffect(() => cleanupMarkers, []);

  return null;
}
