// app/contexts/MapDataContext/FilterStateContext.js

"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useEffect,
  useState,
} from "react";
import { useListingState } from "./ListingStateContext";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

export const filterSections = [
  {
    title: "Produits",
    key: "product_type",
    items: [
      "Fruits",
      "Légumes",
      "Produits laitiers",
      "Viande",
      "Œufs",
      "Produits transformés",
    ],
  },
  {
    title: "Certifications",
    key: "certifications",
    items: ["Label AB", "Label Rouge", "AOP/AOC", "HVE", "Demeter"],
  },
  {
    title: "Distribution",
    key: "purchase_mode",
    items: [
      "Vente directe à la ferme",
      "Marché local",
      "Livraison à domicile",
      "Drive fermier",
    ],
  },
  {
    title: "Production",
    key: "production_method",
    items: [
      "Agriculture conventionnelle",
      "Agriculture biologique",
      "Agriculture durable",
      "Agriculture raisonnée",
    ],
  },
  {
    title: "Services",
    key: "additional_services",
    items: [
      "Visite de la ferme",
      "Ateliers de cuisine",
      "Hébergement",
      "Activités pour enfants",
      "Réservation pour événements",
    ],
  },
  {
    title: "Disponibilité",
    key: "availability",
    items: [
      "Saisonnière",
      "Toute l'année",
      "Pré-commande",
      "Sur abonnement",
      "Événements spéciaux",
    ],
  },
];

const initialFilters = Object.fromEntries(
  filterSections.map(({ key }) => [key, []])
);

const FilterStateContext = createContext(null);

const ActionTypes = {
  TOGGLE_FILTER: "TOGGLE_FILTER",
  RESET_FILTERS: "RESET_FILTERS",
  SET_ALL: "SET_ALL",
};

function reducer(state, action) {
  switch (action.type) {
    case ActionTypes.TOGGLE_FILTER: {
      const { filterKey, value } = action.payload;
      const currentValues = state[filterKey] || [];
      const updatedValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...state, [filterKey]: updatedValues };
    }
    case ActionTypes.RESET_FILTERS:
      return initialFilters;
    case ActionTypes.SET_ALL:
      return { ...initialFilters, ...action.payload };
    default:
      return state;
  }
}

// Fonction de filtrage à utiliser globalement
export function filterListings(allListings, filters) {
  const hasActive = Object.values(filters).some((arr) => arr.length > 0);
  if (!hasActive || !allListings) return allListings || [];

  return allListings.filter((listing) =>
    Object.entries(filters).every(([key, values]) => {
      if (values.length === 0) return true;

      const listingValues = Array.isArray(listing[key])
        ? listing[key]
        : listing[key]
        ? [listing[key]]
        : [];

      if (listingValues.length === 0) return false;

      return values.some((v) => listingValues.includes(v));
    })
  );
}

export function FilterStateProvider({ children }) {
  const [filters, dispatch] = useReducer(reducer, initialFilters);
  const [filtersHydrated, setFiltersHydrated] = useState(false);

  const {
    allListings,
    setVisibleListings,
    setFilteredListings,
    setCurrentFilters,
  } = useListingState() || {};

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Hydratation initiale depuis l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFilters = {};

    filterSections.forEach(({ key }) => {
      const val = params.get(key);
      if (val) urlFilters[key] = val.split(",");
    });

    if (Object.keys(urlFilters).length > 0) {
      dispatch({ type: ActionTypes.SET_ALL, payload: urlFilters });
    }

    setFiltersHydrated(true);
  }, []);

  // Mise à jour des listings filtrés
  useEffect(() => {
    if (allListings && allListings.length > 0) {
      if (setCurrentFilters) setCurrentFilters(filters);

      const filtered = filterListings(allListings, filters);

      if (setFilteredListings) setFilteredListings(filtered);
      if (setVisibleListings) setVisibleListings(filtered);
    }
  }, [
    filters,
    allListings,
    setVisibleListings,
    setFilteredListings,
    setCurrentFilters,
  ]);

  // Synchronisation des filtres avec l'URL (si lat/lng sont présents)
  useEffect(() => {
    if (!filtersHydrated) return;

    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (!lat || !lng) return;

    const params = new URLSearchParams();
    params.set("lat", lat);
    params.set("lng", lng);

    Object.entries(filters).forEach(([key, values]) => {
      if (values.length > 0) {
        params.set(key, values.join(","));
      }
    });

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [filters, filtersHydrated]);

  const value = useMemo(() => {
    return {
      filters,
      toggleFilter: (filterKey, value) =>
        dispatch({
          type: ActionTypes.TOGGLE_FILTER,
          payload: { filterKey, value },
        }),
      resetFilters: () => dispatch({ type: ActionTypes.RESET_FILTERS }),
      filterListings: (listings) => filterListings(listings, filters),
      filtersHydrated,
    };
  }, [filters, filtersHydrated]);

  return (
    <FilterStateContext.Provider value={value}>
      {children}
    </FilterStateContext.Provider>
  );
}

export function useFilterState() {
  const context = useContext(FilterStateContext);
  if (!context) {
    throw new Error("useFilterState must be used within a FilterStateProvider");
  }
  return context;
}
