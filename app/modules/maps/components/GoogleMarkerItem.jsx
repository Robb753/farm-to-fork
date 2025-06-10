"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useListingState } from "@/app/contexts/MapDataContext/ListingStateContext";
import { useFilterState } from "@/app/contexts/MapDataContext/FilterStateContext";

const GoogleMarkerItem = ({ map, item }) => {
  const markerRef = useRef(null);
  const markerElementRef = useRef(null);
  const infoWindowRef = useRef(null);
  const mountedRef = useRef(false);
  const markerLibraryPromise = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const {
    hoveredListingId,
    setHoveredListingId,
    selectedListingId,
    setSelectedListingId,
    openInfoWindowId,
    setOpenInfoWindowId,
    filteredListings,
  } = useListingState();

  // Récupérer les filtres du contexte
  const { filters } = useFilterState();

  const loadMarkerLibrary = useCallback(async () => {
    if (!window.google?.maps) return null;
    if (!markerLibraryPromise.current) {
      markerLibraryPromise.current = window.google.maps.importLibrary("marker");
    }
    return markerLibraryPromise.current;
  }, []);

  const createPinSVG = useCallback((isOpen) => {
    const fillColor = isOpen ? "#22c55e" : "#ef4444";
    return `
      <div class="pin-marker">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 384 512">
          <path 
            fill="${fillColor}" 
            d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"
          />
        </svg>
      </div>
    `;
  }, []);

  // Fonction pour vérifier si le marqueur doit être affiché selon les filtres actifs
  const shouldShowMarker = useCallback(() => {
    // S'il n'y a pas de filtres actifs, afficher le marqueur
    const hasActiveFilters = Object.values(filters).some(
      (arr) => arr && arr.length > 0
    );
    if (!hasActiveFilters) return true;

    // Vérifier chaque filtre actif
    return Object.entries(filters).every(([key, values]) => {
      // Si ce filtre n'est pas actif, passer au suivant
      if (!values || values.length === 0) return true;

      // Récupérer les valeurs du listing pour ce type de filtre
      let listingValues = [];
      if (item[key]) {
        // S'assurer que c'est un tableau
        listingValues = Array.isArray(item[key]) ? item[key] : [item[key]];
      }

      // Si le listing n'a pas cette propriété, le filtrer
      if (listingValues.length === 0) return false;

      // Vérifier si au moins une valeur du filtre correspond
      return values.some((value) => listingValues.includes(value));
    });
  }, [filters, item]);

  const createNativeInfoWindow = useCallback(() => {
    if (!map || !window.google?.maps) return null;

    const content = `
      <div class="p-3 w-full" style="max-width: 200px;">
        <h3 class="font-medium text-sm mb-1">${item.name || "Ferme"}</h3>
        <p class="text-xs text-gray-600 mb-2">${
          item.address || "Adresse non disponible"
        }</p>
        <div class="mt-1">
          <span style="
            padding: 2px 10px; 
            border-radius: 9999px; 
            font-size: 0.75rem; 
            font-weight: 500;
            background-color: ${
              item.availability === "open" ? "#dcfce7" : "#fee2e2"
            }; 
            color: ${item.availability === "open" ? "#166534" : "#991b1b"};
          ">
            ${item.availability === "open" ? "Ouvert" : "Fermé"}
          </span>
        </div>
      </div>
    `;

    return new google.maps.InfoWindow({
      content,
      disableAutoPan: true,
      pixelOffset: new google.maps.Size(0, -40),
      maxWidth: 200,
    });
  }, [item, map]);

  useEffect(() => {
    if (!map || !item?.lat || !item?.lng || mountedRef.current) return;

    mountedRef.current = true;

    const setupMarker = async () => {
      try {
        const { AdvancedMarkerElement } = await loadMarkerLibrary();
        if (!AdvancedMarkerElement) return;

        const el = document.createElement("div");
        el.className = "marker-wrapper";
        el.innerHTML = createPinSVG(item.availability === "open");
        markerElementRef.current = el;

        const marker = new AdvancedMarkerElement({
          map: shouldShowMarker() ? map : null, // N'afficher le marqueur que s'il passe les filtres
          position: { lat: parseFloat(item.lat), lng: parseFloat(item.lng) },
          content: el,
          title: item.name || "Ferme",
          zIndex: selectedListingId === item.id ? 1000 : 1,
        });

        markerRef.current = marker;
        infoWindowRef.current = createNativeInfoWindow();

        marker.addListener("gmp-click", () => {
          const alreadyOpen = openInfoWindowId === item.id;
          infoWindowRef.current?.close();
          setSelectedListingId(alreadyOpen ? null : item.id);
          setOpenInfoWindowId(alreadyOpen ? null : item.id);
          animateMarkerSelect(el);

          requestAnimationFrame(() => {
            const listEl = document.getElementById(`listing-${item.id}`);
            if (listEl) {
              listEl.scrollIntoView({ behavior: "smooth", block: "center" });
              listEl.classList.add("selected-listing");
              setTimeout(
                () => listEl.classList.remove("selected-listing"),
                1500
              );
            }
          });
        });

        marker.addListener("gmp-mouseover", () => {
          setHoveredListingId(item.id);
          animateMarkerHover(el);

          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = setTimeout(() => {
            if (openInfoWindowId !== item.id && infoWindowRef.current) {
              infoWindowRef.current.setPosition({
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lng),
              });
              infoWindowRef.current.open(map);
            }
          }, 300);
        });

        marker.addListener("gmp-mouseout", () => {
          if (selectedListingId !== item.id) {
            setHoveredListingId(null);
            resetMarkerAnimation(el);
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            setTimeout(() => {
              if (infoWindowRef.current && openInfoWindowId !== item.id) {
                infoWindowRef.current.close();
              }
            }, 100);
          }
        });
      } catch (err) {
        console.error("Erreur lors de la création du marqueur :", err);
      }
    };

    setupMarker();

    return () => {
      if (markerRef.current) markerRef.current.map = null;
      infoWindowRef.current?.close();
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      markerElementRef.current = null;
      mountedRef.current = false;
    };
  }, [map, item, selectedListingId, openInfoWindowId, shouldShowMarker]);

  // Effet pour mettre à jour la visibilité du marqueur quand les filtres changent
  useEffect(() => {
    if (!markerRef.current) return;

    // Vérifier si le marqueur doit être visible selon les filtres
    const isVisible = shouldShowMarker();

    // Mettre à jour la visibilité du marqueur
    if (markerRef.current.map !== (isVisible ? map : null)) {
      markerRef.current.map = isVisible ? map : null;
    }
  }, [filters, item.id, map, shouldShowMarker]);

  useEffect(() => {
    if (!markerElementRef.current || !markerRef.current) return;

    const el = markerElementRef.current;
    const isHovered = hoveredListingId === item.id;
    const isSelected = selectedListingId === item.id;

    if (isHovered) animateMarkerHover(el);
    else if (isSelected) animateMarkerSelect(el);
    else resetMarkerAnimation(el);

    if (markerRef.current) {
      markerRef.current.zIndex = isHovered || isSelected ? 1000 : 1;
    }
  }, [hoveredListingId, selectedListingId, item.id]);

  const animateMarkerHover = (el) => {
    const svg = el?.querySelector("svg");
    if (!svg) return;
    svg.style.transition = "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
    svg.style.transform = "scale(1.3) translateY(-5px)";
    svg.style.filter = "drop-shadow(0 5px 5px rgba(0, 0, 0, 0.3))";
  };

  const animateMarkerSelect = (el) => {
    const svg = el?.querySelector("svg");
    if (!svg) return;
    svg.style.transition = "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)";
    svg.style.transform = "scale(1.4)";
    svg.style.filter = "drop-shadow(0 6px 8px rgba(0, 0, 0, 0.4))";
  };

  const resetMarkerAnimation = (el) => {
    const svg = el?.querySelector("svg");
    if (!svg) return;
    svg.style.transition = "transform 0.3s ease, filter 0.3s ease";
    svg.style.transform = "scale(1) translateY(0)";
    svg.style.filter = "none";
  };

  return null;
};

export default GoogleMarkerItem;
