// lib/store/filtersStore.ts - Version corrigée
import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import type { FilterState, Listing, MapBounds } from "./shared/types";

/**
 * Interface pour l'état des filtres
 */
interface FiltersStoreState {
  // ═══ État des filtres ═══
  filters: FilterState;
  filtersHydrated: boolean;
}

/**
 * Interface pour les actions des filtres
 */
interface FiltersActions {
  // ═══ Actions de base ═══
  toggleFilter: (filterKey: keyof FilterState, value: string) => void;
  resetFilters: () => void;
  setFilters: (filters: FilterState) => void;
  setFiltersHydrated: (hydrated: boolean) => void;

  // ═══ Actions de filtrage ═══
  filterListings: (
    listings: Listing[],
    mapBounds?: MapBounds | null
  ) => Listing[];

  // ═══ Reset ═══
  reset: () => void;
}

/**
 * Type combiné pour le store
 */
type FiltersStore = FiltersStoreState & FiltersActions;

/**
 * Filtres initiaux
 */
const INITIAL_FILTERS: FilterState = {
  product_type: [],
  certifications: [],
  purchase_mode: [],
  production_method: [],
  additional_services: [],
  availability: [],
  mapType: [],
};

/**
 * Fonction utilitaire pour vérifier si un listing est dans les bounds
 */
const isListingInBounds = (
  listing: Listing,
  bounds: MapBounds | null
): boolean => {
  if (!bounds) return true;

  const { lat, lng } = listing;
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    return false;
  }

  return (
    lat >= bounds.sw.lat &&
    lat <= bounds.ne.lat &&
    lng >= bounds.sw.lng &&
    lng <= bounds.ne.lng
  );
};

/**
 * Fonction principale de filtrage
 */
const applyFilters = (
  allListings: Listing[],
  filters: FilterState,
  mapBounds: MapBounds | null = null
): Listing[] => {
  if (!allListings || !Array.isArray(allListings)) return [];

  let filtered = allListings;

  // Filtrage géographique en premier
  if (mapBounds) {
    filtered = filtered.filter((listing) =>
      isListingInBounds(listing, mapBounds)
    );
  }

  // Vérifier s'il y a des filtres actifs
  const hasActiveFilters = Object.values(filters).some(
    (arr) => Array.isArray(arr) && arr.length > 0
  );

  // Appliquer les filtres métier si actifs
  if (hasActiveFilters) {
    filtered = filtered.filter((listing) =>
      Object.entries(filters).every(([key, values]) => {
        // Ignorer les filtres vides ou mapType
        if (
          !Array.isArray(values) ||
          values.length === 0 ||
          key === "mapType"
        ) {
          return true;
        }

        // Vérifier que la propriété existe sur le listing
        if (!(key in listing)) return false;

        const listingValue = (listing as any)[key];

        // Normaliser en array
        const listingValues = Array.isArray(listingValue)
          ? listingValue
          : listingValue
            ? [listingValue]
            : [];

        // Si pas de valeurs, exclure le listing
        if (listingValues.length === 0) return false;

        // Vérifier qu'au moins une valeur du filtre correspond
        return values.some((filterValue) =>
          listingValues.includes(filterValue)
        );
      })
    );
  }

  return filtered;
};

/**
 * Store spécialisé pour la gestion des filtres
 */
export const useFiltersStore = create<FiltersStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // ═══ État initial ═══
        filters: INITIAL_FILTERS,
        filtersHydrated: false,

        // ═══ Actions de base ═══
        toggleFilter: (filterKey, value) => {
          const state = get();
          const currentValues = (state.filters[filterKey] as string[]) ?? [];
          const isSelected = currentValues.includes(value);

          // Toggle la valeur
          const newValues = isSelected
            ? currentValues.filter((v) => v !== value)
            : [...currentValues, value];

          const newFilters = {
            ...state.filters,
            [filterKey]: newValues,
          };

          set({ filters: newFilters });

          // Déclencher un événement pour notifier les autres stores
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("filtersChanged", { detail: newFilters })
            );
          }
        },

        resetFilters: () => {
          set({ filters: INITIAL_FILTERS });

          // Notifier le reset
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("filtersChanged", { detail: INITIAL_FILTERS })
            );
          }
        },

        setFilters: (filters) => {
          const newFilters = { ...INITIAL_FILTERS, ...filters };
          set({ filters: newFilters });

          // Notifier le changement
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("filtersChanged", { detail: newFilters })
            );
          }
        },

        setFiltersHydrated: (filtersHydrated) => {
          set({ filtersHydrated });
        },

        // ═══ Actions de filtrage ═══
        filterListings: (listings, mapBounds = null) => {
          const state = get();
          return applyFilters(listings, state.filters, mapBounds);
        },

        // ═══ Reset ═══
        reset: () => {
          set({
            filters: INITIAL_FILTERS,
            filtersHydrated: false,
          });
        },
      }),
      {
        name: "farm2fork-filters",
        version: 1,
        partialize: (state) => ({
          filters: state.filters,
          filtersHydrated: state.filtersHydrated,
        }),
        onRehydrateStorage: () => (state) => {
          // Marquer comme hydraté après la restauration
          if (state) {
            state.setFiltersHydrated(true);
          }
        },
      }
    )
  )
);

// ═══ Selectors optimisés ═══

/**
 * Hook pour obtenir l'état complet des filtres
 */
export const useFiltersState = () =>
  useFiltersStore((state) => ({
    filters: state.filters,
    filtersHydrated: state.filtersHydrated,
  }));

/**
 * Hook pour obtenir les actions des filtres
 */
export const useFiltersActions = () =>
  useFiltersStore((state) => ({
    toggleFilter: state.toggleFilter,
    resetFilters: state.resetFilters,
    setFilters: state.setFilters,
    setFiltersHydrated: state.setFiltersHydrated,
    filterListings: state.filterListings,
    reset: state.reset,
  }));

/**
 * Selectors spécifiques
 */
export const useCurrentFilters = () =>
  useFiltersStore((state) => state.filters);
export const useAreFiltersHydrated = () =>
  useFiltersStore((state) => state.filtersHydrated);

/**
 * Hook pour vérifier si des filtres sont actifs
 */
export const useHasActiveFilters = () =>
  useFiltersStore((state) => {
    return Object.values(state.filters).some(
      (arr) => Array.isArray(arr) && arr.length > 0
    );
  });

/**
 * Hook pour obtenir le nombre total de filtres actifs
 */
export const useActiveFiltersCount = () =>
  useFiltersStore((state) => {
    return Object.values(state.filters).reduce((count, arr) => {
      return count + (Array.isArray(arr) ? arr.length : 0);
    }, 0);
  });

// ═══ Export du store brut pour compatibilité ═══
export default useFiltersStore;
