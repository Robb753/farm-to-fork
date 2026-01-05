// hooks/useFilterSync.ts - VERSION MIGRÉE VERS STORE UNIFIÉ
import { useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// ✅ MIGRATION: Import depuis le store unifié
import { useUnifiedStore } from "@/lib/store/unifiedStore";
import { FILTER_SECTIONS } from "@/lib/config";

// ✅ Types depuis le store unifié
import type { FilterState } from "@/lib/store/unifiedStore";

export const useFilterSync = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ✅ MIGRATION: Sélecteurs optimisés du store unifié
  const filters = useUnifiedStore((state) => state.filters.current);
  const toggleFilter = useUnifiedStore(
    (state) => state.filtersActions.toggleFilter
  );
  const resetFilters = useUnifiedStore(
    (state) => state.filtersActions.resetFilters
  );
  const setFilters = useUnifiedStore(
    (state) => state.filtersActions.setFilters
  );

  /**
   * Sections de filtres memoizées depuis la configuration
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
    return Object.values(filters).reduce(
      (count, filterArray: string[] | unknown) => {
        return count + (Array.isArray(filterArray) ? filterArray.length : 0);
      },
      0
    );
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
   * ✅ MIGRATION: Gestion du changement d'un filtre
   *
   * AVANT: toggleFilter + calcul manuel + syncFiltersToUrl
   * APRÈS: toggleFilter déclenche automatiquement applyFiltersAndBounds()
   */
  const handleFilterChange = useCallback(
    (filterKey: keyof FilterState, value: string) => {
      // ✅ Toggle le filtre (synchronisation automatique dans le store)
      toggleFilter(filterKey, value);

      // ✅ Calculer le nouveau state pour l'URL
      const currentValues = filters[filterKey] || [];
      const isSelected = currentValues.includes(value);
      const newValues = isSelected
        ? currentValues.filter((v: string) => v !== value)
        : [...currentValues, value];

      const newFilters = { ...filters, [filterKey]: newValues };
      syncFiltersToUrl(newFilters);
    },
    [filters, toggleFilter, syncFiltersToUrl]
  );

  /**
   * ✅ MIGRATION: Effacer une section de filtres
   *
   * setFilters déclenche automatiquement applyFiltersAndBounds()
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
   * ✅ MIGRATION: Reset de tous les filtres
   *
   * resetFilters déclenche automatiquement applyFiltersAndBounds()
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

    // ✅ Mettre à jour le store si nécessaire (sync automatique)
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
