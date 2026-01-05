// lib/store/index.ts - VERSION MIGRÉE VERS STORE UNIFIÉ
// Point d'entrée centralisé pour le store unifié

// ==================== STORE UNIFIÉ ====================

// ✅ Export du store unifié et tous ses hooks
export {
  useUnifiedStore,
  useMapBounds,
  useMapCoordinates,
  useAllListings,
  useVisibleListings,
  useFilteredListings,
  useIsListingsLoading,
  useCurrentFilters,
  useHasActiveFilters,
  useIsMapExpanded,
  useMapActions,
  useListingsActions,
  useFiltersActions,
  useUIActions,
} from "./unifiedStore";

// ✅ Export des types du store unifié
export type {
  UnifiedStore,
  MapState,
  ListingsState,
  FiltersState,
  InteractionsState,
  UIState,
  MapActions,
  ListingsActions,
  FiltersActions,
  InteractionsActions,
  UIActions,
  MapBounds,
  MapCoordinates,
  Listing,
} from "./unifiedStore";

// ==================== ALIAS DE COMPATIBILITÉ ====================
// Pour les composants qui n'ont pas encore été migrés

import {
  useUnifiedStore,
  useCurrentFilters,
  useFiltersActions,
  type FilterState,
  type Listing,
  type MapBounds,
} from "./unifiedStore";

/**
 * @deprecated Utiliser useUnifiedStore((state) => state.filters.current)
 * Alias de compatibilité pour les anciens composants
 */
export const useFiltersStoreState = () => {
  const filters = useCurrentFilters();
  return { filters };
};

/**
 * @deprecated Utiliser useFiltersActions() depuis unifiedStore
 * Alias de compatibilité pour les anciens composants
 */
export const useFiltersStoreActions = useFiltersActions;

/**
 * @deprecated Utiliser useUnifiedStore((state) => state.map)
 * Alias de compatibilité pour les anciens composants
 */
export const useMapStoreState = () => {
  const coordinates = useUnifiedStore((state) => state.map.coordinates);
  const bounds = useUnifiedStore((state) => state.map.bounds);
  const zoom = useUnifiedStore((state) => state.map.zoom);
  const isLoading = useUnifiedStore((state) => state.map.isLoading);
  const error = useUnifiedStore((state) => state.map.error);

  return { coordinates, bounds, zoom, isLoading, error };
};

/**
 * @deprecated Utiliser useMapActions() depuis unifiedStore
 */
export const useMapStoreActions = () => {
  return useUnifiedStore((state) => state.mapActions);
};

/**
 * @deprecated Utiliser useUnifiedStore((state) => state.listings)
 */
export const useListingsStoreState = () => {
  const all = useUnifiedStore((state) => state.listings.all);
  const visible = useUnifiedStore((state) => state.listings.visible);
  const filtered = useUnifiedStore((state) => state.listings.filtered);
  const isLoading = useUnifiedStore((state) => state.listings.isLoading);
  const error = useUnifiedStore((state) => state.listings.error);

  return { all, visible, filtered, isLoading, error };
};

/**
 * @deprecated Utiliser useListingsActions() depuis unifiedStore
 */
export const useListingsStoreActions = () => {
  return useUnifiedStore((state) => state.listingsActions);
};

/**
 * @deprecated Utiliser useUnifiedStore((state) => state.interactions)
 */
export const useInteractionsActions = () => {
  return useUnifiedStore((state) => state.interactionsActions);
};

// ==================== STORES INDÉPENDANTS ====================
// Ces stores ne font PAS partie du store unifié

// Store utilisateur (userStore.ts)
export {
  useUserStore,
  useUserProfile,
  useUserRole,
  useIsFarmer,
  useIsUser,
  useUserSyncState,
  useUserFavorites,
  useUserActions,
  useIsFavorite,
} from "./userStore";

// Store des paramètres (settingsStore.ts)
export {
  useSettingsStore,
  useCurrentLanguage,
  useTranslation,
  useLanguageActions,
} from "./settingsStore";

// ==================== RE-EXPORT DU TYPE FilterState ====================
// Pour compatibilité avec les composants existants
export type { FilterState };

// ==================== TYPE GUARDS ====================

/**
 * Type guard pour vérifier si un objet est un Listing valide
 */
export const isListingValid = (obj: any): obj is Listing => {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "number" &&
    typeof obj.name === "string" &&
    typeof obj.address === "string" &&
    typeof obj.lat === "number" &&
    typeof obj.lng === "number"
  );
};

/**
 * Type guard pour vérifier si un objet est des MapBounds valides
 */
export const isMapBoundsValid = (obj: any): obj is MapBounds => {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.north === "number" &&
    typeof obj.south === "number" &&
    typeof obj.east === "number" &&
    typeof obj.west === "number"
  );
};

// Export par défaut
const storeIndex = {
  isListingValid,
  isMapBoundsValid,
};

export default storeIndex;
