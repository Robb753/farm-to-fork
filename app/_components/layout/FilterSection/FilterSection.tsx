"use client";

import React, { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import dynamic from "next/dynamic";

// ✅ Hooks centralisés
import { useFilterSync } from "./hooks/useFilterSync";
import { useMobileDetection } from "./hooks/useMobileDetection";

// ✅ Composants modulaires
import DropdownPill from "./components/DropdownPill";
import ActiveFilters from "./components/ActiveFilters";
import ViewToggle from "./components/ViewToggle";
import MobileFilters from "./components/MobileFilters";

// ✅ Store unifié
import { useFiltersStoreState } from "@/lib/store";
import type { FilterState } from "@/lib/store";

// ✅ Configuration et utils
import { AGRICULTURE_TYPES } from "./utils/constants";

/* ------------------------------------------------------------------ */
/* ------------------- Types simples -------------------------------- */
/* ------------------------------------------------------------------ */

export interface FilterSectionProps {
  className?: string;
}

type FiltersModalProps = {
  open: boolean;
  onClose: () => void;
};

/* ------------------------------------------------------------------ */
/* ----------------------- Modal dynamique -------------------------- */
/* ------------------------------------------------------------------ */

const FiltersModal = dynamic<FiltersModalProps>(
  () => import("@/app/modules/listings/components/FiltersModal"),
  { ssr: false }
);

/* ------------------------------------------------------------------ */
/* ------------------- Event handler global ------------------------ */
/* ------------------------------------------------------------------ */

export const openMobileFilters = (): void => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("openMobileFilters"));
  }
};

/* ------------------------------------------------------------------ */
/* -------------------- Composant principal ------------------------- */
/* ------------------------------------------------------------------ */

const FilterSection: React.FC<FilterSectionProps> = ({ className = "" }) => {
  // ═══ État local ═══
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // ═══ Store state ═══
  const { filters } = useFiltersStoreState();

  // ═══ Hooks personnalisés ═══
  const {
    activeFilterCount,
    clearSection,
    handleFilterChange,
    resetAllFilters,
    resetMapFilters,
    memoizedFilterSections,
  } = useFilterSync();

  const { isMobile } = useMobileDetection();

  // ✅ Wrapper functions pour éviter les répétitions
  const clearSectionSafe = (key: string) =>
    clearSection(key as keyof FilterState);
  const handleFilterChangeSafe = (key: string, value: string) =>
    handleFilterChange(key as keyof FilterState, value);

  // ═══ Gestion des événements mobiles ═══
  useEffect(() => {
    const handleOpenMobileFilters = () => setIsMobileModalOpen(true);
    window.addEventListener("openMobileFilters", handleOpenMobileFilters);

    return () => {
      window.removeEventListener("openMobileFilters", handleOpenMobileFilters);
    };
  }, []);

  // ═══ Gestion scroll modal mobile ═══
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (isMobileModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.removeProperty("overflow");
    }

    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [isMobileModalOpen]);

  // ═══ Fonctions de gestion modal ═══
  const closeMobileModal = () => setIsMobileModalOpen(false);

  const handleResetAndClose = () => {
    resetAllFilters();
    closeMobileModal();
  };

  // ✅ Helper pour obtenir les valeurs d'un filtre
  const getFilterValues = (key: string): string[] => {
    const value = (filters as any)?.[key];
    return Array.isArray(value) ? value : [];
  };

  // ═══ Rendu modal mobile ═══
  if (isMobile && isMobileModalOpen) {
    return (
      <MobileFilters
        onClose={closeMobileModal}
        onReset={handleResetAndClose}
        isOpen={isMobileModalOpen}
      />
    );
  }

  // ═══ Rendu principal desktop ═══
  return (
    <div className={`flex w-full flex-col gap-1 ${className}`}>
      {/* Barre de filtres principale */}
      <div className="w-full border-b border-gray-100 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-6xl px-3">
          <div className="no-scrollbar flex h-12 items-center gap-2 overflow-x-auto py-2 [scrollbar-width:none] [-ms-overflow-style:none]">
            {/* ═══ Filtres dynamiques depuis la config ═══ */}
            {memoizedFilterSections.map((section: any, index: number) => {
              const { title, key, items } = section;

              // ✅ Conversion simple - pas de types compliqués
              const keyStr = String(key);

              // ✅ Mapping simple vers les vraies clés
              let actualKey = keyStr;
              if (keyStr === "productTypes") actualKey = "product_type";
              if (keyStr === "purchaseModes") actualKey = "purchase_mode";

              const values = getFilterValues(actualKey);

              return (
                <DropdownPill
                  key={`${actualKey}-${index}`}
                  label={title}
                  values={values}
                  onClear={() => clearSectionSafe(actualKey)}
                >
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">{title}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {Array.isArray(items) &&
                        items.map((item: string) => {
                          const checked = values.includes(item);
                          return (
                            <button
                              key={`${actualKey}-${item}`}
                              type="button"
                              role="checkbox"
                              aria-checked={checked}
                              aria-label={`${
                                checked ? "Désélectionner" : "Sélectionner"
                              } ${item}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFilterChangeSafe(actualKey, item);
                              }}
                              className="flex w-full cursor-pointer items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 rounded p-1"
                            >
                              <span
                                className={`flex h-4 w-4 items-center justify-center rounded border text-white transition ${
                                  checked
                                    ? "border-emerald-600 bg-emerald-600"
                                    : "border-gray-300 bg-white"
                                }`}
                              >
                                {checked && <span className="text-xs">✓</span>}
                              </span>
                              <span className="text-sm text-gray-700">
                                {item}
                              </span>
                            </button>
                          );
                        })}
                    </div>

                    {/* Reset section */}
                    {values.length > 0 && (
                      <div className="pt-1">
                        <button
                          onClick={() => clearSectionSafe(actualKey)}
                          className="text-xs text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
                          aria-label={`Réinitialiser les filtres ${title}`}
                        >
                          Réinitialiser
                        </button>
                      </div>
                    )}
                  </div>
                </DropdownPill>
              );
            })}

            {/* ═══ Filtre spécial Type d'agriculture ═══ */}
            <DropdownPill
              label="Type d'agriculture"
              values={getFilterValues("mapType")}
              onClear={resetMapFilters}
            >
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Type d'agriculture
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {AGRICULTURE_TYPES.map((type) => {
                    const mapTypeValues = getFilterValues("mapType");
                    const checked = mapTypeValues.includes(type.id);
                    return (
                      <button
                        key={`map-${type.id}`}
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        aria-label={`${
                          checked ? "Désélectionner" : "Sélectionner"
                        } ${type.label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFilterChangeSafe("mapType", type.id);
                        }}
                        className="flex w-full cursor-pointer items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 rounded p-1"
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border text-white transition ${
                            checked
                              ? "border-emerald-600 bg-emerald-600"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {checked && <span className="text-xs">✓</span>}
                        </span>
                        <span className="text-sm text-gray-700">
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Reset agriculture */}
                {getFilterValues("mapType").length > 0 && (
                  <div className="pt-1">
                    <button
                      onClick={resetMapFilters}
                      className="text-xs text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
                      aria-label="Réinitialiser les filtres de type d'agriculture"
                    >
                      Réinitialiser
                    </button>
                  </div>
                )}
              </div>
            </DropdownPill>

            {/* ═══ Bouton modal filtres avancés ═══ */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="ml-auto inline-flex h-9 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-xs shadow-[0_1px_0_0_rgba(17,24,39,0.04)] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Ouvrir le panneau de filtres avancés"
            >
              <Filter className="h-4 w-4" />
              Filtres
              {activeFilterCount > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-xs font-medium text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* ═══ Toggle Vue Liste/Carte (desktop) ═══ */}
            <ViewToggle />
          </div>
        </div>
      </div>

      {/* ═══ Modal filtres avancés ═══ */}
      <FiltersModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* ═══ Filtres actifs ═══ */}
      <ActiveFilters
        filters={filters}
        activeFilterCount={activeFilterCount}
        onFilterToggle={(key: any, value: any) =>
          handleFilterChangeSafe(key, value)
        }
        onResetAll={resetAllFilters}
      />
    </div>
  );
};

export default React.memo(FilterSection);
