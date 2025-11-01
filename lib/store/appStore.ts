import { create } from "zustand";
import { persist, subscribeWithSelector, devtools } from "zustand/middleware";
import { supabase } from "@/utils/supabase/client";
// Imports des types centralisés
import type {
  LatLng,
  MapBounds,
  Listing,
  FilterState,
  UserProfile,
  Role,
} from "./types";

// ==================== TYPES ====================

export interface UserState {
  profile: UserProfile | null;
  role: Role;
  isLoading: boolean;
  isSyncing: boolean;
  isReady: boolean;
  isWaitingForProfile: boolean;
  syncError: string | null;
  error: string | null;
}

export interface MapState {
  coordinates: LatLng | null;
  bounds: MapBounds | null;
  isApiLoaded: boolean;
  isApiLoading: boolean;
  zoom: number;
  mapInstance: any;
}

export interface ListingsState {
  all: Listing[];
  visible: Listing[];
  filtered: Listing[];
  selectedId: number | null;
  hoveredId: number | null;
  openInfoWindowId: number | null;
  isLoading: boolean;
  hasMore: boolean;
}

export interface AppSettings {
  language: "fr" | "en";
  theme: "light" | "dark";
}

export interface Farm2ForkState {
  // États
  map: MapState;
  listings: ListingsState;
  filters: FilterState;
  user: UserState;
  settings: AppSettings;

  // Actions Map
  setCoordinates: (coords: LatLng | null) => void;
  setMapBounds: (bounds: MapBounds | null) => void;
  setApiLoaded: (loaded: boolean) => void;
  setApiLoading: (loading: boolean) => void;
  setZoom: (zoom: number) => void;
  setMapInstance: (instance: any) => void;

  // Actions Listings
  setAllListings: (listings: Listing[]) => void;
  setVisibleListings: (listings: Listing[]) => void;
  setFilteredListings: (listings: Listing[]) => void;
  setSelectedListing: (id: number | null) => void;
  setHoveredListing: (id: number | null) => void;
  setOpenInfoWindow: (id: number | null) => void;
  setListingsLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  addListings: (listings: Listing[]) => void;
  clearSelection: () => void;
  selectListing: (id: number) => void;

  // Actions Filters
  toggleFilter: (filterKey: keyof FilterState, value: string) => void;
  resetFilters: () => void;
  setFilters: (filters: FilterState) => void;

  // Actions User
  setUserProfile: (profile: UserProfile | null) => void;
  setUserRole: (role: UserState["role"]) => void;
  setUserLoading: (loading: boolean) => void;
  setUserSyncing: (syncing: boolean) => void;
  setUserReady: (ready: boolean) => void;
  setWaitingForProfile: (waiting: boolean) => void;
  setSyncError: (error: string | null) => void;
  setUserError: (error: string | null) => void;
  addFavorite: (listingId: number) => void;
  removeFavorite: (listingId: number) => void;
  resyncUserRole: () => Promise<void>;

  // Actions Settings
  setLanguage: (language: "fr" | "en") => void;
  setTheme: (theme: "light" | "dark") => void;

  // Actions métier
  fetchListings: (options?: {
    page?: number;
    append?: boolean;
    forceRefresh?: boolean;
  }) => Promise<Listing[]>;

  filterListings: () => void;

  filterListingsInner: (listings: Listing[], filters: FilterState) => Listing[];

  // Utils
  reset: () => void;
}

// ==================== VALEURS INITIALES ====================
const INITIAL_FILTERS: FilterState = {
  product_type: [],
  certifications: [],
  purchase_mode: [],
  production_method: [],
  additional_services: [],
  availability: [],
  mapType: [],
};

const INITIAL_MAP: MapState = {
  coordinates: null,
  bounds: null,
  isApiLoaded: false,
  isApiLoading: false,
  zoom: 12,
  mapInstance: null,
};

const INITIAL_LISTINGS: ListingsState = {
  all: [],
  visible: [],
  filtered: [],
  selectedId: null,
  hoveredId: null,
  openInfoWindowId: null,
  isLoading: false,
  hasMore: true,
};

const INITIAL_USER: UserState = {
  profile: null,
  role: null,
  isLoading: false,
  isSyncing: false,
  isReady: false,
  isWaitingForProfile: false,
  syncError: null,
  error: null,
};

const INITIAL_SETTINGS: AppSettings = {
  language: "fr",
  theme: "light",
};

// ==================== STORE PRINCIPAL ====================
export const useFarm2ForkStore = create<Farm2ForkState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          // États initiaux
          map: INITIAL_MAP,
          listings: INITIAL_LISTINGS,
          filters: INITIAL_FILTERS,
          user: INITIAL_USER,
          settings: INITIAL_SETTINGS,

          // ==================== ACTIONS MAP ====================
          setCoordinates: (coords) =>
            set(
              (state) => ({
                map: { ...state.map, coordinates: coords },
              }),
              false,
              "map/setCoordinates"
            ),

          setMapBounds: (bounds) =>
            set(
              (state) => ({
                map: { ...state.map, bounds },
              }),
              false,
              "map/setMapBounds"
            ),

          setApiLoaded: (loaded) =>
            set(
              (state) => ({
                map: { ...state.map, isApiLoaded: loaded },
              }),
              false,
              "map/setApiLoaded"
            ),

          setApiLoading: (loading) =>
            set(
              (state) => ({
                map: { ...state.map, isApiLoading: loading },
              }),
              false,
              "map/setApiLoading"
            ),

          setZoom: (zoom) =>
            set(
              (state) => ({
                map: { ...state.map, zoom },
              }),
              false,
              "map/setZoom"
            ),

          setMapInstance: (instance) =>
            set(
              (state) => ({
                map: { ...state.map, mapInstance: instance },
              }),
              false,
              "map/setMapInstance"
            ),

          // ==================== ACTIONS LISTINGS ====================
          setAllListings: (listings) =>
            set(
              (state) => ({
                listings: {
                  ...state.listings,
                  all: listings,
                },
              }),
              false,
              "listings/setAllListings"
            ),

          setVisibleListings: (listings) =>
            set(
              (state) => ({
                listings: { ...state.listings, visible: listings },
              }),
              false,
              "listings/setVisibleListings"
            ),

          setFilteredListings: (listings) =>
            set(
              (state) => ({
                listings: { ...state.listings, filtered: listings },
              }),
              false,
              "listings/setFilteredListings"
            ),

          setSelectedListing: (id) =>
            set(
              (state) => ({
                listings: { ...state.listings, selectedId: id },
              }),
              false,
              "listings/setSelectedListing"
            ),

          setHoveredListing: (id) =>
            set(
              (state) => ({
                listings: { ...state.listings, hoveredId: id },
              }),
              false,
              "listings/setHoveredListing"
            ),

          setOpenInfoWindow: (id) =>
            set(
              (state) => ({
                listings: { ...state.listings, openInfoWindowId: id },
              }),
              false,
              "listings/setOpenInfoWindow"
            ),

          setListingsLoading: (loading) =>
            set(
              (state) => ({
                listings: { ...state.listings, isLoading: loading },
              }),
              false,
              "listings/setListingsLoading"
            ),

          setHasMore: (hasMore) =>
            set(
              (state) => ({
                listings: { ...state.listings, hasMore },
              }),
              false,
              "listings/setHasMore"
            ),

          addListings: (newListings) =>
            set(
              (state) => ({
                listings: {
                  ...state.listings,
                  all: [...state.listings.all, ...newListings],
                },
              }),
              false,
              "listings/addListings"
            ),

          clearSelection: () =>
            set(
              (state) => ({
                listings: {
                  ...state.listings,
                  selectedId: null,
                  openInfoWindowId: null,
                },
              }),
              false,
              "listings/clearSelection"
            ),

          selectListing: (id) => {
            set(
              (state) => ({
                listings: {
                  ...state.listings,
                  selectedId: id,
                  openInfoWindowId: id,
                },
              }),
              false,
              "listings/selectListing"
            );

            // Scroll vers l'élément
            requestAnimationFrame(() => {
              const el = document.getElementById(`listing-${id}`);
              if (el)
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            });
          },

          // ==================== ACTIONS FILTERS ====================
          toggleFilter: (filterKey, value) =>
            set(
              (state) => {
                const current = state.filters[filterKey];
                const updated = current.includes(value)
                  ? current.filter((v) => v !== value)
                  : [...current, value];

                const newFilters = {
                  ...state.filters,
                  [filterKey]: updated,
                };

                // Appliquer automatiquement les filtres
                const filtered = get().filterListingsInner(
                  state.listings.all,
                  newFilters
                );

                return {
                  filters: newFilters,
                  listings: {
                    ...state.listings,
                    filtered,
                    visible: filtered,
                  },
                };
              },
              false,
              "filters/toggleFilter"
            ),

          resetFilters: () =>
            set(
              (state) => ({
                filters: INITIAL_FILTERS,
                listings: {
                  ...state.listings,
                  filtered: state.listings.all,
                  visible: state.listings.all,
                },
              }),
              false,
              "filters/resetFilters"
            ),

          setFilters: (filters) =>
            set(
              (state) => {
                const filtered = get().filterListingsInner(
                  state.listings.all,
                  filters
                );
                return {
                  filters,
                  listings: {
                    ...state.listings,
                    filtered,
                    visible: filtered,
                  },
                };
              },
              false,
              "filters/setFilters"
            ),

          // ==================== ACTIONS USER ====================
          setUserProfile: (profile) =>
            set(
              (state) => ({
                user: { ...state.user, profile },
              }),
              false,
              "user/setUserProfile"
            ),

          setUserRole: (role) =>
            set(
              (state) => ({
                user: { ...state.user, role },
              }),
              false,
              "user/setUserRole"
            ),

          setUserLoading: (loading) =>
            set(
              (state) => ({
                user: { ...state.user, isLoading: loading },
              }),
              false,
              "user/setUserLoading"
            ),

          setUserSyncing: (syncing) =>
            set(
              (state) => ({
                user: { ...state.user, isSyncing: syncing },
              }),
              false,
              "user/setUserSyncing"
            ),

          setUserReady: (ready) =>
            set(
              (state) => ({
                user: { ...state.user, isReady: ready },
              }),
              false,
              "user/setUserReady"
            ),

          setWaitingForProfile: (waiting) =>
            set(
              (state) => ({
                user: { ...state.user, isWaitingForProfile: waiting },
              }),
              false,
              "user/setWaitingForProfile"
            ),

          setSyncError: (error) =>
            set(
              (state) => ({
                user: { ...state.user, syncError: error },
              }),
              false,
              "user/setSyncError"
            ),

          setUserError: (error) =>
            set(
              (state) => ({
                user: { ...state.user, error },
              }),
              false,
              "user/setUserError"
            ),

          addFavorite: (listingId) =>
            set(
              (state) => {
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
              },
              false,
              "user/addFavorite"
            ),

          removeFavorite: (listingId) =>
            set(
              (state) => {
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
              },
              false,
              "user/removeFavorite"
            ),

          resyncUserRole: async () => {
            // Implémenter la logique de re-sync ici
            // Cette fonction sera appelée depuis les composants
            console.log("Resync user role - à implémenter");
          },

          // ==================== ACTIONS SETTINGS ====================
          setLanguage: (language) =>
            set(
              (state) => ({
                settings: { ...state.settings, language },
              }),
              false,
              "settings/setLanguage"
            ),

          setTheme: (theme) =>
            set(
              (state) => ({
                settings: { ...state.settings, theme },
              }),
              false,
              "settings/setTheme"
            ),

          // ==================== ACTIONS MÉTIER ====================
          fetchListings: async ({
            page = 1,
            append = false,
            forceRefresh = false,
          } = {}) => {
            const state = get();

            if (state.listings.isLoading && !forceRefresh)
              return state.listings.all;

            get().setListingsLoading(true);

            try {
              let query = supabase
                .from("listing")
                .select("*, listingImages(url, listing_id)")
                .eq("active", true)
                .order("id", { ascending: false })
                .range((page - 1) * 10, page * 10 - 1);

              // Appliquer les filtres actifs
              const activeFilters = Object.keys(state.filters)
                .filter(
                  (k) => state.filters[k as keyof FilterState]?.length > 0
                )
                .map(
                  (k) =>
                    `${k}.cs.{${state.filters[k as keyof FilterState].join(",")}}`
                )
                .join(",");

              if (activeFilters) query = query.or(activeFilters);

              const { data, error } = await query;

              if (error) throw error;

              const newData = append ? [...state.listings.all, ...data] : data;

              get().setAllListings(newData);
              get().setHasMore(data && data.length > 0);
              get().filterListings();

              return newData;
            } catch (error) {
              console.error("Error fetching listings:", error);
              return state.listings.all;
            } finally {
              get().setListingsLoading(false);
            }
          },

          filterListings: () => {
            const state = get();
            const filtered = get().filterListingsInner(
              state.listings.all,
              state.filters
            );
            get().setFilteredListings(filtered);
            get().setVisibleListings(filtered);
          },

          // Fonction helper pour filtrer
          filterListingsInner: (listings: Listing[], filters: FilterState) => {
            const hasActive = Object.values(filters).some(
              (arr) => arr.length > 0
            );
            if (!hasActive) return listings;

            return listings.filter((listing) =>
              Object.entries(filters).every(([key, values]) => {
                if (values.length === 0) return true;
                const listingValues = Array.isArray(
                  listing[key as keyof Listing]
                )
                  ? (listing[key as keyof Listing] as string[])
                  : [listing[key as keyof Listing]];
                return values.some((v) => listingValues.includes(v));
              })
            );
          },

          // ==================== UTILS ====================
          reset: () =>
            set(
              {
                map: INITIAL_MAP,
                listings: INITIAL_LISTINGS,
                filters: INITIAL_FILTERS,
                user: INITIAL_USER,
                settings: INITIAL_SETTINGS,
              },
              false,
              "reset"
            ),
        }),
        {
          name: "farm2fork-storage",
          partialize: (state) => ({
            settings: state.settings,
            user: {
              profile: state.user.profile,
              role: state.user.role,
            },
            filters: state.filters,
            map: {
              coordinates: state.map.coordinates,
              zoom: state.map.zoom,
            },
          }),
        }
      )
    ),
    { name: "Farm2Fork Store" }
  )
);

// ==================== SELECTORS ====================
// Optimise les re-renders en utilisant ces selectors dans tes composants

export const useMapState = () => useFarm2ForkStore((state) => state.map);
export const useListingsState = () =>
  useFarm2ForkStore((state) => state.listings);
export const useFiltersState = () =>
  useFarm2ForkStore((state) => state.filters);
export const useUserState = () => useFarm2ForkStore((state) => state.user);
export const useSettingsState = () =>
  useFarm2ForkStore((state) => state.settings);

// Selectors spécifiques
export const useCoordinates = () =>
  useFarm2ForkStore((state) => state.map.coordinates);
export const useSelectedListing = () =>
  useFarm2ForkStore((state) => state.listings.selectedId);
export const useUserFavorites = () =>
  useFarm2ForkStore((state) => state.user.profile?.favorites ?? []);
export const useIsApiLoaded = () =>
  useFarm2ForkStore((state) => state.map.isApiLoaded);
export const useCurrentLanguage = () =>
  useFarm2ForkStore((state) => state.settings.language);
export const useUserRole = () => useFarm2ForkStore((state) => state.user.role);
export const useIsFarmer = () =>
  useFarm2ForkStore((state) => state.user.role === "farmer");

// Actions selectors
export const useMapActions = () =>
  useFarm2ForkStore((state) => ({
    setCoordinates: state.setCoordinates,
    setMapBounds: state.setMapBounds,
    setApiLoaded: state.setApiLoaded,
    setZoom: state.setZoom,
  }));

export const useListingsActions = () =>
  useFarm2ForkStore((state) => ({
    setAllListings: state.setAllListings,
    setSelectedListing: state.setSelectedListing,
    setHoveredListing: state.setHoveredListing,
    selectListing: state.selectListing,
    clearSelection: state.clearSelection,
    fetchListings: state.fetchListings,
  }));

export const useFiltersActions = () =>
  useFarm2ForkStore((state) => ({
    toggleFilter: state.toggleFilter,
    resetFilters: state.resetFilters,
    setFilters: state.setFilters,
  }));

export const useUserActions = () =>
  useFarm2ForkStore((state) => ({
    setUserProfile: state.setUserProfile,
    setUserRole: state.setUserRole,
    addFavorite: state.addFavorite,
    removeFavorite: state.removeFavorite,
    resyncUserRole: state.resyncUserRole,
  }));
