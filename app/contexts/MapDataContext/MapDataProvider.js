// app/contexts/MapDataContext/MapDataProvider.js

"use client";

import React from "react";
import { MapStateProvider } from "./MapStateContext";
import { FilterStateProvider } from "./FilterStateContext";
import { ListingStateProvider } from "./ListingStateContext";

export function MapDataProvider({ children }) {
  return (
    <MapStateProvider>
      <FilterStateProvider>
        <ListingStateProvider>{children}</ListingStateProvider>
      </FilterStateProvider>
    </MapStateProvider>
  );
}
