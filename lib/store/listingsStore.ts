// lib/store/listingsStore.ts - Version finale avec bbox support
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { supabase } from "@/utils/supabase/client";

// ✅ Types locaux pour éviter les imports circulaires
export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapBounds {
  ne: LatLng;
  sw: LatLng;
}

export interface ListingImage {
  id: number;
  url: string;
}

export interface Listing {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  availability?: "open" | "closed";
  product_type?: string[];
  certifications?: string[];
  rating?: number;
  listingImages?: ListingImage[];
  description?: string;
  email?: string;
  phoneNumber?: string;
  website?: string;
  active?: boolean;
  created_at?: string;
  modified_at?: string;
  published_at?: string;
}

/**
 * Interface pour l'état des listings (simplifié comme migratedStore)
 */
interface ListingsState {
  all: Listing[];
  visible: Listing[];
  filtered: Listing[];
  isLoading: boolean;
  hasMore: boolean;
  page: number;
  totalCount: number;
}

/**
 * Interface pour l'état des interactions
 */
interface InteractionsState {
  hoveredListingId: number | null;
  selectedListingId: number | null;
  openInfoWindowId: number | null;
}

/**
 * Interface pour les options de fetch avec bbox support
 */
interface FetchListingsOptions {
  page?: number;
  append?: boolean;
  forceRefresh?: boolean;
  bounds?: MapBounds | null;
  bbox?: number[] | null; // ✅ Support pour bbox format [west, south, east, north]
}

/**
 * Interface pour les actions des listings
 */
interface ListingsActions {
  setAllListings: (listings: Listing[]) => void;
  setVisibleListings: (listings: Listing[]) => void;
  setFilteredListings: (listings: Listing[]) => void;
  addListings: (listings: Listing[]) => void;
  setListingsLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;
  setHoveredListingId: (id: number | null) => void;
  setSelectedListingId: (id: number | null) => void;
  setOpenInfoWindowId: (id: number | null) => void;
  clearSelection: () => void;
  fetchListings: (options?: FetchListingsOptions) => Promise<Listing[]>;
  loadMoreListings: () => Promise<void>;
  resetListings: () => void;
  cleanupPagination: () => void;
  reset: () => void;
}

type ListingsStore = ListingsState & InteractionsState & ListingsActions;

const INITIAL_LISTINGS_STATE: ListingsState = {
  all: [],
  visible: [],
  filtered: [],
  isLoading: false,
  hasMore: true,
  page: 1,
  totalCount: 0,
};

const INITIAL_INTERACTIONS_STATE: InteractionsState = {
  hoveredListingId: null,
  selectedListingId: null,
  openInfoWindowId: null,
};

/**
 * ✅ NORMALISATION comme dans migratedStore
 */
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
  listingImages: Array.isArray(row.listingImages)
    ? row.listingImages.map((img: any) => ({
        id: img.id || img.listing_id || Date.now(), // ✅ ID toujours présent
        url: img.url || img,
      }))
    : [],
});

/**
 * Store des listings - Version finale avec support bbox
 */
export const useListingsStore = create<ListingsStore>()(
  subscribeWithSelector((set, get) => ({
    ...INITIAL_LISTINGS_STATE,
    ...INITIAL_INTERACTIONS_STATE,

    setAllListings: (listings) => {
      const normalized = listings.map(normalizeListing);
      set({
        all: normalized,
        visible: normalized,
        filtered: normalized,
      });

      // Notifier la carte comme migratedStore
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("listingsUpdated", {
            detail: { listings: normalized, source: "setAllListings" },
          })
        );
      }
    },

    setVisibleListings: (visible) => {
      set({ visible });
    },

    setFilteredListings: (filtered) => {
      set({ filtered, visible: filtered });
    },

    addListings: (newListings) => {
      const state = get();
      const normalized = newListings.map(normalizeListing);
      const combined = [...state.all, ...normalized];

      set({
        all: combined,
        visible: combined,
        filtered: combined,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("listingsUpdated", {
            detail: { listings: combined, source: "addListings" },
          })
        );
      }
    },

    setListingsLoading: (isLoading) => {
      set({ isLoading });
    },

    setHasMore: (hasMore) => {
      set({ hasMore });
    },

    setPage: (page) => {
      set({ page });
    },

    setHoveredListingId: (hoveredListingId) => {
      set({ hoveredListingId });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("listingHovered", {
            detail: { id: hoveredListingId },
          })
        );
      }
    },

    setSelectedListingId: (selectedListingId) => {
      set({
        selectedListingId,
        openInfoWindowId: selectedListingId,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("listingSelected", {
            detail: { id: selectedListingId },
          })
        );
      }
    },

    setOpenInfoWindowId: (openInfoWindowId) => {
      set({ openInfoWindowId });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("infoWindowRequested", {
            detail: { id: openInfoWindowId },
          })
        );
      }
    },

    clearSelection: () => {
      set({
        hoveredListingId: null,
        selectedListingId: null,
        openInfoWindowId: null,
      });
    },

    // ✅ FETCH AVEC SUPPORT BBOX et BOUNDS
    fetchListings: async (options = {}) => {
      const { page = 1, append = false, bounds = null, bbox = null } = options;
      const state = get();

      // Si on sait déjà qu'il n'y a plus rien, ne pas refetch
      if (page > 1 && !state.hasMore) {
        return [];
      }

      set({ isLoading: true });

      try {
        const limit = 20;
        const offset = (page - 1) * limit;

        let query = supabase
          .from("listing")
          .select("*, listingImages(url, listing_id)", { count: "exact" })
          .eq("active", true)
          .order("created_at", { ascending: false });

        // ✅ GESTION FILTRAGE GÉOGRAPHIQUE - Priorise bbox puis bounds
        if (bbox && Array.isArray(bbox) && bbox.length === 4) {
          // Format bbox: [west, south, east, north]
          const [west, south, east, north] = bbox;

          query = query
            .gte("lat", south)
            .lte("lat", north)
            .gte("lng", west)
            .lte("lng", east);
        } else if (
          bounds &&
          typeof bounds === "object" &&
          "ne" in bounds &&
          "sw" in bounds
        ) {
          // Format bounds: { ne: {lat, lng}, sw: {lat, lng} }

          query = query
            .gte("lat", bounds.sw.lat)
            .lte("lat", bounds.ne.lat)
            .gte("lng", bounds.sw.lng)
            .lte("lng", bounds.ne.lng);
        }

        // Pagination
        if (page > 1) {
          query = query.range(offset, offset + limit - 1);
        } else {
          query = query.limit(limit);
        }

        const { data, error, count } = await query;

        // ✅ Gestion propre de PGRST103 (offset trop grand = fin de pagination)
        if (error) {
          if (error.code === "PGRST103") {
            set({
              isLoading: false,
              hasMore: false,
              // On garde le totalCount actuel si on en a déjà un
              totalCount: state.totalCount || 0,
              page,
            });
            return [];
          }

          // Autres erreurs = vraies erreurs
          console.error("Supabase error:", error);
          set({
            isLoading: false,
            hasMore: false,
          });
          return [];
        }

        const rows = data || [];
        const listings: Listing[] = rows.map(normalizeListing);
        const totalCount = typeof count === "number" ? count : state.totalCount;

        // 🔒 Si Supabase renvoie 0 lignes pour cette page → fin de pagination
        if (rows.length === 0) {
          set({
            isLoading: false,
            hasMore: false,
            totalCount,
            page,
          });
          return append ? state.all : [];
        }

        // hasMore fiable basé sur le total comme migratedStore
        const hasMore = offset + rows.length < totalCount;

        if (append) {
          const combined = [...state.all, ...listings];
          set({
            all: combined,
            visible: combined,
            filtered: combined,
            hasMore,
            totalCount,
            page,
            isLoading: false,
          });

          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("listingsUpdated", {
                detail: { listings: combined, source: "pagination" },
              })
            );
          }

          return combined;
        } else {
          set({
            all: listings,
            visible: listings,
            filtered: listings,
            hasMore,
            totalCount,
            page,
            isLoading: false,
          });

          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("listingsUpdated", {
                detail: {
                  listings,
                  source: bounds || bbox ? "geofiltred" : "initial",
                },
              })
            );
          }

          return listings;
        }
      } catch (error: any) {
        // Ici on ne traite que les vraies exceptions JS (réseau, bug, etc.)
        console.error("Fetch error:", error);

        set({
          isLoading: false,
          hasMore: false,
        });
        return [];
      }
    },

    loadMoreListings: async () => {
      const state = get();
      if (state.isLoading || !state.hasMore) return;

      const nextPage = state.page + 1;
      set({ page: nextPage });
      await get().fetchListings({ page: nextPage, append: true });
    },

    resetListings: () => {
      set({
        all: [],
        visible: [],
        filtered: [],
        page: 1,
        hasMore: true,
        totalCount: 0,
        isLoading: false,
      });
    },

    cleanupPagination: () => {
      // no-op comme migratedStore
    },

    reset: () => {
      set({
        ...INITIAL_LISTINGS_STATE,
        ...INITIAL_INTERACTIONS_STATE,
      });
    },
  }))
);

// ═══ Selectors comme migratedStore ═══

export const useListingsState = () =>
  useListingsStore((state) => ({
    all: state.all,
    visible: state.visible,
    filtered: state.filtered,
    isLoading: state.isLoading,
    hasMore: state.hasMore,
    page: state.page,
    totalCount: state.totalCount,
  }));

export const useInteractionsState = () =>
  useListingsStore((state) => ({
    hoveredListingId: state.hoveredListingId,
    selectedListingId: state.selectedListingId,
    openInfoWindowId: state.openInfoWindowId,
  }));

export const useListingsActions = () =>
  useListingsStore((state) => ({
    setAllListings: state.setAllListings,
    setVisibleListings: state.setVisibleListings,
    setFilteredListings: state.setFilteredListings,
    addListings: state.addListings,
    setListingsLoading: state.setListingsLoading,
    setHasMore: state.setHasMore,
    setPage: state.setPage,
    setHoveredListingId: state.setHoveredListingId,
    setSelectedListingId: state.setSelectedListingId,
    setOpenInfoWindowId: state.setOpenInfoWindowId,
    clearSelection: state.clearSelection,
    fetchListings: state.fetchListings,
    loadMoreListings: state.loadMoreListings,
    resetListings: state.resetListings,
    cleanupPagination: state.cleanupPagination,
    reset: state.reset,
  }));

// Selectors spécifiques comme migratedStore
export const useAllListings = () => useListingsStore((state) => state.all);
export const useVisibleListings = () =>
  useListingsStore((state) => state.visible);
export const useFilteredListings = () =>
  useListingsStore((state) => state.filtered);
export const useIsListingsLoading = () =>
  useListingsStore((state) => state.isLoading);
export const useListingsPage = () => useListingsStore((state) => state.page);
export const useHasMoreListings = () =>
  useListingsStore((state) => state.hasMore);
export const useSelectedListing = () =>
  useListingsStore((state) => state.selectedListingId);
export const useHoveredListing = () =>
  useListingsStore((state) => state.hoveredListingId);

export default useListingsStore;
