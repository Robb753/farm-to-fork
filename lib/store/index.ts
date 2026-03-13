// lib/store/index.ts
// Point d'entrée centralisé pour le store unifié

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
  FilterState,
  MapBounds,
  MapCoordinates,
  Listing,
} from "./unifiedStore";

// ✅ Import local des types et de la valeur useUnifiedStore (pour les sélecteurs ci-dessous)
import { useUnifiedStore as _useUnifiedStore } from "./unifiedStore";
import type { MapCoordinates, MapBounds, Listing } from "./unifiedStore";

// ==================== SÉLECTEURS INTERACTIONS ====================

// Utilisés par MapboxClusterLayer (hover sync) et FarmSelectedPanel (Stage 4)
export const useSelectedListingId = () =>
  _useUnifiedStore((s) => s.interactions.selectedListingId);

export const useHoveredListingId = () =>
  _useUnifiedStore((s) => s.interactions.hoveredListingId);

export const useInteractionsActions = () =>
  _useUnifiedStore((s) => s.interactionsActions);

// Alias type LatLng (utilisé dans quelques composants externes)
export type LatLng = MapCoordinates;

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
  const o = obj as Record<string, unknown>;
  return (
    !!o &&
    typeof o.id === "number" &&
    typeof o.name === "string" &&
    typeof o.address === "string" &&
    typeof o.lat === "number" &&
    typeof o.lng === "number"
  );
};

export const isMapBoundsValid = (obj: unknown): obj is MapBounds => {
  const o = obj as Record<string, unknown>;
  return (
    !!o &&
    typeof o.north === "number" &&
    typeof o.south === "number" &&
    typeof o.east === "number" &&
    typeof o.west === "number"
  );
};

// Export par défaut (optionnel, tu peux le supprimer si inutile)
export default { isListingValid, isMapBoundsValid };
