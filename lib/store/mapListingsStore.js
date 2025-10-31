import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

// Types de filtres disponibles
export const filterSections = [
  {
    title: "Produits",
    key: "product_type",
    items: [
      "Fruits",
      "Légumes",
      "Produits laitiers",
      "Viande",
      "Œufs",
      "Produits transformés",
    ],
  },
  {
    title: "Certifications",
    key: "certifications",
    items: ["Label AB", "Label Rouge", "AOP/AOC", "HVE", "Demeter"],
  },
  {
    title: "Distribution",
    key: "purchase_mode",
    items: [
      "Vente directe à la ferme",
      "Marché local",
      "Livraison à domicile",
      "Drive fermier",
    ],
  },
  {
    title: "Production",
    key: "production_method",
    items: [
      "Agriculture conventionnelle",
      "Agriculture biologique",
      "Agriculture durable",
      "Agriculture raisonnée",
    ],
  },
  {
    title: "Services",
    key: "additional_services",
    items: [
      "Visite de la ferme",
      "Ateliers de cuisine",
      "Hébergement",
      "Activités pour enfants",
      "Réservation pour événements",
    ],
  },
  {
    title: "Disponibilité",
    key: "availability",
    items: [
      "Saisonnière",
      "Toute l'année",
      "Pré-commande",
      "Sur abonnement",
      "Événements spéciaux",
    ],
  },
];

export const MAPBOX_CONFIG = {
  style: "mapbox://styles/mapbox/streets-v12",
  center: [2.2137, 46.2276],
  zoom: 4.6,
  minZoom: 3,
  maxZoom: 18,
};

// Filtres initiaux
const initialFilters = Object.fromEntries(
  filterSections.map(({ key }) => [key, []])
);

// Helper pour filtrer les listings
const filterListings = (allListings, filters) => {
  const hasActiveFilters = Object.values(filters).some((arr) => arr.length > 0);
  if (!hasActiveFilters || !allListings) return allListings || [];

  return allListings.filter((listing) =>
    Object.entries(filters).every(([key, values]) => {
      if (values.length === 0) return true;

      const listingValues = Array.isArray(listing[key])
        ? listing[key]
        : listing[key]
          ? [listing[key]]
          : [];

      if (listingValues.length === 0) return false;
      return values.some((v) => listingValues.includes(v));
    })
  );
};

// Store principal
const useMapListingsStore = create()(
  devtools(
    persist(
      immer((set, get) => ({
        // État de la carte
        map: {
          isApiLoaded: false,
          isApiLoading: false,
          coordinates: null,
          mapBounds: null,
          mapZoom: 12,
          mapInstance: null,
        },

        // État des listings
        listings: {
          all: [],
          visible: [],
          filtered: [],
          isLoading: false,
          hasMore: true,
          page: 1,
          totalCount: 0,
        },

        // État des interactions
        interactions: {
          hoveredListingId: null,
          selectedListingId: null,
          openInfoWindowId: null,
        },

        // Filtres
        filters: initialFilters,
        filtersHydrated: false,

        // Actions pour la carte
        setApiLoaded: (loaded) =>
          set((state) => {
            state.map.isApiLoaded = loaded;
          }),

        setApiLoading: (loading) =>
          set((state) => {
            state.map.isApiLoading = loading;
          }),

        setCoordinates: (coords) =>
          set((state) => {
            if (
              coords &&
              typeof coords.lat === "number" &&
              typeof coords.lng === "number"
            ) {
              state.map.coordinates = coords;
            }
          }),

        setMapBounds: (bounds) =>
          set((state) => {
            state.map.mapBounds = bounds;
          }),

        setMapZoom: (zoom) =>
          set((state) => {
            state.map.mapZoom = zoom;
          }),

        setMapInstance: (instance) =>
          set((state) => {
            state.map.mapInstance = instance;
          }),

        // Actions pour les listings
        setAllListings: (listings) =>
          set((state) => {
            state.listings.all = listings || [];
            // Recalculer les listings filtrés
            state.listings.filtered = filterListings(listings, state.filters);
            state.listings.visible = state.listings.filtered;
          }),

        appendListings: (newListings) =>
          set((state) => {
            const combined = [...state.listings.all, ...(newListings || [])];
            state.listings.all = combined;
            state.listings.filtered = filterListings(combined, state.filters);
            state.listings.visible = state.listings.filtered;
          }),

        setFilteredListings: (listings) =>
          set((state) => {
            state.listings.filtered = listings || [];
            state.listings.visible = listings || [];
          }),

        setVisibleListings: (listings) =>
          set((state) => {
            state.listings.visible = listings || [];
          }),

        setListingsLoading: (loading) =>
          set((state) => {
            state.listings.isLoading = loading;
          }),

        setHasMore: (hasMore) =>
          set((state) => {
            state.listings.hasMore = hasMore;
          }),

        setPage: (page) =>
          set((state) => {
            state.listings.page = page;
          }),

        incrementPage: () =>
          set((state) => {
            state.listings.page += 1;
          }),

        setTotalCount: (count) =>
          set((state) => {
            state.listings.totalCount = count;
          }),

        // ✅ Action resetListings correctement placée
        resetListings: () =>
          set((state) => {
            state.listings.all = [];
            state.listings.visible = [];
            state.listings.filtered = [];
            state.listings.page = 1; // ✅ Reset à la page 1
            state.listings.hasMore = true;
            state.listings.totalCount = 0;
            state.listings.isLoading = false; // ✅ Arrête le loading
          }),

        // Actions pour les interactions
        setHoveredListingId: (id) =>
          set((state) => {
            state.interactions.hoveredListingId = id;
          }),

        setSelectedListingId: (id) =>
          set((state) => {
            state.interactions.selectedListingId = id;
            if (id) state.interactions.openInfoWindowId = id;
          }),

        setOpenInfoWindowId: (id) =>
          set((state) => {
            state.interactions.openInfoWindowId = id;
          }),

        clearSelection: () =>
          set((state) => {
            state.interactions.hoveredListingId = null;
            state.interactions.selectedListingId = null;
            state.interactions.openInfoWindowId = null;
          }),

        // Actions pour les filtres
        toggleFilter: (filterKey, value) =>
          set((state) => {
            const currentValues = state.filters[filterKey] || [];
            const isSelected = currentValues.includes(value);

            if (isSelected) {
              state.filters[filterKey] = currentValues.filter(
                (v) => v !== value
              );
            } else {
              state.filters[filterKey] = [...currentValues, value];
            }

            // ✅ Reset pagination quand on change les filtres
            state.listings.page = 1;
            state.listings.hasMore = true;
            state.listings.isLoading = false;

            // Recalculer les listings filtrés
            state.listings.filtered = filterListings(
              state.listings.all,
              state.filters
            );
            state.listings.visible = state.listings.filtered;
          }),

        resetFilters: () =>
          set((state) => {
            state.filters = { ...initialFilters };

            // ✅ Reset pagination quand on remet à zéro
            state.listings.page = 1;
            state.listings.hasMore = true;
            state.listings.isLoading = false;

            state.listings.filtered = filterListings(
              state.listings.all,
              state.filters
            );
            state.listings.visible = state.listings.filtered;
          }),

        setFiltersHydrated: (hydrated) =>
          set((state) => {
            state.filtersHydrated = hydrated;
          }),

        setFilters: (filters) =>
          set((state) => {
            state.filters = { ...initialFilters, ...filters };

            // ✅ Reset pagination quand on change les filtres
            state.listings.page = 1;
            state.listings.hasMore = true;
            state.listings.isLoading = false;

            state.listings.filtered = filterListings(
              state.listings.all,
              state.filters
            );
            state.listings.visible = state.listings.filtered;
          }),

        // Action principale pour récupérer les listings
        fetchListings: async ({
          page = 1,
          append = false,
          forceRefresh = false,
          bounds = null,
          bbox = null,
        } = {}) => {
          const state = get();

          if (state.listings.isLoading && !forceRefresh)
            return state.listings.all;

          // ✅ Validation robuste de la page
          if (page < 1) page = 1;
          if (!append && page > 1) page = 1;

          set((draft) => {
            draft.listings.isLoading = true;
            if (page === 1 && !append) {
              draft.listings.hasMore = true;
            }
          });

          try {
            let query = supabase
              .from("listing")
              .select("*, listingImages(url, listing_id)", { count: "exact" });

            // Appliquer les filtres actifs
            Object.entries(state.filters).forEach(([key, values]) => {
              if (values && values.length > 0) {
                query = query.contains(key, values);
              }
            });

            // Appliquer les bounds si disponibles
            const activeBounds = bounds || bbox || state.map.mapBounds;
            if (activeBounds) {
              if (activeBounds.sw && activeBounds.ne) {
                query = query
                  .gte("lat", activeBounds.sw.lat)
                  .lte("lat", activeBounds.ne.lat)
                  .gte("lng", activeBounds.sw.lng)
                  .lte("lng", activeBounds.ne.lng);
              } else if (
                Array.isArray(activeBounds) &&
                activeBounds.length === 4
              ) {
                const [west, south, east, north] = activeBounds;
                query = query
                  .gte("lat", south)
                  .lte("lat", north)
                  .gte("lng", west)
                  .lte("lng", east);
              }
            } else if (state.map.coordinates) {
              const radius = state.map.mapZoom
                ? Math.max(20 - state.map.mapZoom, 1) * 5
                : 10;
              const latDelta = radius / 111;
              const lngDelta =
                radius /
                (111 * Math.cos((state.map.coordinates.lat * Math.PI) / 180));

              query = query
                .gte("lat", state.map.coordinates.lat - latDelta)
                .lte("lat", state.map.coordinates.lat + latDelta)
                .gte("lng", state.map.coordinates.lng - lngDelta)
                .lte("lng", state.map.coordinates.lng + lngDelta);
            }

            // ✅ Pagination corrigée avec validation du count
            const limit = 20;
            const offset = (page - 1) * limit;

            // Premièrement, on compte le total disponible
            const { count: totalCount } = await supabase
              .from("listing")
              .select("*", { count: "exact", head: true });

            // ✅ Si l'offset dépasse le total, on charge depuis le début
            const safeOffset = Math.min(
              offset,
              Math.max(0, (totalCount || 0) - limit)
            );
            const safePage = Math.floor(safeOffset / limit) + 1;

            query = query
              .range(safeOffset, safeOffset + limit - 1)
              .order("created_at", { ascending: false });

            const { data, error, count } = await query;

            if (error) throw error;

            set((draft) => {
              if (append && safeOffset === offset) {
                // Append normal si pas d'ajustement d'offset
                const combined = [...draft.listings.all, ...(data || [])];
                draft.listings.all = combined;
                draft.listings.filtered = filterListings(
                  combined,
                  draft.filters
                );
              } else {
                // Remplace si c'est une nouvelle requête ou offset ajusté
                draft.listings.all = data || [];
                draft.listings.filtered = filterListings(
                  data || [],
                  draft.filters
                );
              }

              draft.listings.visible = draft.listings.filtered;
              draft.listings.hasMore = (count || 0) > safeOffset + limit;
              draft.listings.totalCount = count || 0;
              draft.listings.page = safePage;
              draft.listings.isLoading = false;
            });

            return data;
          } catch (error) {
            console.error("Error fetching listings:", error);

            // ✅ Gestion améliorée des erreurs de pagination
            if (
              error?.code === "PGRST103" ||
              error?.message?.includes("offset")
            ) {
              set((draft) => {
                draft.listings.hasMore = false;
                draft.listings.isLoading = false;
                draft.listings.page = 1; // Reset à la page 1
              });
              return [];
            }

            toast.error("Erreur lors du chargement des fermes");

            set((draft) => {
              draft.listings.isLoading = false;
            });

            return [];
          }
        },

        // Action pour charger plus de listings
        loadMoreListings: async () => {
          const state = get();
          if (state.listings.isLoading || !state.listings.hasMore) return;

          const nextPage = state.listings.page + 1;
          return state.fetchListings({ page: nextPage, append: true });
        },

        // Action pour rafraîchir les listings
        refreshListings: async () => {
          const state = get();
          return state.fetchListings({ page: 1, forceRefresh: true });
        },

        // Action pour rechercher dans une zone spécifique
        searchInArea: async (mapInstance) => {
          if (!mapInstance) return;

          const bounds = mapInstance.getBounds();
          if (!bounds) return;

          const boundsObj = {
            ne: {
              lat: bounds.getNorthEast().lat(),
              lng: bounds.getNorthEast().lng(),
            },
            sw: {
              lat: bounds.getSouthWest().lat(),
              lng: bounds.getSouthWest().lng(),
            },
          };

          return get().fetchListings({
            page: 1,
            forceRefresh: true,
            bounds: boundsObj,
          });
        },
      })),
      {
        name: "farm-to-fork-map-listings",
        partialize: (state) => ({
          map: {
            coordinates: state.map.coordinates,
            mapZoom: state.map.mapZoom,
          },
          filters: state.filters,
          filtersHydrated: state.filtersHydrated,
        }),
      }
    ),
    { name: "map-listings-store" }
  )
);

// Hooks sélecteurs pour l'optimisation
export const useMapState = () => useMapListingsStore((state) => state.map);

export const useMapActions = () =>
  useMapListingsStore((state) => ({
    setApiLoaded: state.setApiLoaded,
    setApiLoading: state.setApiLoading,
    setCoordinates: state.setCoordinates,
    setMapBounds: state.setMapBounds,
    setMapZoom: state.setMapZoom,
    setMapInstance: state.setMapInstance,
  }));

// Hook spécifique pour Mapbox avec config
export const useMapboxState = () => {
  const mapState = useMapListingsStore((state) => state.map);
  return {
    coordinates: mapState.coordinates,
    zoom: mapState.mapZoom,
    style: MAPBOX_CONFIG.style,
    center: MAPBOX_CONFIG.center,
    minZoom: MAPBOX_CONFIG.minZoom,
    maxZoom: MAPBOX_CONFIG.maxZoom,
  };
};

export const useListingsState = () =>
  useMapListingsStore((state) => state.listings);

export const useListingsActions = () =>
  useMapListingsStore((state) => ({
    setAllListings: state.setAllListings,
    appendListings: state.appendListings,
    setFilteredListings: state.setFilteredListings,
    setVisibleListings: state.setVisibleListings,
    setListingsLoading: state.setListingsLoading,
    setHasMore: state.setHasMore,
    setPage: state.setPage,
    incrementPage: state.incrementPage,
    setTotalCount: state.setTotalCount,
    resetListings: state.resetListings,
    fetchListings: state.fetchListings,
    loadMoreListings: state.loadMoreListings,
    refreshListings: state.refreshListings,
    searchInArea: state.searchInArea,
  }));

export const useInteractionsState = () =>
  useMapListingsStore((state) => state.interactions);

export const useInteractionsActions = () =>
  useMapListingsStore((state) => ({
    setHoveredListingId: state.setHoveredListingId,
    setSelectedListingId: state.setSelectedListingId,
    setOpenInfoWindowId: state.setOpenInfoWindowId,
    clearSelection: state.clearSelection,
  }));

export const useFiltersState = () =>
  useMapListingsStore((state) => state.filters);

export const useFiltersActions = () =>
  useMapListingsStore((state) => ({
    toggleFilter: state.toggleFilter,
    resetFilters: state.resetFilters,
    setFiltersHydrated: state.setFiltersHydrated,
    setFilters: state.setFilters,
    resetListings: state.resetListings,
  }));

export default useMapListingsStore;
