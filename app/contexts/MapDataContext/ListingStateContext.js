// app/contexts/MapDataContext/ListingStateContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useMapState } from "./MapStateContext";

const ListingStateContext = createContext(null);

export function ListingStateProvider({ children }) {
  const { mapBounds } = useMapState();
  const [allListings, setAllListings] = useState([]);
  const [visibleListings, setVisibleListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [openInfoWindowId, setOpenInfoWindowId] = useState(null);
  const [selectedListingId, setSelectedListingId] = useState(null);
  const [hoveredListingId, setHoveredListingId] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({});

  // Fonction pour vérifier si une ferme est dans les limites actuelles de la carte
  const isListingInBounds = useCallback((listing, bounds) => {
    if (!bounds) return true;

    const lat = parseFloat(listing.lat);
    const lng = parseFloat(listing.lng);

    return (
      lat <= bounds.ne.lat &&
      lat >= bounds.sw.lat &&
      lng <= bounds.ne.lng &&
      lng >= bounds.sw.lng
    );
  }, []);

  // Effet pour filtrer les listings en fonction des bounds uniquement
  // Nous n'utilisons plus filteredListings ici, car il est maintenant géré par FilterStateContext
  useEffect(() => {
    if (filteredListings && filteredListings.length > 0 && mapBounds) {
      // Filtre uniquement par bounds, mais utilise filteredListings comme base
      // qui a déjà été filtré par les critères de filtre (Œufs, etc.)
      const listingsInBounds = filteredListings.filter((listing) =>
        isListingInBounds(listing, mapBounds)
      );

      setVisibleListings(listingsInBounds);
    } else {
      // Si pas de bounds ou pas de filteredListings, on utilise simplement filteredListings
      setVisibleListings(filteredListings);
    }
  }, [mapBounds, filteredListings, isListingInBounds]);

  const clearSelection = useCallback(() => {
    setSelectedListingId(null);
    setOpenInfoWindowId(null);
  }, []);

  // Alias de setAllListings pour compatibilité
  const setListings = useCallback((listings) => {
    setAllListings(listings);
  }, []);

  const value = {
    allListings,
    setAllListings,
    setListings,
    visibleListings,
    setVisibleListings,
    filteredListings,
    setFilteredListings,
    isLoading,
    setIsLoading,
    hasMore,
    setHasMore,
    openInfoWindowId,
    setOpenInfoWindowId,
    selectedListingId,
    setSelectedListingId,
    hoveredListingId,
    setHoveredListingId,
    clearSelection,
    currentFilters,
    setCurrentFilters,
  };

  return (
    <ListingStateContext.Provider value={value}>
      {children}
    </ListingStateContext.Provider>
  );
}

export const useListingState = () => {
  const context = useContext(ListingStateContext);
  if (!context) {
    throw new Error(
      "useListingState must be used within a ListingStateProvider"
    );
  }
  return context;
};
