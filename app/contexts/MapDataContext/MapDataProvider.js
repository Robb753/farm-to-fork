// app/contexts/MapDataContext/MapDataProvider.jsx
"use client";

import React from "react";
import { MapStateProvider } from "./MapStateContext";
import { ListingStateProvider } from "./ListingStateContext";
import { FilterStateProvider } from "./FilterStateContext";

/**
 * Provider unifié qui combine tous les contextes liés à la carte et aux listings
 * Cette approche permet d'éviter les problèmes d'imbrication et de s'assurer que tous
 * les contextes partagent le même état global.
 */
export function MapDataProvider({ children }) {
  return (
    <MapStateProvider>
      <ListingStateProvider>
        <FilterStateProvider>{children}</FilterStateProvider>
      </ListingStateProvider>
    </MapStateProvider>
  );
}
