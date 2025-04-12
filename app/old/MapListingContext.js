// contexts/MapListingContext.js - Version optimisée
"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

const MapListingContext = createContext();

export function MapListingProvider({ children }) {
  const [listings, setListings] = useState([]);
  const [visibleListings, setVisibleListings] = useState([]);
  const [hoveredListingId, setHoveredListingId] = useState(null);
  const [selectedListingId, setSelectedListingId] = useState(null);
  const [openInfoWindowId, setOpenInfoWindowId] = useState(null);

  // Méthode optimisée pour sélectionner un listing
  const selectListing = useCallback((id) => {
    setSelectedListingId(id);
    setOpenInfoWindowId(id);

    // Faire défiler automatiquement jusqu'à l'élément dans la liste
    // Utiliser requestAnimationFrame pour éviter les problèmes de timing
    requestAnimationFrame(() => {
      const listingElement = document.getElementById(`listing-${id}`);
      if (listingElement) {
        listingElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    });
  }, []);

  // Méthode pour désélectionner
  const clearSelection = useCallback(() => {
    setSelectedListingId(null);
    setOpenInfoWindowId(null);
  }, []);

  // Utiliser useMemo pour éviter les re-rendus inutiles du contexte
  const value = useMemo(
    () => ({
      listings,
      setListings,
      visibleListings,
      setVisibleListings,
      hoveredListingId,
      setHoveredListingId,
      selectedListingId,
      setSelectedListingId,
      openInfoWindowId,
      setOpenInfoWindowId,
      selectListing,
      clearSelection,
    }),
    [
      listings,
      visibleListings,
      hoveredListingId,
      selectedListingId,
      openInfoWindowId,
      selectListing,
      clearSelection,
    ]
  );

  return (
    <MapListingContext.Provider value={value}>
      {children}
    </MapListingContext.Provider>
  );
}

export function useMapListing() {
  const context = useContext(MapListingContext);
  if (!context) {
    console.warn("useMapListing doit être utilisé dans un MapListingProvider");
    return null;
  }
  return context;
}
