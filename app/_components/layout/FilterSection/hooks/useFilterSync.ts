// hooks/useFilterSync.ts - VERSION MIGRÉE
import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// ✅ NOUVEAU : Import depuis les stores modulaires
import { useFiltersStoreState, useFiltersStoreActions } from "@/lib/store";
import { FILTER_SECTIONS } from "@/lib/config"; // ✅ Configuration centralisée

// ✅ Types depuis le store unifié
import type { FilterState } from "@/lib/store";

/**
 * Hook personnalisé pour la synchronisation des filtres
 *
 *
 * Features:
 * - Synchronisation bidirectionnelle URL ↔ Store
 * - Gestion optimisée des mises à jour
 * - Memoization pour éviter les re-renders
 * - Type safety complet
 * - Architecture modulaire
 */
export const useFilterSync = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ═══ Store state - NOUVEAU ═══
  const filtersState = useFiltersStoreState();
  const filters = filtersState.filters;
  const { toggleFilter, resetFilters, setFilters } = useFiltersStoreActions();

  /**
   * Sections de filtres memoizées depuis la configuration
   * ✅ NOUVEAU : utilise FILTER_SECTIONS centralisé
   */
  const memoizedFilterSections = useMemo(() => {
    // Conversion du format nouveau vers l'ancien pour compatibilité
    return FILTER_SECTIONS.map((section) => ({
      title: section.title,
      key: section.id,
      items: section.options.map((option) => option.value),
    }));
  }, []);

  /**
   * Comptage des filtres actifs
   */
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).reduce((count, filterArray) => {
      return count + (Array.isArray(filterArray) ? filterArray.length : 0);
    }, 0);
  }, [filters]);

  /**
   * Synchroniser les filtres avec l'URL
   * Préserve les paramètres de carte (lat, lng, zoom)
   */
  const syncFiltersToUrl = useCallback(
    (newFilters: FilterState) => {
      const params = new URLSearchParams();

      // ✅ Préserver les paramètres de carte
      const mapParams = ["lat", "lng", "zoom"];
      mapParams.forEach((param) => {
        const value = searchParams.get(param);
        if (value) params.set(param, value);
      });

      // ✅ Ajouter les filtres non vides
      Object.entries(newFilters).forEach(([key, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          params.set(key, values.join(","));
        }
      });

      // ✅ Navigation sans scroll
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  /**
   * Gestion du changement d'un filtre
   */
  const handleFilterChange = useCallback(
    (filterKey: keyof FilterState, value: string) => {
      // ✅ Utilise l'action du nouveau store
      toggleFilter(filterKey, value);

      // ✅ Synchroniser avec l'URL
      // Note: Le nouveau state sera disponible au prochain render
      // On peut soit attendre le re-render, soit calculer le nouveau state ici
      const currentValues = filters[filterKey] || [];
      const isSelected = currentValues.includes(value);
      const newValues = isSelected
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      const newFilters = { ...filters, [filterKey]: newValues };
      syncFiltersToUrl(newFilters);
    },
    [filters, toggleFilter, syncFiltersToUrl]
  );

  /**
   * Effacer une section de filtres
   */
  const clearSection = useCallback(
    (filterKey: keyof FilterState) => {
      const newFilters = { ...filters, [filterKey]: [] };
      setFilters(newFilters);
      syncFiltersToUrl(newFilters);
    },
    [filters, setFilters, syncFiltersToUrl]
  );

  /**
   * Reset de tous les filtres
   */
  const resetAllFilters = useCallback(() => {
    resetFilters();
    // ✅ Nettoyer l'URL tout en gardant les paramètres carte
    const params = new URLSearchParams();
    const mapParams = ["lat", "lng", "zoom"];
    mapParams.forEach((param) => {
      const value = searchParams.get(param);
      if (value) params.set(param, value);
    });

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [resetFilters, searchParams, router, pathname]);

  /**
   * Reset spécifique pour les filtres de carte (mapType)
   */
  const resetMapFilters = useCallback(() => {
    clearSection("mapType");
  }, [clearSection]);

  /**
   * Initialisation depuis l'URL (au montage du composant)
   */
  const initializeFromUrl = useCallback(() => {
    const urlFilters: Partial<FilterState> = {};
    let hasChanges = false;

    // ✅ Parser les filtres depuis l'URL
    Object.keys(filters).forEach((key) => {
      const urlValue = searchParams.get(key);
      if (urlValue) {
        const values = urlValue.split(",").filter(Boolean);
        if (values.length > 0) {
          urlFilters[key as keyof FilterState] = values as string[];
          hasChanges = true;
        }
      }
    });

    // ✅ Mettre à jour le store si nécessaire
    if (hasChanges) {
      setFilters({ ...filters, ...urlFilters } as FilterState);
    }
  }, [searchParams, filters, setFilters]);

  return {
    // ═══ État ═══
    filters,
    activeFilterCount,
    memoizedFilterSections,

    // ═══ Actions ═══
    handleFilterChange,
    clearSection,
    resetAllFilters,
    resetMapFilters,
    syncFiltersToUrl,
    initializeFromUrl,
  };
};

export default useFilterSync;
