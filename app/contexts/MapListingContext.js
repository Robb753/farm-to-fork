"use client";
import React, { createContext, useContext, useState } from "react";

const MapListingContext = createContext();

export function MapListingProvider({ children }) {
  const [listings, setListings] = useState([]);
  const [visibleListings, setVisibleListings] = useState([]);
  const [hoveredListingId, setHoveredListingId] = useState(null);
  const [selectedListingId, setSelectedListingId] = useState(null);

  const value = {
    listings,
    setListings,
    visibleListings,
    setVisibleListings,
    hoveredListingId,
    setHoveredListingId,
    selectedListingId,
    setSelectedListingId,
  };

  return (
    <MapListingContext.Provider value={value}>
      {children}
    </MapListingContext.Provider>
  );
}

export function useMapListing() {
  return useContext(MapListingContext);
}
