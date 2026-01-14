// lib/store/index.ts
// Point d'entrée centralisé pour le store unifié + compat

// ==================== STORE UNIFIÉ ====================

export {
  useUnifiedStore,

  // Selectors
  useMapBounds,
  useMapCoordinates,
  useAllListings,
  useVisibleListings,
  useFilteredListings,
  useIsListingsLoading,
  useCurrentFilters,
  useHasActiveFilters,
  useIsMapExpanded,

  // Actions (groupées)
  useMapActions,
  useListingsActions,
  useFiltersActions,
  useUIActions,

  // Actions atomiques (stables)
  useSetMapCoordinates,
  useSetMapBounds,
  useSetMapZoom,
  // (si tu l’ajoutes dans unifiedStore)
  // useSetMapApiLoaded,
} from "./unifiedStore";

// ✅ Export des types du store unifié (inclure FilterState ici)
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
  FilterState,
  MapBounds,
  MapCoordinates,
  Listing,
} from "./unifiedStore";

// ==================== IMPORTS INTERNES (compat hooks) ====================

import { useUnifiedStore } from "./unifiedStore";
import {
  useAllListings,
  useFilteredListings,
  useVisibleListings,
  useIsListingsLoading,
  useMapBounds,
  useMapCoordinates,
} from "./unifiedStore";

import type { Listing, MapBounds, MapCoordinates } from "./unifiedStore";

// ✅ Alias type LatLng (compat)
export type LatLng = MapCoordinates;

// ==================== HOOKS COMPAT (Explore.tsx etc.) ====================

export const useListingsState = () => ({
  all: useAllListings(),
  filtered: useFilteredListings(),
  visible: useVisibleListings(),
  isLoading: useIsListingsLoading(),
  hasMore: useUnifiedStore((s) => s.listings.hasMore),
  page: useUnifiedStore((s) => s.listings.page),
  totalCount: useUnifiedStore((s) => s.listings.all.length),
  error: useUnifiedStore((s) => s.listings.error),
});

export const useMapState = () => ({
  coordinates: useMapCoordinates(),
  bounds: useMapBounds(),
  zoom: useUnifiedStore((s) => s.map.zoom),
  mapInstance: useUnifiedStore((s) => s.map.instance),
  isLoading: useUnifiedStore((s) => s.map.isLoading),
  isApiLoaded: useUnifiedStore((s) => s.map.isApiLoaded), // ✅
  error: useUnifiedStore((s) => s.map.error),
});

// ==================== ALIAS DE COMPATIBILITÉ ====================

/**
 * @deprecated Utiliser useCurrentFilters() / useUnifiedStore((s)=>s.filters.current)
 */
export const useFiltersStoreState = () => ({
  filters: useUnifiedStore((s) => s.filters.current),
});

/**
 * @deprecated Utiliser useUIActions() / selectors dédiés
 */
export const useUIState = () => ({
  isMapExpanded: useUnifiedStore((s) => s.ui.isMapExpanded),
  isMobile: useUnifiedStore((s) => s.ui.isMobile),
  isTablet: useUnifiedStore((s) => s.ui.isTablet),
  isDesktop: useUnifiedStore((s) => s.ui.isDesktop),
  isFiltersModalOpen: useUnifiedStore((s) => s.ui.isFiltersModalOpen),
});

/**
 * @deprecated Utiliser useUnifiedStore((s)=>s.interactions)
 */
export const useInteractionsState = () => ({
  hoveredListingId: useUnifiedStore((s) => s.interactions.hoveredListingId),
  selectedListingId: useUnifiedStore((s) => s.interactions.selectedListingId),
  infoWindowOpen: useUnifiedStore((s) => s.interactions.infoWindowOpen),
});

/**
 * @deprecated Utiliser useFiltersActions()
 */
export const useFiltersStoreActions = () =>
  useUnifiedStore((s) => s.filtersActions);

/**
 * @deprecated Utiliser useMapState()
 */
export const useMapStoreState = () => ({
  coordinates: useUnifiedStore((s) => s.map.coordinates),
  bounds: useUnifiedStore((s) => s.map.bounds),
  zoom: useUnifiedStore((s) => s.map.zoom),
  isLoading: useUnifiedStore((s) => s.map.isLoading),
  isApiLoaded: useUnifiedStore((s) => s.map.isApiLoaded),
  error: useUnifiedStore((s) => s.map.error),
});

/**
 * @deprecated Utiliser useMapActions()
 */
export const useMapStoreActions = () => useUnifiedStore((s) => s.mapActions);

/**
 * @deprecated Utiliser useListingsState()
 */
export const useListingsStoreState = () => ({
  all: useUnifiedStore((s) => s.listings.all),
  visible: useUnifiedStore((s) => s.listings.visible),
  filtered: useUnifiedStore((s) => s.listings.filtered),
  isLoading: useUnifiedStore((s) => s.listings.isLoading),
  error: useUnifiedStore((s) => s.listings.error),
});

/**
 * @deprecated Utiliser useListingsActions()
 */
export const useListingsStoreActions = () =>
  useUnifiedStore((s) => s.listingsActions);

/**
 * @deprecated Utiliser useUnifiedStore((s)=>s.interactionsActions)
 */
export const useInteractionsActions = () =>
  useUnifiedStore((s) => s.interactionsActions);

// ==================== STORES INDÉPENDANTS ====================

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

export {
  useSettingsStore,
  useCurrentLanguage,
  useTranslation,
  useLanguageActions,
} from "./settingsStore";

// ==================== TYPE GUARDS ====================

export const isListingValid = (obj: unknown): obj is Listing => {
  const o = obj as any;
  return (
    !!o &&
    typeof o === "object" &&
    typeof o.id === "number" &&
    typeof o.name === "string" &&
    typeof o.address === "string" &&
    typeof o.lat === "number" &&
    typeof o.lng === "number"
  );
};

export const isMapBoundsValid = (obj: unknown): obj is MapBounds => {
  const o = obj as any;
  return (
    !!o &&
    typeof o === "object" &&
    typeof o.north === "number" &&
    typeof o.south === "number" &&
    typeof o.east === "number" &&
    typeof o.west === "number"
  );
};

// Export par défaut (optionnel, tu peux le supprimer si inutile)
export default { isListingValid, isMapBoundsValid };
