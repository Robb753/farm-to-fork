// lib/store/index.ts - Version finale avec alias de compatibilité
// Point d'entrée unifié pour tous les stores modulaires

// ==================== EXPORTS DES STORES ====================

// Store de la carte (mapStore.ts)
export {
  useMapStore,
  useMapState,
  useMapActions,
  useMapCoordinates,
  useMapBounds,
  useMapZoom,
  useMapInstance,
  useIsMapApiLoaded,
  useIsMapApiLoading,
} from "./mapStore";

// Store des listings et interactions (listingsStore.ts)
export {
  useListingsStore,
  useListingsState,
  useInteractionsState,
  useListingsActions,
  useAllListings,
  useVisibleListings,
  useFilteredListings,
  useIsListingsLoading,
  useListingsPage,
  useHasMoreListings,
  useSelectedListing,
  useHoveredListing,
} from "./listingsStore";

// ✅ Helper pour interactions
export const useInteractionsActions = () => {
  const {
    setHoveredListingId,
    setSelectedListingId,
    setOpenInfoWindowId,
    clearSelection,
  } = useListingsActions();

  return {
    setHoveredListingId,
    setSelectedListingId,
    setOpenInfoWindowId,
    clearSelection,
  };
};

// Store des filtres (filtersStore.ts) avec TOUS les alias de compatibilité
export {
  useFiltersStore,
  useFiltersState,
  useFiltersActions,
  useCurrentFilters,
  useAreFiltersHydrated,
  useHasActiveFilters,
  useActiveFiltersCount,
} from "./filtersStore";

// ✅ ALIAS DE COMPATIBILITÉ pour les composants existants
import { useFiltersState, useFiltersActions } from "./filtersStore";

// Alias pour les noms utilisés dans les composants existants
export const useFiltersStoreState = useFiltersState;
export const useFiltersStoreActions = useFiltersActions;

// Store de l'interface utilisateur (uiStore.ts)
export {
  useUIStore,
  useUIState,
  useUIActions,
  useIsMapExpanded,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useDeviceType,
  useNotifications,
  useHasUnreadNotifications,
  useResponsiveDetection,
} from "./uiStore";

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

// ==================== EXPORTS DES TYPES ====================

// Types depuis les stores (exports locaux)
export type { LatLng, MapBounds, Listing, ListingImage } from "./listingsStore";

// Types depuis les stores avec types locaux
export type { UserProfile, Role } from "./userStore";

// ✅ Type FilterState défini localement pour éviter les imports
export interface FilterState {
  product_type: string[];
  certifications: string[];
  purchase_mode: string[];
  production_method: string[];
  additional_services: string[];
  availability: string[];
  mapType: string[];
}

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
    obj.ne &&
    obj.sw &&
    typeof obj.ne.lat === "number" &&
    typeof obj.ne.lng === "number" &&
    typeof obj.sw.lat === "number" &&
    typeof obj.sw.lng === "number"
  );
};

// Import pour éviter erreur de référence sur les types
import { useListingsActions, type Listing, type MapBounds } from "./listingsStore";

// Export par défaut
const storeIndex = {
  isListingValid,
  isMapBoundsValid,
};

export default storeIndex;
