"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";

import { COLORS } from "@/lib/config";
import { useVisibleListings, useUnifiedStore } from "@/lib/store";
import type { Listing } from "@/lib/store";
import { logger } from "@/lib/logger";

/**
 * Interface pour les données de marqueur
 */
interface MarkerData {
  marker: mapboxgl.Marker;
  listing: Listing;
  element: HTMLDivElement;
  handlers: {
    mouseenter: () => void;
    mouseleave: () => void;
    click: () => void;
  };
}

/**
 * Composant MapboxMarkers
 *
 * Gestion complète et sécurisée des marqueurs sur la carte Mapbox :
 * - Mise à jour incrémentale (diff par ID) — pas de wipe total à chaque pan
 * - mapInstanceRef évite que createMarker soit une dépendance instable
 * - Validation robuste des coordonnées
 * - Sécurité XSS (DOM-only, pas de setHTML)
 * - Interactions utilisateur (hover, click)
 * - Popups avec informations ferme
 * - Cleanup mémoire complet
 */
export default function MapboxMarkers(): null {
  const mapInstance = useUnifiedStore((s) => s.map.instance);
  const visibleListings = useVisibleListings();
  const applyFiltersAndBounds = useUnifiedStore((s) => s.applyFiltersAndBounds);

  const markersRef = useRef<Map<string | number, MarkerData>>(new Map());
  const activePopupRef = useRef<mapboxgl.Popup | null>(null);

  // Stable ref to the current map instance — used inside createMarker so it
  // doesn't appear in the useCallback dep array (avoids recreating createMarker
  // and re-running the markers effect every time the map initialises).
  const mapInstanceRef = useRef<mapboxgl.Map | null>(mapInstance);
  // Tracks the previous mapInstance to detect a full map swap.
  const prevMapInstanceRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    mapInstanceRef.current = mapInstance;
  }, [mapInstance]);

  /**
   * Nettoie tous les marqueurs de la carte
   */
  const cleanupMarkers = useCallback((): void => {
    markersRef.current.forEach((markerData, id) => {
      try {
        const { marker, element, handlers } = markerData;
        element.removeEventListener("mouseenter", handlers.mouseenter);
        element.removeEventListener("mouseleave", handlers.mouseleave);
        element.removeEventListener("click", handlers.click);
        marker.remove();
      } catch (error) {
        console.warn(
          `Erreur lors de la suppression du marker ${String(id)}:`,
          error,
        );
      }
    });
    markersRef.current.clear();

    if (activePopupRef.current) {
      try {
        activePopupRef.current.remove();
        activePopupRef.current = null;
      } catch {
        activePopupRef.current = null;
      }
    }
  }, []);

  /**
   * Vérification robuste que la carte est prête à recevoir des marqueurs
   */
  const isMapReady = useCallback(
    (map: mapboxgl.Map | null): map is mapboxgl.Map => {
      if (!map) return false;
      try {
        const container = map.getContainer();
        if (!container?.isConnected) {
          logger.debug("Container de carte non connecté au DOM");
          return false;
        }
        if (typeof map.isStyleLoaded === "function" && !map.isStyleLoaded()) {
          logger.debug("Style de carte non chargé");
          return false;
        }
        if ((map as any)._removed) {
          logger.debug("Carte marquée comme supprimée");
          return false;
        }
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  /**
   * Valide les coordonnées d'un listing
   */
  const validateCoordinates = useCallback(
    (listing: Listing): { lat: number; lng: number } | null => {
      try {
        const lat =
          typeof listing.lat === "number" ? listing.lat : Number(listing.lat);
        const lng =
          typeof listing.lng === "number" ? listing.lng : Number(listing.lng);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        if (lat < -90 || lat > 90) return null;
        if (lng < -180 || lng > 180) return null;
        if (lat === 0 && lng === 0) return null;

        return { lat, lng };
      } catch {
        return null;
      }
    },
    [],
  );

  /**
   * Construit un DOM node safe pour la popup (pas de setHTML)
   */
  const buildPopupNode = useCallback((listing: Listing): HTMLElement => {
    const isUnclaimed = !listing.active && !listing.clerk_user_id;

    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      padding: 12px 16px;
      font-family: system-ui, -apple-system, sans-serif;
      background: ${COLORS.BG_WHITE};
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      min-width: 200px;
      max-width: 280px;
    `;

    if (isUnclaimed) {
      const badge = document.createElement("span");
      badge.style.cssText = `
        display: inline-block;
        margin-bottom: 6px;
        padding: 2px 8px;
        border-radius: 999px;
        background: #fef3c7;
        color: #92400e;
        font-size: 11px;
        font-weight: 600;
      `;
      badge.textContent = "Ferme pré-enregistrée";
      wrapper.appendChild(badge);
    }

    const title = document.createElement("p");
    title.style.cssText = `
      margin: 0 0 8px 0;
      font-weight: 600;
      font-size: 15px;
      color: ${COLORS.TEXT_PRIMARY};
      line-height: 1.4;
    `;
    title.textContent = listing.name || `Ferme #${String(listing.id)}`;
    wrapper.appendChild(title);

    if (listing.address) {
      const addr = document.createElement("p");
      addr.style.cssText = `
        margin: 0 0 4px 0;
        font-size: 13px;
        color: ${COLORS.TEXT_SECONDARY};
        line-height: 1.4;
      `;
      addr.textContent = listing.address;
      wrapper.appendChild(addr);
    }

    if (listing.distance !== undefined && listing.distance !== null) {
      const distance = document.createElement("p");
      distance.style.cssText = `
        margin: 0;
        font-size: 12px;
        color: ${COLORS.TEXT_MUTED};
        font-weight: 500;
      `;
      const distanceKm =
        typeof listing.distance === "number"
          ? listing.distance.toFixed(1)
          : String(listing.distance);
      distance.textContent = `📍 ${distanceKm} km`;
      wrapper.appendChild(distance);
    }

    if (isUnclaimed) {
      const claimLink = document.createElement("a");
      claimLink.href = `/farm/${String(listing.id)}/claim`;
      claimLink.style.cssText = `
        display: block;
        margin-top: 10px;
        padding: 6px 12px;
        background: #d97706;
        color: #ffffff;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
        text-decoration: none;
      `;
      claimLink.textContent = "Propriétaire ? Revendiquer →";
      wrapper.appendChild(claimLink);
    }

    return wrapper;
  }, []);

  /**
   * Crée un marqueur personnalisé pour un listing.
   * Utilise mapInstanceRef (pas mapInstance) pour rester stable entre les
   * re-renders déclenchés par l'initialisation de la carte.
   */
  const createMarker = useCallback(
    (
      listing: Listing,
      coordinates: { lat: number; lng: number },
    ): {
      marker: mapboxgl.Marker;
      element: HTMLDivElement;
      handlers: any;
    } | null => {
      try {
        const isUnclaimed = !listing.active && !listing.clerk_user_id;
        const baseColor = isUnclaimed ? "#d97706" : COLORS.PRIMARY;
        const hoverColor = isUnclaimed ? "#b45309" : COLORS.PRIMARY_DARK;

        const markerElement = document.createElement("div");
        markerElement.className = isUnclaimed
          ? "custom-marker custom-marker--unclaimed"
          : "custom-marker";
        markerElement.setAttribute("role", "button");
        markerElement.setAttribute(
          "aria-label",
          `Ferme ${listing.name || listing.id}`,
        );
        markerElement.setAttribute("tabindex", "0");
        markerElement.style.cssText = `
          width: 28px;
          height: 28px;
          background-color: ${baseColor};
          border: 3px solid ${COLORS.BG_WHITE};
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          opacity: ${isUnclaimed ? "0.85" : "1"};
        `;
        markerElement.dataset.baseColor = baseColor;

        const handleMouseEnter = () => {
          markerElement.style.transform = "scale(1.25)";
          markerElement.style.backgroundColor = hoverColor;
          markerElement.style.boxShadow = "0 4px 10px rgba(0,0,0,0.35)";
          markerElement.style.zIndex = "1000";
        };

        const handleMouseLeave = () => {
          markerElement.style.transform = "scale(1)";
          markerElement.style.backgroundColor = baseColor;
          markerElement.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
          markerElement.style.zIndex = "1";
        };

        const handleClick = () => {
          window.dispatchEvent(
            new CustomEvent("listingSelected", {
              detail: { id: listing.id, fromMap: true },
            }),
          );

          if (activePopupRef.current) {
            activePopupRef.current.remove();
            activePopupRef.current = null;
          }

          // Read from ref — not from the captured closure — so we always use
          // the current map instance without mapInstance in the dep array.
          const map = mapInstanceRef.current;
          if (!map) return;

          const popup = new mapboxgl.Popup({
            offset: 30,
            closeButton: true,
            closeOnClick: false,
            className: "listing-popup",
            maxWidth: "300px",
          }).setDOMContent(buildPopupNode(listing));

          popup.setLngLat([coordinates.lng, coordinates.lat]).addTo(map);

          popup.on("close", () => {
            if (activePopupRef.current === popup) {
              activePopupRef.current = null;
            }
          });

          activePopupRef.current = popup;
        };

        markerElement.addEventListener("mouseenter", handleMouseEnter);
        markerElement.addEventListener("mouseleave", handleMouseLeave);
        markerElement.addEventListener("click", handleClick);

        const marker = new mapboxgl.Marker({
          element: markerElement,
          anchor: "center",
        }).setLngLat([coordinates.lng, coordinates.lat]);

        return {
          marker,
          element: markerElement,
          handlers: {
            mouseenter: handleMouseEnter,
            mouseleave: handleMouseLeave,
            click: handleClick,
          },
        };
      } catch (error) {
        console.error(
          `Erreur lors de la création du marker pour listing ${String(listing.id)}:`,
          error,
        );
        return null;
      }
    },
    // mapInstance intentionally omitted — accessed via mapInstanceRef.current
    [buildPopupNode],
  );

  /**
   * Mise à jour incrémentale des marqueurs (diff par ID).
   *
   * - Si mapInstance a changé (nouveau map) → wipe complet puis recréation.
   * - Sinon → supprime les marqueurs dont l'ID a disparu de visibleListings,
   *   ajoute ceux qui sont nouveaux, ignore les existants.
   *
   * Évite les centaines de mutations DOM à chaque déplacement de carte.
   */
  useEffect(() => {
    if (!isMapReady(mapInstance)) {
      cleanupMarkers();
      return;
    }

    if (!Array.isArray(visibleListings)) return;

    // Full wipe when the map instance is replaced (e.g. map reinit).
    // Old markers belong to the previous map and cannot be reused.
    if (prevMapInstanceRef.current !== mapInstance) {
      cleanupMarkers();
      prevMapInstanceRef.current = mapInstance;
    }

    const incomingIds = new Set(
      visibleListings.map((l) => l?.id).filter(Boolean),
    );

    // — Remove stale markers (no longer in visibleListings) —
    for (const [id, markerData] of markersRef.current) {
      if (!incomingIds.has(id)) {
        const { marker, element, handlers } = markerData;
        element.removeEventListener("mouseenter", handlers.mouseenter);
        element.removeEventListener("mouseleave", handlers.mouseleave);
        element.removeEventListener("click", handlers.click);
        try {
          marker.remove();
        } catch {}
        markersRef.current.delete(id);
      }
    }

    // — Add new markers (not yet in markersRef) —
    for (const listing of visibleListings) {
      const id = listing?.id;
      if (!id || markersRef.current.has(id)) continue;

      const coordinates = validateCoordinates(listing);
      if (!coordinates) {
        logger.debug(`Coordonnées invalides pour listing ${String(id)}`);
        continue;
      }

      const markerData = createMarker(listing, coordinates);
      if (!markerData) continue;

      try {
        markerData.marker.addTo(mapInstance);
        markersRef.current.set(id, {
          marker: markerData.marker,
          listing,
          element: markerData.element,
          handlers: markerData.handlers,
        });
      } catch (error) {
        console.error(`Erreur ajout marker ${String(id)}:`, error);
        try {
          markerData.marker.remove();
        } catch {}
      }
    }

    logger.debug(
      `MapboxMarkers: ${markersRef.current.size} marqueurs actifs / ${visibleListings.length} visibles`,
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
   * Après un rechargement de style Mapbox, wipe les marqueurs et force un
   * recalcul de visibleListings via applyFiltersAndBounds() pour que l'effet
   * principal les recrée sur le nouveau style.
   */
  useEffect(() => {
    if (!mapInstance) return;

    const handleStyleLoad = (): void => {
      setTimeout(() => {
        cleanupMarkers();
        // Reset prevMapInstanceRef so the next run of the markers effect
        // treats this as a fresh map and recreates all markers.
        prevMapInstanceRef.current = null;
        // Produces a new visibleListings array reference → triggers the
        // markers effect to re-add all markers on the new style.
        applyFiltersAndBounds();
      }, 100);
    };

    try {
      mapInstance.on("styledata", handleStyleLoad);
    } catch (error) {
      console.error("Erreur ajout listener styledata:", error);
    }

    return () => {
      try {
        mapInstance.off("styledata", handleStyleLoad);
      } catch {}
    };
  }, [mapInstance, cleanupMarkers, applyFiltersAndBounds]);

  /**
   * Écouter les événements externes (hover from list)
   */
  useEffect(() => {
    const handleListingHovered = (event: Event) => {
      const e = event as CustomEvent<{ id: number | null }>;
      const hoveredId = e.detail?.id;

      markersRef.current.forEach((markerData, id) => {
        const { element } = markerData;
        const baseColor = element.dataset.baseColor ?? COLORS.PRIMARY;

        if (hoveredId === null) {
          element.style.transform = "scale(1)";
          element.style.backgroundColor = baseColor;
          element.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
          element.style.opacity = "1";
          element.style.zIndex = "1";
        } else if (id === hoveredId) {
          element.style.transform = "scale(1.25)";
          element.style.backgroundColor = COLORS.PRIMARY_DARK;
          element.style.boxShadow = "0 4px 10px rgba(0,0,0,0.35)";
          element.style.opacity = "1";
          element.style.zIndex = "1000";
        } else {
          element.style.transform = "scale(1)";
          element.style.backgroundColor = baseColor;
          element.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
          element.style.opacity = "0.5";
          element.style.zIndex = "1";
        }
      });
    };

    window.addEventListener("listingHovered", handleListingHovered);
    return () => {
      window.removeEventListener("listingHovered", handleListingHovered);
    };
  }, []);

  /**
   * Nettoyage final lors du démontage du composant
   */
  useEffect(() => {
    return () => {
      cleanupMarkers();
    };
  }, [cleanupMarkers]);

  return null;
}
