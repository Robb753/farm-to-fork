// app/contexts/MapDataContext/FilterStateContext.js

"use client";

import React, { createContext, useContext, useReducer, useMemo } from "react";

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

export function FilterStateProvider({ children }) {
  const [filters, dispatch] = useReducer(reducer, initialFilters);

  const value = useMemo(() => {
    return {
      filters,
      toggleFilter: (filterKey, value) =>
        dispatch({
          type: ActionTypes.TOGGLE_FILTER,
          payload: { filterKey, value },
        }),
      resetFilters: () => dispatch({ type: ActionTypes.RESET_FILTERS }),
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
