"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  XIcon,
  FilterIcon,
  CheckIcon,
} from "lucide-react";
import { useFilterState } from "@/app/contexts/MapDataContext/FilterStateContext";

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

const mapFilterTypes = [
  { id: "conventional", label: "Agriculture conventionnelle" },
  { id: "organic", label: "Agriculture biologique" },
  { id: "sustainable", label: "Agriculture durable" },
  { id: "reasoned", label: "Agriculture raisonnée" },
];

const SimpleCheckbox = ({ checked, onChange, id, label }) => (
  <div className="flex items-center space-x-3">
    <div
      id={id}
      onClick={onChange}
      className={`w-4 h-4 flex items-center justify-center border rounded cursor-pointer ${
        checked
          ? "bg-green-600 border-green-600 text-white"
          : "border-gray-300 bg-white"
      }`}
    >
      {checked && <CheckIcon className="h-3 w-3" />}
    </div>
    <label
      htmlFor={id}
      className="text-gray-700 text-sm cursor-pointer"
      onClick={onChange}
    >
      {label}
    </label>
  </div>
);

const FilterSection = () => {
  const { filters, toggleFilter, resetFilters } = useFilterState();
  const [isOpen, setIsOpen] = useState(null);
  const [isMapFilterOpen, setIsMapFilterOpen] = useState(false);
  const containerRef = useRef(null);
  const mapFilterRef = useRef(null);

  const toggleSection = useCallback((section) => {
    setIsOpen((prev) => (prev === section ? null : section));
  }, []);

  const toggleMapFilter = useCallback(() => {
    setIsMapFilterOpen((prev) => !prev);
  }, []);

  const handleFilterChange = useCallback(
    (key, value) => {
      toggleFilter(key, value);
    },
    [toggleFilter]
  );

  const handleClickOutside = useCallback((event) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setIsOpen(null);
    }

    if (mapFilterRef.current && !mapFilterRef.current.contains(event.target)) {
      setIsMapFilterOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [handleClickOutside]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).reduce(
      (count, values) => count + (values?.length || 0),
      0
    );
  }, [filters]);

  const resetAllFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  const resetMapFilters = useCallback(() => {
    if (!filters.mapType || filters.mapType.length === 0) return;

    mapFilterTypes.forEach((type) => {
      if (filters.mapType.includes(type.id)) {
        handleFilterChange("mapType", type.id);
      }
    });
  }, [filters.mapType, handleFilterChange]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div
        ref={containerRef}
        className="relative z-20 flex flex-wrap justify-between items-center gap-4 p-4 bg-white shadow-sm rounded-lg w-full text-sm lg:flex-nowrap border border-gray-200"
      >
        {filterSections.map(({ title, key, items }) => (
          <section
            key={key}
            className="relative w-full lg:w-auto flex-1 cursor-pointer"
            onClick={() => toggleSection(key)}
          >
            <div
              className={`flex justify-between items-center p-3 rounded-md border border-gray-200 transition-all duration-200 ${
                isOpen === key
                  ? "bg-gray-50 border-gray-300"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              <h3 className="text-gray-700 font-medium flex-1 text-center">
                {title}
              </h3>
              <div
                className="flex items-center cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection(key);
                }}
              >
                {isOpen === key ? (
                  <ChevronUpIcon className="text-gray-500 h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="text-gray-500 h-5 w-5" />
                )}
              </div>
            </div>
            <div
              className={`absolute top-full left-0 mt-1 w-full bg-white shadow-md rounded-md overflow-hidden transition-all duration-200 ${
                isOpen === key
                  ? "opacity-100 max-h-96"
                  : "opacity-0 max-h-0 pointer-events-none"
              } z-50`}
            >
              <div className="p-3 space-y-2">
                {items.map((item) => {
                  const isChecked = filters[key]?.includes(item) || false;
                  return (
                    <SimpleCheckbox
                      key={`${key}-${item}`}
                      id={`${key}-${item}`}
                      checked={isChecked}
                      onChange={() => handleFilterChange(key, item)}
                      label={item}
                    />
                  );
                })}
              </div>
            </div>
          </section>
        ))}

        <div ref={mapFilterRef} className="relative">
          <button
            onClick={toggleMapFilter}
            className={`flex items-center gap-2 px-4 py-3 rounded-md border ${
              isMapFilterOpen || filters.mapType?.length
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FilterIcon className="h-4 w-4" />
            <span className="font-medium">Type d'agriculture</span>
            {filters.mapType?.length > 0 && (
              <span className="inline-flex items-center justify-center bg-green-100 text-green-800 text-xs font-medium rounded-full h-5 min-w-5 px-1.5">
                {filters.mapType.length}
              </span>
            )}
            {isMapFilterOpen ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>

          <div
            className={`absolute right-0 top-full mt-1 bg-white rounded-md shadow-md p-3 border border-gray-200 w-64 z-50 transition-all duration-200 ${
              isMapFilterOpen
                ? "opacity-100 transform translate-y-0"
                : "opacity-0 transform -translate-y-2 pointer-events-none"
            }`}
          >
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
              <h4 className="font-medium text-gray-800">Type d'agriculture</h4>
              {filters.mapType?.length > 0 && (
                <button
                  onClick={resetMapFilters}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Réinitialiser
                </button>
              )}
            </div>
            <div className="space-y-2">
              {mapFilterTypes.map((type) => {
                const isChecked = filters.mapType?.includes(type.id) || false;
                return (
                  <SimpleCheckbox
                    key={`map-filter-${type.id}`}
                    id={`map-filter-${type.id}`}
                    checked={isChecked}
                    onChange={() => handleFilterChange("mapType", type.id)}
                    label={type.label}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2">
          <span className="text-sm text-gray-500">Filtres actifs:</span>
          {Object.entries(filters).flatMap(([key, values]) =>
            values.map((value) => (
              <div
                key={`${key}-${value}`}
                className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs"
              >
                <span>{value}</span>
                <button
                  onClick={() => handleFilterChange(key, value)}
                  className="text-green-600 hover:text-green-800"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
          <button
            onClick={resetAllFilters}
            className="text-xs text-gray-500 hover:text-gray-700 ml-2"
          >
            Effacer tous les filtres
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(FilterSection);
