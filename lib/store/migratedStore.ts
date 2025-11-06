// lib/store/migratedStore.ts - Version corrigée avec filtrage géographique
import { create } from "zustand";
import { persist, subscribeWithSelector, devtools } from "zustand/middleware";
import { supabase } from "@/utils/supabase/client";
// Imports des types centralisés
import type { LatLng, MapBounds, Listing, FilterState } from "./types";

// ==================== STORE CONSOLIDÉ ====================
interface Farm2ForkStore {
  // MAP
  map: {
    coordinates: LatLng | null;
    bounds: MapBounds | null;
    zoom: number;
    mapInstance: any;
    isApiLoaded: boolean;
    isApiLoading: boolean;
  };

  // LISTINGS
  listings: {
    all: Listing[];
    visible: Listing[];
    filtered: Listing[];
    isLoading: boolean;
    hasMore: boolean;
    page: number;
    totalCount: number;
  };

  // INTERACTIONS
  interactions: {
    hoveredListingId: number | null;
    selectedListingId: number | null;
    openInfoWindowId: number | null;
  };

  // FILTERS
  filters: FilterState;
  filtersHydrated: boolean;

  // UI STATE
  ui: {
    isMapExpanded: boolean;
  };

  // ==================== ACTIONS ====================

  // Map Actions
  setCoordinates: (coords: LatLng | null) => void;
  setMapBounds: (bounds: MapBounds | null) => void;
  setZoom: (zoom: number) => void;
  setMapInstance: (instance: any) => void;
  setApiLoaded: (loaded: boolean) => void;
  setApiLoading: (loading: boolean) => void;

  // Listings Actions
  setAllListings: (listings: Listing[]) => void;
  setVisibleListings: (listings: Listing[]) => void;
  setFilteredListings: (listings: Listing[]) => void;
  setListingsLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;
  addListings: (listings: Listing[]) => void;
  resetListings: () => void;

  // Fetch function (improved from mapListingsStore)
  fetchListings: (options?: {
    page?: number;
    append?: boolean;
    forceRefresh?: boolean;
    bounds?: MapBounds | number[] | null;
    bbox?: number[] | null;
  }) => Promise<Listing[]>;

  // Interactions Actions
  setHoveredListingId: (id: number | null) => void;
  setSelectedListingId: (id: number | null) => void;
  setOpenInfoWindowId: (id: number | null) => void;
  clearSelection: () => void;

  // Filter Actions
  toggleFilter: (filterKey: keyof FilterState, value: string) => void;
  resetFilters: () => void;
  setFilters: (filters: FilterState) => void;
  setFiltersHydrated: (hydrated: boolean) => void;

  // UI Actions
  setMapExpanded: (expanded: boolean) => void;

  // ✅ NOUVELLES ACTIONS pour la synchronisation géographique
  updateMapBoundsAndFilter: (bounds: MapBounds | null) => void;
  loadMoreListings: () => Promise<void>;
  cleanupPagination: () => void;

  // Utility
  filterListings: () => void;
  reset: () => void;
}

// ==================== IMPORTS DE CONFIGURATION ====================
import { filterSections, MAPBOX_CONFIG } from "@/lib/config";

// Réexportation pour backward compatibility
export { filterSections, MAPBOX_CONFIG };

// ==================== VALEURS INITIALES ====================
const initialFilters: FilterState = {
  product_type: [],
  certifications: [],
  purchase_mode: [],
  production_method: [],
  additional_services: [],
  availability: [],
  mapType: [],
};

// ✅ FONCTION UTILITAIRE : Vérifier si un listing est dans les bounds
const isListingInBounds = (
  listing: Listing,
  bounds: MapBounds | null
): boolean => {
  if (!bounds || !listing.lat || !listing.lng) {
    return true; // Si pas de bounds, afficher tout
  }

  const lat = parseFloat(listing.lat);
  const lng = parseFloat(listing.lng);

  // Vérifier si les coordonnées sont valides
  if (isNaN(lat) || isNaN(lng)) {
    return false;
  }

  // Vérifier si dans les bounds
  return (
    lat >= bounds.sw.lat &&
    lat <= bounds.ne.lat &&
    lng >= bounds.sw.lng &&
    lng <= bounds.ne.lng
  );
};

// ✅ FONCTION DE FILTRAGE AMÉLIORÉE avec géolocalisation
const filterListings = (
  allListings: Listing[],
  filters: FilterState,
  mapBounds: MapBounds | null = null
): Listing[] => {
  if (!allListings || !Array.isArray(allListings)) return [];

  let filtered = allListings;

  // ✅ FILTRAGE GÉOGRAPHIQUE EN PREMIER
  if (mapBounds) {
    filtered = filtered.filter((listing) =>
      isListingInBounds(listing, mapBounds)
    );
    console.log(
      `[filterListings] Geographic filter: ${filtered.length}/${allListings.length} listings in bounds`
    );
  }

  // Filtres traditionnels (produits, certifications, etc.)
  const hasActiveFilters = Object.values(filters).some(
    (arr) => Array.isArray(arr) && arr.length > 0
  );

  if (hasActiveFilters) {
    filtered = filtered.filter((listing) =>
      Object.entries(filters).every(([key, values]) => {
        if (!Array.isArray(values) || values.length === 0 || key === "mapType")
          return true;

        // Vérifier si la propriété existe sur le listing
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

// ==================== STORE PRINCIPAL ====================
export const useFarm2ForkStore = create<Farm2ForkStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          // États initiaux
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

          // ==================== MAP ACTIONS ====================
          setCoordinates: (coords) =>
            set((state) => ({
              map: {
                ...state.map,
                coordinates: coords,
              },
            })),

          setMapBounds: (bounds) => {
            set((state) => ({
              map: {
                ...state.map,
                bounds: bounds,
              },
            }));
            // ✅ Auto-refiltrer quand les bounds changent
            setTimeout(() => get().filterListings(), 0);
          },

          setZoom: (zoom) =>
            set((state) => ({
              map: {
                ...state.map,
                zoom: zoom,
              },
            })),

          setMapInstance: (instance) =>
            set((state) => ({
              map: {
                ...state.map,
                mapInstance: instance,
              },
            })),

          setApiLoaded: (loaded) =>
            set((state) => ({
              map: {
                ...state.map,
                isApiLoaded: loaded,
              },
            })),

          setApiLoading: (loading) =>
            set((state) => ({
              map: {
                ...state.map,
                isApiLoading: loading,
              },
            })),

          // ==================== LISTINGS ACTIONS ====================
          setAllListings: (listings) => {
            const state = get();
            const filtered = filterListings(
              listings,
              state.filters,
              state.map.bounds
            );
            set((prevState) => ({
              listings: {
                ...prevState.listings,
                all: listings,
                filtered: filtered,
                visible: filtered,
              },
            }));
          },

          setVisibleListings: (listings) =>
            set((state) => ({
              listings: {
                ...state.listings,
                visible: listings,
              },
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
              listings: {
                ...state.listings,
                isLoading: loading,
              },
            })),

          setHasMore: (hasMore) =>
            set((state) => ({
              listings: {
                ...state.listings,
                hasMore: hasMore,
              },
            })),

          setPage: (page) =>
            set((state) => ({
              listings: {
                ...state.listings,
                page: page,
              },
            })),

          addListings: (newListings) => {
            const state = get();
            const combined = [...state.listings.all, ...newListings];
            const filtered = filterListings(
              combined,
              state.filters,
              state.map.bounds
            );
            set((prevState) => ({
              listings: {
                ...prevState.listings,
                all: combined,
                filtered: filtered,
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

          // ==================== FETCH LISTINGS (version corrigée) ====================
          fetchListings: async (options = {}) => {
            const state = get();
            const {
              page = 1,
              append = false,
              forceRefresh = false,
              bounds = null,
              bbox = null,
            } = options;

            // ✅ PROTECTION : Si on sait qu'il n'y a plus de données, arrêter
            if (page > 1 && !state.listings.hasMore) {
              console.log(
                `[fetchListings] Page ${page}: Pas de données supplémentaires disponibles`
              );
              return [];
            }

            // Validation et nettoyage des paramètres
            const cleanPage = Math.max(1, page);

            set((prevState) => ({
              listings: {
                ...prevState.listings,
                isLoading: true,
                ...(cleanPage === 1 && !append ? { hasMore: true } : {}),
              },
            }));

            try {
              let query = supabase
                .from("listing")
                .select("*, listingImages(url, listing_id)", {
                  count: "exact",
                });

              // Appliquer les filtres actifs
              Object.entries(state.filters).forEach(([key, values]) => {
                if (values && values.length > 0 && key !== "mapType") {
                  query = query.contains(key, values);
                }
              });

              // Appliquer bounds (logique améliorée)
              const activeBounds = bounds || bbox || state.map.bounds;
              if (activeBounds) {
                if (
                  activeBounds &&
                  typeof activeBounds === "object" &&
                  "sw" in activeBounds &&
                  "ne" in activeBounds
                ) {
                  // Format MapBounds avec sw/ne
                  const mapBounds = activeBounds as MapBounds;
                  query = query
                    .gte("lat", mapBounds.sw.lat)
                    .lte("lat", mapBounds.ne.lat)
                    .gte("lng", mapBounds.sw.lng)
                    .lte("lng", mapBounds.ne.lng);
                  console.log(
                    "[fetchListings] Applied geographic filter:",
                    mapBounds
                  );
                } else if (
                  Array.isArray(activeBounds) &&
                  activeBounds.length === 4
                ) {
                  // Format bbox [west, south, east, north]
                  const [west, south, east, north] = activeBounds;
                  query = query
                    .gte("lat", south)
                    .lte("lat", north)
                    .gte("lng", west)
                    .lte("lng", east);
                  console.log(
                    "[fetchListings] Applied bbox filter:",
                    activeBounds
                  );
                }
              }

              // Pagination avec gestion d'erreur
              const limit = 20;
              const offset = (cleanPage - 1) * limit;

              // ✅ PROTECTION : Ne pas faire de requête si offset trop grand
              const currentState = get();
              const currentTotal = currentState.listings.totalCount;
              if (currentTotal > 0 && offset >= currentTotal) {
                console.log(
                  `[fetchListings] Offset ${offset} >= total ${currentTotal}, arrêt de la pagination`
                );
                set((prevState) => ({
                  listings: {
                    ...prevState.listings,
                    isLoading: false,
                    hasMore: false,
                  },
                }));
                return [];
              }

              query = query
                .range(offset, offset + limit - 1)
                .order("created_at", { ascending: false });

              const { data, error, count } = await query;

              if (error) throw error;

              const listings = data || [];

              // ✅ LOGIQUE CORRIGÉE : Calculer hasMore correctement
              const totalCount = count || 0;
              const currentItemsCount = append
                ? state.listings.all.length + listings.length
                : listings.length;

              const hasMore =
                listings.length > 0 &&
                currentItemsCount < totalCount &&
                listings.length === limit;

              console.log(
                `[fetchListings] Page ${cleanPage}: ${listings.length} items, total: ${totalCount}, hasMore: ${hasMore}`
              );

              set((prevState) => ({
                listings: {
                  ...prevState.listings,
                  all: append
                    ? [...prevState.listings.all, ...listings]
                    : listings,
                  hasMore: hasMore,
                  totalCount: totalCount,
                  page: cleanPage,
                  isLoading: false,
                },
              }));

              // Auto-filter après mise à jour
              get().filterListings();

              return listings;
            } catch (error) {
              console.error("Error fetching listings:", error);

              // ✅ GESTION D'ERREUR AMÉLIORÉE : Arrêter la pagination en cas d'erreur
              set((prevState) => ({
                listings: {
                  ...prevState.listings,
                  isLoading: false,
                  hasMore: false,
                },
              }));
              return [];
            }
          },

          // ✅ NOUVELLE ACTION : Mettre à jour bounds et refiltrer
          updateMapBoundsAndFilter: (bounds) => {
            set((state) => ({
              map: {
                ...state.map,
                bounds: bounds,
              },
            }));

            // Refiltrer immédiatement avec les nouveaux bounds
            get().filterListings();

            console.log(
              "[updateMapBoundsAndFilter] Updated bounds and refiltered listings"
            );
          },

          // ✅ FONCTION AMÉLIORÉE : LoadMore avec protection
          loadMoreListings: async () => {
            const state = get();

            // Protection multiple
            if (state.listings.isLoading) {
              console.log(
                "[loadMoreListings] Déjà en cours de chargement, skip"
              );
              return;
            }

            if (!state.listings.hasMore) {
              console.log(
                "[loadMoreListings] Pas de données supplémentaires, skip"
              );
              return;
            }

            const nextPage = state.listings.page + 1;
            console.log(`[loadMoreListings] Chargement page ${nextPage}`);

            await get().fetchListings({
              page: nextPage,
              append: true,
            });
          },

          // ✅ NOUVELLE FONCTION : Vérifier et nettoyer la pagination
          cleanupPagination: () => {
            const state = get();
            const { totalCount, page } = state.listings;
            const limit = 20;
            const maxPage = Math.ceil(totalCount / limit) || 1;

            if (page > maxPage) {
              console.log(
                `[cleanupPagination] Page ${page} > maxPage ${maxPage}, reset à 1`
              );
              set((prevState) => ({
                listings: {
                  ...prevState.listings,
                  page: 1,
                  hasMore: totalCount > limit,
                },
              }));
            }
          },

          // ==================== INTERACTIONS ACTIONS ====================
          setHoveredListingId: (id) =>
            set((state) => ({
              interactions: {
                ...state.interactions,
                hoveredListingId: id,
              },
            })),

          setSelectedListingId: (id) =>
            set((state) => ({
              interactions: {
                ...state.interactions,
                selectedListingId: id,
                openInfoWindowId: id, // Auto-sync
              },
            })),

          setOpenInfoWindowId: (id) =>
            set((state) => ({
              interactions: {
                ...state.interactions,
                openInfoWindowId: id,
              },
            })),

          clearSelection: () =>
            set((state) => ({
              interactions: {
                hoveredListingId: null,
                selectedListingId: null,
                openInfoWindowId: null,
              },
            })),

          // ==================== FILTER ACTIONS ====================
          toggleFilter: (filterKey, value) => {
            const state = get();
            const currentValues = state.filters[filterKey] || [];
            const isSelected = currentValues.includes(value);

            const newFilters = {
              ...state.filters,
              [filterKey]: isSelected
                ? currentValues.filter((v) => v !== value)
                : [...currentValues, value],
            };

            set((prevState) => ({
              filters: newFilters,
              listings: {
                ...prevState.listings,
                page: 1, // Reset pagination
              },
            }));

            // Auto-filter après changement
            get().filterListings();
          },

          resetFilters: () => {
            set((state) => ({
              filters: { ...initialFilters },
              listings: {
                ...state.listings,
                page: 1,
              },
            }));
            get().filterListings();
          },

          setFilters: (filters) => {
            set((state) => ({
              filters: { ...initialFilters, ...filters },
              listings: {
                ...state.listings,
                page: 1,
              },
            }));
            get().filterListings();
          },

          setFiltersHydrated: (hydrated) =>
            set(() => ({ filtersHydrated: hydrated })),

          // ==================== UI ACTIONS ====================
          setMapExpanded: (expanded) =>
            set((state) => ({
              ui: {
                ...state.ui,
                isMapExpanded: expanded,
              },
            })),

          // ==================== UTILS ====================
          // ✅ FONCTION CORRIGÉE : Filtrage avec géolocalisation
          filterListings: () => {
            const state = get();
            const filtered = filterListings(
              state.listings.all,
              state.filters,
              state.map.bounds // ✅ Passer les bounds à la fonction
            );

            set((prevState) => ({
              listings: {
                ...prevState.listings,
                filtered,
                visible: filtered,
              },
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
              ui: {
                isMapExpanded: false,
              },
            }),
        }),
        {
          name: "farm2fork-unified",
          version: 1,
          migrate: (persistedState: any, version: number) => {
            // Migration simple depuis l'ancien store
            if (persistedState?.map?.mapZoom !== undefined) {
              return {
                map: {
                  coordinates: persistedState.map?.coordinates || null,
                  zoom: persistedState.map?.mapZoom || 12, // mapZoom → zoom
                },
                filters: persistedState.filters || initialFilters,
                filtersHydrated: persistedState.filtersHydrated || false,
                ui: {
                  isMapExpanded: false,
                },
              };
            }
            return persistedState;
          },
          partialize: (state) => ({
            map: {
              coordinates: state.map.coordinates,
              zoom: state.map.zoom,
            },
            filters: state.filters,
            filtersHydrated: state.filtersHydrated,
            ui: {
              isMapExpanded: state.ui.isMapExpanded,
            },
          }),
        }
      )
    ),
    { name: "Farm2Fork Unified Store" }
  )
);

// ==================== SELECTORS OPTIMISÉS ====================
export const useMapState = () => useFarm2ForkStore((state) => state.map);
export const useListingsState = () =>
  useFarm2ForkStore((state) => state.listings);
export const useInteractionsState = () =>
  useFarm2ForkStore((state) => state.interactions);
export const useFiltersState = () =>
  useFarm2ForkStore((state) => state.filters);
export const useUIState = () => useFarm2ForkStore((state) => state.ui);

// Actions selectors
export const useMapActions = () =>
  useFarm2ForkStore((state) => ({
    setCoordinates: state.setCoordinates,
    setMapBounds: state.setMapBounds,
    setZoom: state.setZoom,
    setMapInstance: state.setMapInstance,
    setApiLoaded: state.setApiLoaded,
    setApiLoading: state.setApiLoading,
    updateMapBoundsAndFilter: state.updateMapBoundsAndFilter, // ✅ NOUVEAU
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
    loadMoreListings: state.loadMoreListings, // ✅ NOUVEAU
    cleanupPagination: state.cleanupPagination, // ✅ NOUVEAU
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
    filterListings: state.filterListings, // ✅ Exposer pour usage externe
  }));

export const useUIActions = () =>
  useFarm2ForkStore((state) => ({
    setMapExpanded: state.setMapExpanded,
  }));

// Utility selectors
export const useSelectedListing = () =>
  useFarm2ForkStore((state) => state.interactions.selectedListingId);

export const useHoveredListing = () =>
  useFarm2ForkStore((state) => state.interactions.hoveredListingId);

export const useIsMapExpanded = () =>
  useFarm2ForkStore((state) => state.ui.isMapExpanded);

export default useFarm2ForkStore;
