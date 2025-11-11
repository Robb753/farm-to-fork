// lib/store/migratedStore.ts - Version simplifiée et robuste
import { create } from "zustand";
import { persist, subscribeWithSelector, devtools } from "zustand/middleware";
import { supabase } from "@/utils/supabase/client";
import type { LatLng, MapBounds, Listing, FilterState } from "./types";

interface Farm2ForkStore {
  map: {
    coordinates: LatLng | null;
    bounds: MapBounds | null;
    zoom: number;
    mapInstance: any;
    isApiLoaded: boolean;
    isApiLoading: boolean;
  };

  listings: {
    all: Listing[];
    visible: Listing[];
    filtered: Listing[];
    isLoading: boolean;
    hasMore: boolean;
    page: number;
    totalCount: number;
  };

  interactions: {
    hoveredListingId: number | null;
    selectedListingId: number | null;
    openInfoWindowId: number | null;
  };

  filters: FilterState;
  filtersHydrated: boolean;

  ui: {
    isMapExpanded: boolean;
  };

  // Actions
  setCoordinates: (coords: LatLng | null) => void;
  setMapBounds: (bounds: MapBounds | null) => void;
  setZoom: (zoom: number) => void;
  setMapInstance: (instance: any) => void;
  setApiLoaded: (loaded: boolean) => void;
  setApiLoading: (loading: boolean) => void;
  setAllListings: (listings: Listing[]) => void;
  setVisibleListings: (listings: Listing[]) => void;
  setFilteredListings: (listings: Listing[]) => void;
  setListingsLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;
  addListings: (listings: Listing[]) => void;
  resetListings: () => void;
  fetchListings: (options?: {
    page?: number;
    append?: boolean;
    forceRefresh?: boolean;
    bounds?: MapBounds | number[] | null;
    bbox?: number[] | null;
  }) => Promise<Listing[]>;
  setHoveredListingId: (id: number | null) => void;
  setSelectedListingId: (id: number | null) => void;
  setOpenInfoWindowId: (id: number | null) => void;
  clearSelection: () => void;
  toggleFilter: (filterKey: keyof FilterState, value: string) => void;
  resetFilters: () => void;
  setFilters: (filters: FilterState) => void;
  setFiltersHydrated: (hydrated: boolean) => void;
  setMapExpanded: (expanded: boolean) => void;
  updateMapBoundsAndFilter: (bounds: MapBounds | null) => void;
  loadMoreListings: () => Promise<void>;
  cleanupPagination: () => void;
  filterListings: () => void;
  reset: () => void;
}

import { filterSections, MAPBOX_CONFIG } from "@/lib/config";
export { filterSections, MAPBOX_CONFIG };

const initialFilters: FilterState = {
  product_type: [],
  certifications: [],
  purchase_mode: [],
  production_method: [],
  additional_services: [],
  availability: [],
  mapType: [],
};

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

const filterListings = (
  allListings: Listing[],
  filters: FilterState,
  mapBounds: MapBounds | null = null
): Listing[] => {
  if (!allListings || !Array.isArray(allListings)) return [];

  let filtered = allListings;

  if (mapBounds) {
    filtered = filtered.filter((listing) =>
      isListingInBounds(listing, mapBounds)
    );
  }

  const hasActiveFilters = Object.values(filters).some(
    (arr) => Array.isArray(arr) && arr.length > 0
  );

  if (hasActiveFilters) {
    filtered = filtered.filter((listing) =>
      Object.entries(filters).every(([key, values]) => {
        if (!Array.isArray(values) || values.length === 0 || key === "mapType")
          return true;
        if (!(key in listing)) return false;

        const listingValue = (listing as any)[key];
        const listingValues = Array.isArray(listingValue)
          ? listingValue
          : listingValue
            ? [listingValue]
            : [];

        if (listingValues.length === 0) return false;
        return values.some((v) => listingValues.includes(v));
      })
    );
  }

  return filtered;
};

const toArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === "string" && v.trim().length > 0) return [v];
  return [];
};

const normalizeListing = (row: any): Listing => ({
  ...row,
  lat: typeof row.lat === "number" ? row.lat : Number(row.lat),
  lng: typeof row.lng === "number" ? row.lng : Number(row.lng),
  product_type: toArray(row.product_type),
  certifications: toArray(row.certifications),
  purchase_mode: toArray(row.purchase_mode),
  production_method: toArray(row.production_method),
  additional_services: toArray(row.additional_services),
  availability: toArray(row.availability),
  listingImages: Array.isArray(row.listingImages) ? row.listingImages : [],
});

export const useFarm2ForkStore = create<Farm2ForkStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          map: {
            coordinates: null,
            bounds: null,
            zoom: 12,
            mapInstance: null,
            isApiLoaded: false,
            isApiLoading: false,
          },

          listings: {
            all: [],
            visible: [],
            filtered: [],
            isLoading: false,
            hasMore: true,
            page: 1,
            totalCount: 0,
          },

          interactions: {
            hoveredListingId: null,
            selectedListingId: null,
            openInfoWindowId: null,
          },

          filters: initialFilters,
          filtersHydrated: false,

          ui: {
            isMapExpanded: false,
          },

          // Actions simples
          setCoordinates: (coords) =>
            set((state) => ({ map: { ...state.map, coordinates: coords } })),
          setMapBounds: (bounds) => {
            set((state) => ({ map: { ...state.map, bounds } }));
            setTimeout(() => get().filterListings(), 0);
          },
          setZoom: (zoom) => set((state) => ({ map: { ...state.map, zoom } })),
          setMapInstance: (instance) =>
            set((state) => ({ map: { ...state.map, mapInstance: instance } })),
          setApiLoaded: (loaded) =>
            set((state) => ({ map: { ...state.map, isApiLoaded: loaded } })),
          setApiLoading: (loading) =>
            set((state) => ({ map: { ...state.map, isApiLoading: loading } })),

          setAllListings: (listings) => {
            const state = get();
            const normalized = listings.map(normalizeListing);
            const filtered = filterListings(
              normalized,
              state.filters,
              state.map.bounds
            );
            set((prev) => ({
              listings: {
                ...prev.listings,
                all: normalized,
                filtered,
                visible: filtered,
              },
            }));
          },

          setVisibleListings: (listings) =>
            set((state) => ({
              listings: { ...state.listings, visible: listings },
            })),
          setFilteredListings: (listings) =>
            set((state) => ({
              listings: {
                ...state.listings,
                filtered: listings,
                visible: listings,
              },
            })),
          setListingsLoading: (loading) =>
            set((state) => ({
              listings: { ...state.listings, isLoading: loading },
            })),
          setHasMore: (hasMore) =>
            set((state) => ({ listings: { ...state.listings, hasMore } })),
          setPage: (page) =>
            set((state) => ({ listings: { ...state.listings, page } })),

          addListings: (newListings) => {
            const state = get();
            const normalizedNew = newListings.map(normalizeListing);
            const combined = [...state.listings.all, ...normalizedNew];
            const filtered = filterListings(
              combined,
              state.filters,
              state.map.bounds
            );
            set((prev) => ({
              listings: {
                ...prev.listings,
                all: combined,
                filtered,
                visible: filtered,
              },
            }));
          },

          resetListings: () =>
            set((state) => ({
              listings: {
                ...state.listings,
                all: [],
                visible: [],
                filtered: [],
                page: 1,
                hasMore: true,
                totalCount: 0,
                isLoading: false,
              },
            })),

          // ✅ FETCH SIMPLIFIÉ AVEC GESTION PGRST103 CORRECTE
          fetchListings: async (options = {}) => {
            const { page = 1, append = false } = options;
            const state = get();

            // Si pas de hasMore et page > 1, arrêter immédiatement
            if (page > 1 && !state.listings.hasMore) {
              return [];
            }

            set((prev) => ({
              listings: { ...prev.listings, isLoading: true },
            }));

            try {
              const limit = 20;
              const offset = (page - 1) * limit;

              let query = supabase
                .from("listing")
                .select("*, listingImages(url, listing_id)", { count: "exact" })
                .range(offset, offset + limit - 1)
                .order("created_at", { ascending: false });

              const { data, error, count } = await query;

              // ✅ SIMPLE : Si erreur, on arrête tout
              if (error) {
                console.error("Supabase error:", error);
                set((prev) => ({
                  listings: {
                    ...prev.listings,
                    isLoading: false,
                    hasMore: false,
                  },
                }));
                return [];
              }

              const rows = data || [];
              const listings: Listing[] = rows.map(normalizeListing);
              const totalCount = count || 0;

              // Simple : si on a moins que limit, on a fini
              const hasMore = listings.length === limit;

              set((prev) => ({
                listings: {
                  ...prev.listings,
                  all: append ? [...prev.listings.all, ...listings] : listings,
                  hasMore,
                  totalCount,
                  page,
                  isLoading: false,
                },
              }));

              get().filterListings();
              return listings;
            } catch (error: any) {
              console.error("Fetch error:", error);

              // ✅ GESTION PGRST103 ICI
              if (error?.code === "PGRST103") {
                console.log("PGRST103: Fin de pagination atteinte");
              }

              set((prev) => ({
                listings: {
                  ...prev.listings,
                  isLoading: false,
                  hasMore: false,
                },
              }));
              return [];
            }
          },

          loadMoreListings: async () => {
            const state = get();
            if (state.listings.isLoading || !state.listings.hasMore) return;

            await get().fetchListings({
              page: state.listings.page + 1,
              append: true,
            });
          },

          cleanupPagination: () => {
            // Méthode simple pour nettoyer
          },

          updateMapBoundsAndFilter: (bounds) => {
            set((state) => ({ map: { ...state.map, bounds } }));
            get().filterListings();
          },

          setHoveredListingId: (id) =>
            set((state) => ({
              interactions: { ...state.interactions, hoveredListingId: id },
            })),
          setSelectedListingId: (id) =>
            set((state) => ({
              interactions: {
                ...state.interactions,
                selectedListingId: id,
                openInfoWindowId: id,
              },
            })),
          setOpenInfoWindowId: (id) =>
            set((state) => ({
              interactions: { ...state.interactions, openInfoWindowId: id },
            })),
          clearSelection: () =>
            set((state) => ({
              interactions: {
                hoveredListingId: null,
                selectedListingId: null,
                openInfoWindowId: null,
              },
            })),

          toggleFilter: (filterKey, value) => {
            const state = get();
            const currentValues = (state.filters[filterKey] as string[]) ?? [];
            const isSelected = currentValues.includes(value);
            const next = isSelected
              ? currentValues.filter((v) => v !== value)
              : [...currentValues, value];

            set((prev) => ({
              filters: { ...prev.filters, [filterKey]: next },
              listings: { ...prev.listings, page: 1 },
            }));
            get().filterListings();
          },

          resetFilters: () => {
            set((state) => ({
              filters: { ...initialFilters },
              listings: { ...state.listings, page: 1 },
            }));
            get().filterListings();
          },

          setFilters: (filters) => {
            set((state) => ({
              filters: { ...initialFilters, ...filters },
              listings: { ...state.listings, page: 1 },
            }));
            get().filterListings();
          },

          setFiltersHydrated: (hydrated) =>
            set(() => ({ filtersHydrated: hydrated })),
          setMapExpanded: (expanded) =>
            set((state) => ({ ui: { ...state.ui, isMapExpanded: expanded } })),

          filterListings: () => {
            const state = get();
            const filtered = filterListings(
              state.listings.all,
              state.filters,
              state.map.bounds
            );
            set((prev) => ({
              listings: { ...prev.listings, filtered, visible: filtered },
            }));
          },

          reset: () =>
            set({
              map: {
                coordinates: null,
                bounds: null,
                zoom: 12,
                mapInstance: null,
                isApiLoaded: false,
                isApiLoading: false,
              },
              listings: {
                all: [],
                visible: [],
                filtered: [],
                isLoading: false,
                hasMore: true,
                page: 1,
                totalCount: 0,
              },
              interactions: {
                hoveredListingId: null,
                selectedListingId: null,
                openInfoWindowId: null,
              },
              filters: initialFilters,
              filtersHydrated: false,
              ui: { isMapExpanded: false },
            }),
        }),
        {
          name: "farm2fork-unified",
          version: 1,
          partialize: (state) => ({
            map: { coordinates: state.map.coordinates, zoom: state.map.zoom },
            filters: state.filters,
            filtersHydrated: state.filtersHydrated,
            ui: { isMapExpanded: state.ui.isMapExpanded },
          }),
        }
      )
    ),
    { name: "Farm2Fork Unified Store" }
  )
);

// Selectors
export const useMapState = () => useFarm2ForkStore((state) => state.map);
export const useListingsState = () =>
  useFarm2ForkStore((state) => state.listings);
export const useInteractionsState = () =>
  useFarm2ForkStore((state) => state.interactions);
export const useFiltersState = () =>
  useFarm2ForkStore((state) => state.filters);
export const useUIState = () => useFarm2ForkStore((state) => state.ui);

export const useMapActions = () =>
  useFarm2ForkStore((state) => ({
    setCoordinates: state.setCoordinates,
    setMapBounds: state.setMapBounds,
    setZoom: state.setZoom,
    setMapInstance: state.setMapInstance,
    setApiLoaded: state.setApiLoaded,
    setApiLoading: state.setApiLoading,
    updateMapBoundsAndFilter: state.updateMapBoundsAndFilter,
  }));

export const useListingsActions = () =>
  useFarm2ForkStore((state) => ({
    setAllListings: state.setAllListings,
    setVisibleListings: state.setVisibleListings,
    setFilteredListings: state.setFilteredListings,
    setListingsLoading: state.setListingsLoading,
    setHasMore: state.setHasMore,
    setPage: state.setPage,
    addListings: state.addListings,
    resetListings: state.resetListings,
    fetchListings: state.fetchListings,
    loadMoreListings: state.loadMoreListings,
    cleanupPagination: state.cleanupPagination,
  }));

export const useInteractionsActions = () =>
  useFarm2ForkStore((state) => ({
    setHoveredListingId: state.setHoveredListingId,
    setSelectedListingId: state.setSelectedListingId,
    setOpenInfoWindowId: state.setOpenInfoWindowId,
    clearSelection: state.clearSelection,
  }));

export const useFiltersActions = () =>
  useFarm2ForkStore((state) => ({
    toggleFilter: state.toggleFilter,
    resetFilters: state.resetFilters,
    setFilters: state.setFilters,
    setFiltersHydrated: state.setFiltersHydrated,
    filterListings: state.filterListings,
  }));

export const useUIActions = () =>
  useFarm2ForkStore((state) => ({ setMapExpanded: state.setMapExpanded }));

export const useSelectedListing = () =>
  useFarm2ForkStore((state) => state.interactions.selectedListingId);
export const useHoveredListing = () =>
  useFarm2ForkStore((state) => state.interactions.hoveredListingId);
export const useIsMapExpanded = () =>
  useFarm2ForkStore((state) => state.ui.isMapExpanded);

export default useFarm2ForkStore;
