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
import { useSearchParams } from "next/navigation";
import { useUpdateExploreUrl } from "@/utils/updateExploreUrl";

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

function filtersToUrlParams(filters) {
  const params = {};
  Object.entries(filters).forEach(([key, values]) => {
    if (values.length > 0) {
      params[key] = values.join(",");
    }
  });
  return params;
}

export function FilterStateProvider({ children }) {
  const [filters, dispatch] = useReducer(reducer, initialFilters);
  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const searchParams = useSearchParams();
  const updateExploreUrl = useUpdateExploreUrl();

  const {
    allListings,
    setVisibleListings,
    setFilteredListings,
    setCurrentFilters,
  } = useListingState() || {};

  // Hydrater les filtres depuis l’URL au chargement
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

  // Mise à jour des listings lorsqu’un filtre est modifié
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

  // Synchroniser l’URL avec les filtres (sans écraser lat/lng)
  useEffect(() => {
    if (!filtersHydrated) return;

    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (!lat || !lng) return;

    updateExploreUrl({
      lat,
      lng,
      ...filtersToUrlParams(filters),
    });
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

function filterListings(allListings, filters) {
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

export function useFilterState() {
  const context = useContext(FilterStateContext);
  if (!context) {
    throw new Error("useFilterState must be used within a FilterStateProvider");
  }
  return context;
}
