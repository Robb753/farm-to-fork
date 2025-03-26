"use client";
import { createContext, useContext, useReducer, useMemo } from "react";
import { debounce } from "lodash";

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

const initialState = Object.fromEntries(
  filterSections.map(({ key }) => [key, []])
);

const filterReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_FILTER":
      return {
        ...state,
        [action.filterKey]: state[action.filterKey].includes(action.value)
          ? state[action.filterKey].filter((item) => item !== action.value)
          : [...state[action.filterKey], action.value],
      };
    case "RESET_FILTERS":
      return initialState;
    default:
      return state;
  }
};

const FiltersContext = createContext();

export const FiltersProvider = ({ children }) => {
  const [filters, dispatch] = useReducer(filterReducer, initialState);
  const debouncedFilters = useMemo(
    () => debounce((newFilters) => newFilters, 300),
    []
  );

  return (
    <FiltersContext.Provider value={{ filters, dispatch, debouncedFilters }}>
      {children}
    </FiltersContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error("useFilters must be used within a FiltersProvider");
  }
  return context;
};
