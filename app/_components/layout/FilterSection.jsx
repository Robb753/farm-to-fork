"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  Check,
  ArrowLeft,
} from "@/utils/icons";
import { useFilterState } from "@/app/contexts/MapDataContext/FilterStateContext";

export const openMobileFilters = () => {
  window.dispatchEvent(new CustomEvent("openMobileFilters"));
};

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
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <div
      onClick={onChange}
      className={`w-4 h-4 flex items-center justify-center border rounded cursor-pointer ${
        checked
          ? "bg-green-600 border-green-600 text-white"
          : "border-gray-300 bg-white"
      }`}
    >
      {checked && <Check className="h-3 w-3" />}
    </div>
    <label htmlFor={id} className="text-gray-700 text-sm cursor-pointer">
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

  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handleOpenMobileFilters = () => {
      setIsMobileModalOpen(true);
      // Émettre l'événement modal pour le backdrop
      window.dispatchEvent(new CustomEvent("modalOpen", { detail: true }));
    };

    window.addEventListener("openMobileFilters", handleOpenMobileFilters);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("openMobileFilters", handleOpenMobileFilters);
    };
  }, []);

  const closeMobileModal = () => {
    setIsMobileModalOpen(false);
    // Émettre l'événement pour fermer le backdrop
    window.dispatchEvent(new CustomEvent("modalOpen", { detail: false }));
  };

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

  if (isMobile && isMobileModalOpen) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        {/* Header mobile */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={closeMobileModal}
              className="flex items-center gap-2 text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour</span>
            </button>
            <h1 className="text-lg font-semibold">Filtres</h1>
            <button
              onClick={() => {
                resetFilters();
                closeMobileModal();
              }}
              className="text-green-600 font-medium"
            >
              Effacer
            </button>
          </div>
        </div>

        {/* Filtres en version mobile - layout vertical */}
        <div className="p-4 space-y-6">
          {filterSections.map(({ title, key, items }) => (
            <div
              key={key}
              className="border-b border-gray-200 pb-6 last:border-b-0"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {title}
              </h3>
              <div className="space-y-3">
                {items.map((item) => {
                  const isChecked = filters[key]?.includes(item) || false;
                  return (
                    <SimpleCheckbox
                      key={`mobile-${key}-${item}`}
                      id={`mobile-${key}-${item}`}
                      checked={isChecked}
                      onChange={() => handleFilterChange(key, item)}
                      label={item}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Section Type d'agriculture en mobile */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Type d'agriculture
            </h3>
            <div className="space-y-3">
              {mapFilterTypes.map((type) => {
                const isChecked = filters.mapType?.includes(type.id) || false;
                return (
                  <SimpleCheckbox
                    key={`mobile-map-filter-${type.id}`}
                    id={`mobile-map-filter-${type.id}`}
                    checked={isChecked}
                    onChange={() => handleFilterChange("mapType", type.id)}
                    label={type.label}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer mobile avec bouton de validation */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={closeMobileModal}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium text-base"
          >
            Appliquer les filtres ({activeFilterCount})
          </button>
        </div>
      </div>
    );
  }

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
                  <ChevronUp className="text-gray-500 h-5 w-5" />
                ) : (
                  <ChevronDown className="text-gray-500 h-5 w-5" />
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
            <Filter className="h-4 w-4" />
            <span className="font-medium">Type d'agriculture</span>
            {filters.mapType?.length > 0 && (
              <span className="inline-flex items-center justify-center bg-green-100 text-green-800 text-xs font-medium rounded-full h-5 min-w-5 px-1.5">
                {filters.mapType.length}
              </span>
            )}
            {isMapFilterOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
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
                  <X className="h-3 w-3" />
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
