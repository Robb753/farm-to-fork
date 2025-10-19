// app/contexts/MapDataTransitionProvider.jsx
"use client";

import { createContext, useContext } from "react";
import useMapListingsStore, {
  useMapState as useZustandMapState,
  useMapActions,
  useListingsState,
  useListingsActions,
  useInteractionsState,
  useInteractionsActions,
  useFiltersState,
  useFiltersActions,
} from "@/lib/store/mapListingsStore";

const MapDataTransitionContext = createContext(null);

export function MapDataTransitionProvider({ children }) {
  // Exposer la même API que les anciens contextes
  const value = {
    // API compatible avec useMapData
    coordinates: useZustandMapState().coordinates,
    setCoordinates: useMapActions().setCoordinates,
    isApiLoaded: useZustandMapState().isApiLoaded,

    // API compatible avec useListingState
    allListings: useListingsState().all,
    visibleListings: useListingsState().visible,
    filteredListings: useListingsState().filtered,
    isLoading: useListingsState().isLoading,
    hasMore: useListingsState().hasMore,

    // API compatible avec useInteractions
    hoveredListingId: useInteractionsState().hoveredListingId,
    selectedListingId: useInteractionsState().selectedListingId,
    openInfoWindowId: useInteractionsState().openInfoWindowId,

    // Actions
    ...useMapActions(),
    ...useListingsActions(),
    ...useInteractionsActions(),
    ...useFiltersActions(),
  };

  return (
    <MapDataTransitionContext.Provider value={value}>
      {children}
    </MapDataTransitionContext.Provider>
  );
}

export const useMapDataTransition = () => {
  const context = useContext(MapDataTransitionContext);
  if (!context) {
    throw new Error(
      "useMapDataTransition must be used within MapDataTransitionProvider"
    );
  }
  return context;
};
