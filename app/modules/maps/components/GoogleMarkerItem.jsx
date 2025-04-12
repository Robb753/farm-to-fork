"use client";

import React, { useEffect, useRef, useCallback, memo } from "react";
import { useListingState } from "@/app/contexts/MapDataContext/ListingStateContext";

const GoogleMarkerItem = ({ map, item, isVisible = true }) => {
  const markerRef = useRef(null);
  const markerElementRef = useRef(null);
  const mountedRef = useRef(false);
  const markerLibraryPromise = useRef(null);

  const {
    hoveredListingId,
    setHoveredListingId,
    selectedListingId,
    setSelectedListingId,
    openInfoWindowId,
    setOpenInfoWindowId,
  } = useListingState();

  const loadMarkerLibrary = useCallback(async () => {
    if (!window.google?.maps) return null;
    if (!markerLibraryPromise.current) {
      markerLibraryPromise.current = window.google.maps.importLibrary("marker");
    }
    return markerLibraryPromise.current;
  }, []);

  useEffect(() => {
    if (!map || !item?.lat || !item?.lng || !isVisible || mountedRef.current)
      return;

    mountedRef.current = true;

    const setupMarker = async () => {
      try {
        const { AdvancedMarkerElement } = await loadMarkerLibrary();
        if (!AdvancedMarkerElement) return;

        const el = document.createElement("div");
        el.className = "marker-element";

        el.innerHTML = `
          <img 
            src="${
              item.availability === "open"
                ? "/marker-green.svg"
                : "/marker-red.svg"
            }"
            alt="${item.name || "Ferme"}"
            class="w-8 h-8 transition-all duration-200 marker-icon"
            data-listing-id="${item.id}"
          />
        `;

        markerElementRef.current = el;

        const marker = new AdvancedMarkerElement({
          map,
          position: { lat: parseFloat(item.lat), lng: parseFloat(item.lng) },
          content: el,
          title: item.name || "Ferme",
          zIndex: selectedListingId === item.id ? 1000 : 1,
        });

        markerRef.current = marker;

        marker.addListener("gmp-click", () => {
          const alreadyOpen = openInfoWindowId === item.id;
          setSelectedListingId(alreadyOpen ? null : item.id);
          setOpenInfoWindowId(alreadyOpen ? null : item.id);

          requestAnimationFrame(() => {
            const el = document.getElementById(`listing-${item.id}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              el.classList.add("selected-listing");
              setTimeout(() => el.classList.remove("selected-listing"), 1500);
            }
          });
        });

        marker.addListener("gmp-mouseover", () => {
          const img = el.querySelector("img");
          if (img) {
            img.style.transform = "scale(1.3)";
            img.style.filter = "drop-shadow(0 0 4px rgba(0,0,0,0.4))";
            img.classList.add("marker-hover-effect");
          }
          setHoveredListingId(item.id);
        });

        marker.addListener("gmp-mouseout", () => {
          const img = el.querySelector("img");
          if (img && selectedListingId !== item.id) {
            img.style.transform = "scale(1)";
            img.style.filter = "none";
            img.classList.remove("marker-hover-effect");
          }
          setHoveredListingId(null);
        });
      } catch (err) {
        console.error("Erreur lors de la création du marqueur :", err);
      }
    };

    setupMarker();

    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
        markerRef.current = null;
      }
      markerElementRef.current = null;
      mountedRef.current = false;
    };
  }, [
    map,
    item,
    isVisible,
    selectedListingId,
    openInfoWindowId,
    loadMarkerLibrary,
    setHoveredListingId,
    setOpenInfoWindowId,
    setSelectedListingId,
  ]);

  useEffect(() => {
    if (!markerElementRef.current || !markerRef.current) return;

    const img = markerElementRef.current.querySelector("img");
    if (!img) return;

    const isActive =
      hoveredListingId === item.id || selectedListingId === item.id;

    img.style.transform = isActive ? "scale(1.3)" : "scale(1)";
    img.style.filter = isActive
      ? "drop-shadow(0 0 4px rgba(0,0,0,0.4))"
      : "none";
    markerRef.current.zIndex = isActive ? 1000 : 1;

    // Rebond lors du survol depuis la liste
    if (hoveredListingId === item.id) {
      img.classList.add("marker-hover-effect");
      setTimeout(() => {
        img.classList.remove("marker-hover-effect");
      }, 600);
    }
  }, [hoveredListingId, selectedListingId, item.id]);

  return null;
};

const arePropsEqual = (prev, next) => {
  return (
    prev.item?.id === next.item?.id &&
    prev.isVisible === next.isVisible &&
    prev.item?.lat === next.item?.lat &&
    prev.item?.lng === next.item?.lng &&
    prev.item?.availability === next.item?.availability
  );
};

export default memo(GoogleMarkerItem, arePropsEqual);
