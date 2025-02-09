"use client";
import React, {
  useEffect,
  useReducer,
  useRef,
  useMemo,
  useCallback,
  useState,
} from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { debounce } from "lodash";

const filterSections = [
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
    default:
      return state;
  }
};

function FilterSection({ onChangeFilters }) {
  const [filters, dispatch] = useReducer(filterReducer, initialState);
  const [isOpen, setIsOpen] = useState(null);
  const prevFiltersRef = useRef(initialState);
  const containerRef = useRef(null);

  const toggleSection = (section) => {
    setIsOpen((prevSection) => (prevSection === section ? null : section));
  };

  const debouncedOnChangeFilters = useMemo(
    () => debounce(onChangeFilters, 300),
    [onChangeFilters]
  );

  useEffect(() => {
    return () => {
      debouncedOnChangeFilters.cancel();
    };
  }, [debouncedOnChangeFilters]);

  useEffect(() => {
    if (JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current)) {
      prevFiltersRef.current = filters;
      debouncedOnChangeFilters(filters);
    }
  }, [filters, debouncedOnChangeFilters]);

  const handleClickOutside = useCallback((event) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setIsOpen(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div
      ref={containerRef}
      className="relative z-50 flex flex-wrap justify-between items-center gap-4 p-4 bg-white shadow-lg rounded-xl w-full text-sm lg:flex-nowrap"
    >
      {filterSections.map(({ title, key, items }) => (
        <section
          key={key}
          className="relative w-full lg:w-auto flex-1 cursor-pointer"
          onClick={() => toggleSection(key)}
        >
          <div
            className={`flex justify-between items-center p-4 rounded-xl border border-gray-300 shadow-sm transition-all duration-300 ${
              isOpen === key ? "bg-gray-100" : "bg-white hover:bg-gray-50"
            }`}
          >
            <h3 className="text-gray-700 font-medium flex-1 text-center">{title}</h3>
            <div
              className="flex items-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                toggleSection(key);
              }}
            >
              {isOpen === key ? (
                <ChevronUpIcon className="text-gray-500" />
              ) : (
                <ChevronDownIcon className="text-gray-500" />
              )}
            </div>
          </div>
          <div
            className={`absolute top-full left-0 mt-2 w-full bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300 ${
              isOpen === key ? "opacity-100 max-h-96" : "opacity-0 max-h-0"
            } z-50`}
          >
            <div className="p-4 space-y-3">
              {items.map((item) => (
                <div key={item} className="flex items-center space-x-3">
                  <Checkbox
                    id={item}
                    checked={filters[key].includes(item)}
                    onCheckedChange={() =>
                      dispatch({
                        type: "TOGGLE_FILTER",
                        filterKey: key,
                        value: item,
                      })
                    }
                    className="w-5 h-5 text-primary"
                  />
                  <label htmlFor={item} className="text-gray-700 text-sm">
                    {item}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

export default FilterSection;
