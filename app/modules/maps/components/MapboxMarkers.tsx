"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";

import { COLORS } from "@/lib/config";
import { useListingsState, useMapState } from "@/lib/store";
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
 * - Création/suppression automatique basée sur visibleListings
 * - Validation robuste des coordonnées
 * - Sécurité XSS (DOM-only, pas de setHTML)
 * - Interactions utilisateur (hover, click)
 * - Popups avec informations ferme
 * - Cleanup mémoire complet
 */
export default function MapboxMarkers(): null {
  const { mapInstance } = useMapState();
  const { visible: visibleListings } = useListingsState();

  const markersRef = useRef<Map<string | number, MarkerData>>(new Map());
  const activePopupRef = useRef<mapboxgl.Popup | null>(null);

  /**
   * Nettoie tous les marqueurs de la carte
   */
  const cleanupMarkers = useCallback((): void => {
    markersRef.current.forEach((markerData, id) => {
      try {
        const { marker, element, handlers } = markerData;

        // Cleanup event listeners
        element.removeEventListener("mouseenter", handlers.mouseenter);
        element.removeEventListener("mouseleave", handlers.mouseleave);
        element.removeEventListener("click", handlers.click);

        // Remove marker
        marker.remove();
      } catch (error) {
        console.warn(
          `Erreur lors de la suppression du marker ${String(id)}:`,
          error,
        );
      }
    });

    markersRef.current.clear();

    // Cleanup active popup
    if (activePopupRef.current) {
      try {
        activePopupRef.current.remove();
        activePopupRef.current = null;
      } catch (error) {
        console.warn("Erreur suppression popup active:", error);
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
        if (!container) {
          logger.debug("Carte sans container DOM");
          return false;
        }

        if (!container.isConnected) {
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
      } catch (error) {
        console.warn(
          "Erreur lors de la vérification de l'état de la carte:",
          error,
        );
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

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          logger.debug(
            `Coordonnées invalides pour listing ${String(listing.id)}: lat=${String(
              listing.lat,
            )}, lng=${String(listing.lng)}`,
          );
          return null;
        }

        if (lat < -90 || lat > 90) {
          console.warn(
            `Latitude hors limites pour listing ${String(listing.id)}: ${lat}`,
          );
          return null;
        }

        if (lng < -180 || lng > 180) {
          console.warn(
            `Longitude hors limites pour listing ${String(listing.id)}: ${lng}`,
          );
          return null;
        }

        if (lat === 0 && lng === 0) {
          logger.debug(
            `Coordonnées (0,0) rejetées pour listing ${String(listing.id)}`,
          );
          return null;
        }

        return { lat, lng };
      } catch (error) {
        console.error(
          `Erreur lors de la validation des coordonnées pour listing ${String(listing.id)}:`,
          error,
        );
        return null;
      }
    },
    [],
  );

  /**
   * Construit un DOM node safe pour la popup (pas de setHTML)
   */
  const buildPopupNode = useCallback((listing: Listing): HTMLElement => {
    const isOsmUnclaimed = !!listing.osm_id && !listing.clerk_user_id;

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

    // Badge OSM non revendiqué
    if (isOsmUnclaimed) {
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

    // Titre (nom de la ferme)
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

    // Adresse (optionnelle)
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

    // Distance (optionnelle)
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

    // Lien de revendication pour les fermes OSM non réclamées
    if (isOsmUnclaimed) {
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
   * Crée un marqueur personnalisé pour un listing
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
        // Ferme OSM non revendiquée → marqueur gris/ambre distinct
        const isOsmUnclaimed = !!listing.osm_id && !listing.clerk_user_id;
        const baseColor = isOsmUnclaimed ? "#d97706" : COLORS.PRIMARY;
        const hoverColor = isOsmUnclaimed ? "#b45309" : COLORS.PRIMARY_DARK;

        // Créer l'élément DOM du marqueur
        const markerElement = document.createElement("div");
        markerElement.className = isOsmUnclaimed
          ? "custom-marker custom-marker--osm"
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
          opacity: ${isOsmUnclaimed ? "0.85" : "1"};
        `;
        // Stocker la couleur de base pour pouvoir la restaurer depuis des handlers externes
        markerElement.dataset.baseColor = baseColor;

        // Handlers d'interaction
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
          // Dispatch custom event pour communication inter-composants
          window.dispatchEvent(
            new CustomEvent("listingSelected", {
              detail: { id: listing.id, fromMap: true },
            }),
          );

          // Fermer popup active si existe
          if (activePopupRef.current) {
            activePopupRef.current.remove();
            activePopupRef.current = null;
          }

          // Ouvrir nouvelle popup
          const map = mapInstance;
          if (!map) return;

          const popup = new mapboxgl.Popup({
            offset: 30,
            closeButton: true,
            closeOnClick: false,
            className: "listing-popup",
            maxWidth: "300px",
          }).setDOMContent(buildPopupNode(listing));

          popup.setLngLat([coordinates.lng, coordinates.lat]).addTo(map);

          // Cleanup quand popup fermée
          popup.on("close", () => {
            if (activePopupRef.current === popup) {
              activePopupRef.current = null;
            }
          });

          activePopupRef.current = popup;
        };

        // Attacher les événements
        markerElement.addEventListener("mouseenter", handleMouseEnter);
        markerElement.addEventListener("mouseleave", handleMouseLeave);
        markerElement.addEventListener("click", handleClick);

        // Créer le marqueur Mapbox
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
    [mapInstance, buildPopupNode],
  );

  /**
   * Création/mise à jour des marqueurs
   */
  useEffect(() => {
    if (!isMapReady(mapInstance)) {
      logger.debug("Carte non prête, skip création marqueurs");
      return;
    }

    if (!Array.isArray(visibleListings)) {
      logger.debug("Pas de listings visibles ou format invalide");
      return;
    }

    logger.debug(
      `🎯 Mise à jour des marqueurs: ${visibleListings.length} listings`,
    );

    if (visibleListings.length > 0) {
      const firstListing = visibleListings[0];
      logger.debug("📋 Structure du premier listing:", {
        id: firstListing.id,
        name: firstListing.name,
        lat: firstListing.lat,
        lng: firstListing.lng,
        type_lat: typeof firstListing.lat,
        type_lng: typeof firstListing.lng,
      });
    }

    // Cleanup anciens marqueurs
    cleanupMarkers();

    let successCount = 0;
    let errorCount = 0;

    for (const listing of visibleListings) {
      const id = listing?.id;

      if (!id) {
        logger.debug("Listing sans ID, ignoré");
        errorCount++;
        continue;
      }

      const coordinates = validateCoordinates(listing);
      if (!coordinates) {
        logger.debug(`❌ Coordonnées invalides pour listing ${String(id)}:`, {
          lat: listing.lat,
          lng: listing.lng,
          name: listing.name,
        });
        errorCount++;
        continue;
      }

      try {
        const markerData = createMarker(listing, coordinates);
        if (!markerData) {
          errorCount++;
          continue;
        }

        if (isMapReady(mapInstance)) {
          markerData.marker.addTo(mapInstance);
          markersRef.current.set(id, {
            marker: markerData.marker,
            listing,
            element: markerData.element,
            handlers: markerData.handlers,
          });
          successCount++;
        } else {
          console.warn(
            `Carte non prête lors de l'ajout du marker ${String(id)}`,
          );
          markerData.marker.remove();
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Erreur création marker ${String(id)}:`, error);
        errorCount++;
      }
    }

    // Bilan de l'update
    logger.debug("MapboxMarkers: bilan update", {
      successCount,
      errorCount,
      total: visibleListings.length,
      ratio: `${((successCount / visibleListings.length) * 100).toFixed(1)}%`,
    });
  }, [
    mapInstance,
    visibleListings,
    isMapReady,
    cleanupMarkers,
    validateCoordinates,
    createMarker,
  ]);

  /**
   * Écouter les événements de la carte pour cleanup si le style reload
   */
  useEffect(() => {
    if (!mapInstance) return;

    const handleStyleLoad = (): void => {
      logger.debug("Style de carte chargé/changé, cleanup markers");
      // Delay pour laisser le style se stabiliser
      setTimeout(() => cleanupMarkers(), 100);
    };

    try {
      mapInstance.on("styledata", handleStyleLoad);
      mapInstance.on("load", handleStyleLoad);
    } catch (error) {
      console.error("Erreur lors de l'ajout des listeners de carte:", error);
    }

    return () => {
      try {
        mapInstance.off("styledata", handleStyleLoad);
        mapInstance.off("load", handleStyleLoad);
      } catch (error) {
        console.warn("Erreur lors de la suppression des listeners:", error);
      }
    };
  }, [mapInstance, cleanupMarkers]);

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
          // Reset all
          element.style.transform = "scale(1)";
          element.style.backgroundColor = baseColor;
          element.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
          element.style.opacity = "1";
          element.style.zIndex = "1";
        } else if (id === hoveredId) {
          // Highlight hovered
          element.style.transform = "scale(1.25)";
          element.style.backgroundColor = COLORS.PRIMARY_DARK;
          element.style.boxShadow = "0 4px 10px rgba(0,0,0,0.35)";
          element.style.opacity = "1";
          element.style.zIndex = "1000";
        } else {
          // Dim others
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
      logger.debug("🧹 Nettoyage final des marqueurs");
      cleanupMarkers();
    };
  }, [cleanupMarkers]);

  return null;
}
