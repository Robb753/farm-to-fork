// app/contexts/MapDataContext/FilterStateContext.js

"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useEffect,
} from "react";
import { useListingState } from "./ListingStateContext";

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
      // Si aucun filtre n'est activé pour cette catégorie, on accepte tout
      if (values.length === 0) return true;

      // Récupérer les valeurs du listing pour cette catégorie
      const listingValues = Array.isArray(listing[key])
        ? listing[key]
        : listing[key]
        ? [listing[key]]
        : [];

      // Si le listing n'a pas de valeurs pour cette catégorie mais que des filtres
      // sont actifs pour cette catégorie, il ne doit pas être inclus
      if (listingValues.length === 0) return false;

      // Vérifier si au moins une valeur du filtre correspond à une valeur du listing
      return values.some((v) => listingValues.includes(v));
    })
  );
}

export function FilterStateProvider({ children }) {
  const [filters, dispatch] = useReducer(reducer, initialFilters);
  const {
    allListings,
    setVisibleListings,
    setFilteredListings,
    setCurrentFilters,
  } = useListingState() || {};

  // Effet pour mettre à jour les listings visibles quand les filtres changent
  useEffect(() => {
    if (allListings && allListings.length > 0) {
      // Mettre à jour les filtres courants dans le contexte ListingState
      if (setCurrentFilters) {
        setCurrentFilters(filters);
      }

      // Filtrer les listings en fonction des filtres actuels
      const filtered = filterListings(allListings, filters);

      console.log("Filtres actifs:", filters);
      console.log("Listings avant filtrage:", allListings.length);
      console.log("Listings après filtrage:", filtered.length);

      // Mettre à jour à la fois filteredListings et visibleListings
      if (setFilteredListings) {
        setFilteredListings(filtered);
      }

      if (setVisibleListings) {
        setVisibleListings(filtered);
      }
    }
  }, [
    filters,
    allListings,
    setVisibleListings,
    setFilteredListings,
    setCurrentFilters,
  ]);

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
    };
  }, [filters]);

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
