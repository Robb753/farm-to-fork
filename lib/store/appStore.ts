// lib/store/appStore.ts
import { create } from "zustand";
import {
  AppState,
  AppActions,
  FilterState,
  MapStateType,
  ListingsStateType,
  UserStateType,
} from "./types";

const INITIAL_FILTERS: FilterState = {
  product_type: [],
  certifications: [],
  purchase_mode: [],
  production_method: [],
  additional_services: [],
  availability: [],
  mapType: [],
};

const INITIAL_MAP: MapStateType = {
  coordinates: null,
  bounds: null,
  isApiLoaded: false,
  zoom: 12,
};

const INITIAL_LISTINGS: ListingsStateType = {
  all: [],
  visible: [],
  selectedId: null,
  hoveredId: null,
  isLoading: false,
  hasMore: true,
};

const INITIAL_USER: UserStateType = {
  profile: null,
  isLoading: false,
  error: null,
};

const INITIAL_STATE: AppState = {
  map: INITIAL_MAP,
  listings: INITIAL_LISTINGS,
  filters: INITIAL_FILTERS,
  user: INITIAL_USER,
};

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  ...INITIAL_STATE,

  // ==================== MAP ACTIONS ====================
  setCoordinates: (coords) =>
    set((state) => ({
      map: { ...state.map, coordinates: coords },
    })),

  setMapBounds: (bounds) =>
    set((state) => ({
      map: { ...state.map, bounds },
    })),

  setApiLoaded: (loaded) =>
    set((state) => ({
      map: { ...state.map, isApiLoaded: loaded },
    })),

  setZoom: (zoom) =>
    set((state) => ({
      map: { ...state.map, zoom },
    })),

  // ==================== LISTINGS ACTIONS ====================
  setAllListings: (listings) =>
    set(() => ({
      listings: {
        ...get().listings,
        all: listings,
        visible: listings,
      },
    })),

  setVisibleListings: (listings) =>
    set((state) => ({
      listings: { ...state.listings, visible: listings },
    })),

  setSelectedListing: (id) =>
    set((state) => ({
      listings: { ...state.listings, selectedId: id },
    })),

  setHoveredListing: (id) =>
    set((state) => ({
      listings: { ...state.listings, hoveredId: id },
    })),

  setListingsLoading: (loading) =>
    set((state) => ({
      listings: { ...state.listings, isLoading: loading },
    })),

  setHasMore: (hasMore) =>
    set((state) => ({
      listings: { ...state.listings, hasMore },
    })),

  addListings: (newListings) =>
    set((state) => ({
      listings: {
        ...state.listings,
        all: [...state.listings.all, ...newListings],
        visible: [...state.listings.visible, ...newListings],
      },
    })),

  // ==================== FILTERS ACTIONS ====================
  toggleFilter: (filterKey, value) =>
    set((state) => {
      const current = state.filters[filterKey];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      return {
        filters: {
          ...state.filters,
          [filterKey]: updated,
        },
      };
    }),

  resetFilters: () =>
    set(() => ({
      filters: INITIAL_FILTERS,
    })),

  setFilters: (filters) =>
    set(() => ({
      filters,
    })),

  // ==================== USER ACTIONS ====================
  setUserProfile: (profile) =>
    set(() => ({
      user: {
        ...get().user,
        profile,
      },
    })),

  setUserLoading: (loading) =>
    set((state) => ({
      user: { ...state.user, isLoading: loading },
    })),

  setUserError: (error) =>
    set((state) => ({
      user: { ...state.user, error },
    })),

  addFavorite: (listingId) =>
    set((state) => {
      if (!state.user.profile) return state;
      return {
        user: {
          ...state.user,
          profile: {
            ...state.user.profile,
            favorites: [...state.user.profile.favorites, listingId],
          },
        },
      };
    }),

  removeFavorite: (listingId) =>
    set((state) => {
      if (!state.user.profile) return state;
      return {
        user: {
          ...state.user,
          profile: {
            ...state.user.profile,
            favorites: state.user.profile.favorites.filter(
              (id) => id !== listingId
            ),
          },
        },
      };
    }),

  // ==================== UTILS ====================
  reset: () => set(INITIAL_STATE),
}));

// ==================== SELECTORS ====================
// ✅ Export des selectors pour optimiser les re-renders
// Utilise ces selectors dans tes composants pour éviter les re-renders inutiles

export const useMapState = () => useAppStore((state) => state.map);

export const useListingsState = () => useAppStore((state) => state.listings);

export const useFiltersState = () => useAppStore((state) => state.filters);

export const useUserState = () => useAppStore((state) => state.user);

// Selectors spécifiques
export const useCoordinates = () =>
  useAppStore((state) => state.map.coordinates);

export const useSelectedListing = () =>
  useAppStore((state) => state.listings.selectedId);

export const useUserFavorites = () =>
  useAppStore((state) => state.user.profile?.favorites ?? []);

export const useIsApiLoaded = () =>
  useAppStore((state) => state.map.isApiLoaded);
