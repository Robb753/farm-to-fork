"use client"

import React, { createContext, useContext, useState } from "react";

const MapListingContext = createContext();

export const MapListingProvider = ({ children }) => {
  const [listings, setListings] = useState([]); // Toutes les fermes
  const [visibleListings, setVisibleListings] = useState([]); // Fermes visibles

  return (
    <MapListingContext.Provider
      value={{ listings, setListings, visibleListings, setVisibleListings }}
    >
      {children}
    </MapListingContext.Provider>
  );
};

export const useMapListing = () => {
  const context = useContext(MapListingContext);
  if (!context) {
    throw new Error("useMapListing must be used within a MapListingProvider");
  }
  return context;
};
