// lib/store/mapboxListingsStore.js
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

// ==========================
// Config Mapbox
// ==========================
export const MAPBOX_CONFIG = {
  style: "mapbox://styles/mapbox/streets-v12",
  center: [1.88, 46.6], // FR métropolitaine [lng, lat]
  zoom: 6,
  minZoom: 3,
  maxZoom: 18,
};

// Styles disponibles (tu pourras ajouter un style Studio custom)
export const MAP_STYLES = {
  streets: "mapbox://styles/mapbox/streets-v12",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
  satellite: "mapbox://styles/mapbox/satellite-v9",
  satelliteStreets: "mapbox://styles/mapbox/satellite-streets-v12",
  farmToFork: "mapbox://styles/votre-username/farmtofork-style",
};

// Filtres (inchangés)
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
  // ... autres sections
];

const initialFilters = Object.fromEntries(
  filterSections.map(({ key }) => [key, []])
);

// Helper de filtrage local
const filterListings = (allListings, filters) => {
  const hasActiveFilters = Object.values(filters).some((arr) => arr.length > 0);
  if (!hasActiveFilters || !allListings) return allListings || [];
  return allListings.filter((listing) =>
    Object.entries(filters).every(([key, values]) => {
      if (!values?.length) return true;
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

// Pagination standardisée
export const PAGE_SIZE = 20;

// Anti-course pour fetchListings (la dernière requête gagne)
let currentReqId = 0;

// Debounce pour searchInArea
let searchTimer = null;

// ==========================
// Store
// ==========================
const useMapboxListingsStore = create()(
  devtools(
    persist(
      immer((set, get) => ({
        // --------- ÉTAT CARTE ---------
        map: {
          isLoaded: false,
          isLoading: false,
          coordinates: MAPBOX_CONFIG.center, // [lng, lat]
          bounds: null, // [[swLng, swLat], [neLng, neLat]]
          zoom: MAPBOX_CONFIG.zoom,
          minZoom: MAPBOX_CONFIG.minZoom,
          maxZoom: MAPBOX_CONFIG.maxZoom,
          style: MAPBOX_CONFIG.style,
          mapInstance: null, // non persisté
          bearing: 0,
          pitch: 0,
        },

        // --------- LISTINGS ----------
        listings: {
          all: [],
          visible: [],
          filtered: [],
          isLoading: false,
          hasMore: true,
          page: 1,
          totalCount: 0,
        },

        // --------- INTERACTIONS ---------
        interactions: {
          hoveredListingId: null,
          selectedListingId: null,
          openInfoWindowId: null,
        },

        // --------- FILTRES ----------
        filters: initialFilters,
        filtersHydrated: false,

        // ---------- ACTIONS CARTE ----------
        setMapLoaded: (loaded) =>
          set((s) => {
            s.map.isLoaded = loaded;
          }),

        setMapLoading: (loading) =>
          set((s) => {
            s.map.isLoading = loading;
          }),

        setCoordinates: (coords) =>
          set((s) => {
            if (Array.isArray(coords) && coords.length === 2) {
              s.map.coordinates = coords;
            } else if (
              coords &&
              typeof coords.lat === "number" &&
              typeof coords.lng === "number"
            ) {
              s.map.coordinates = [coords.lng, coords.lat];
            }
          }),

        setMapBounds: (bounds) =>
          set((s) => {
            s.map.bounds = bounds;
          }),

        setMapZoom: (zoom) =>
          set((s) => {
            s.map.zoom = zoom;
          }),

        setMapStyle: (style) =>
          set((s) => {
            s.map.style = style;
          }),

        setMapInstance: (instance) =>
          set((s) => {
            s.map.mapInstance = instance;
          }),

        setMapBearing: (bearing) =>
          set((s) => {
            s.map.bearing = bearing;
          }),

        setMapPitch: (pitch) =>
          set((s) => {
            s.map.pitch = pitch;
          }),

        // ---------- ACTIONS LISTINGS ----------
        setAllListings: (listings) =>
          set((s) => {
            s.listings.all = listings || [];
            s.listings.filtered = filterListings(s.listings.all, s.filters);
            s.listings.visible = s.listings.filtered;
          }),

        // ---------- ACTIONS FILTRES ----------
        setFilters: (filters) =>
          set((s) => {
            s.filters = { ...s.filters, ...filters };
            s.listings.filtered = filterListings(s.listings.all, s.filters);
            s.listings.visible = s.listings.filtered;
          }),

        setFiltersHydrated: (v) =>
          set((s) => {
            s.filtersHydrated = !!v;
          }),

        // ---------- FETCH PRINCIPAL (avec anti-course) ----------
        fetchListings: async ({
          page = 1,
          append = false,
          forceRefresh = false,
          bounds = null,
        } = {}) => {
          const state = get();
          if (state.listings.isLoading && !forceRefresh)
            return state.listings.all;

          const reqId = ++currentReqId;
          set((d) => {
            d.listings.isLoading = true;
            if (page === 1 && !append) d.listings.hasMore = true;
          });

          try {
            let query = supabase
              .from("listing")
              .select("*, listingImages(url, listing_id)", { count: "exact" });

            // Filtres actifs (si colonnes JSON -> .contains ; sinon adapter à .in/.ilike)
            Object.entries(state.filters).forEach(([key, values]) => {
              if (values && values.length > 0) {
                query = query.contains(key, values);
              }
            });

            // BBox Mapbox: [[swLng, swLat], [neLng, neLat]]
            const activeBounds = bounds || state.map.bounds;
            if (activeBounds) {
              const [[swLng, swLat], [neLng, neLat]] = activeBounds;
              query = query
                .gte("lat", swLat)
                .lte("lat", neLat)
                .gte("lng", swLng)
                .lte("lng", neLng);
            } else if (state.map.coordinates) {
              // Fallback “fenêtre” autour du center selon le zoom
              const [lng, lat] = state.map.coordinates;
              const radiusKm = state.map.zoom
                ? Math.max(20 - state.map.zoom, 1) * 5
                : 10;
              const latDelta = radiusKm / 111;
              const lngDelta =
                radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
              query = query
                .gte("lat", lat - latDelta)
                .lte("lat", lat + latDelta)
                .gte("lng", lng - lngDelta)
                .lte("lng", lng + lngDelta);
            }

            // Pagination
            query = query
              .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
              .order("created_at", { ascending: false });

            const { data, error, count } = await query;
            if (error) throw error;

            // Si une requête plus récente a démarré, on abandonne l'effet
            if (reqId !== currentReqId) return [];

            set((d) => {
              const merged = append
                ? [...d.listings.all, ...(data || [])]
                : data || [];
              d.listings.all = merged;
              d.listings.filtered = filterListings(merged, d.filters);
              d.listings.visible = d.listings.filtered;
              d.listings.hasMore = (count ?? merged.length) > page * PAGE_SIZE;
              d.listings.totalCount = count || merged.length;
              d.listings.page = page;
              d.listings.isLoading = false;
            });

            return data || [];
          } catch (error) {
            // Même en cas d'erreur, ne pas écraser un fetch plus récent
            if (reqId !== currentReqId) return [];
            console.error("Error fetching listings:", error);
            toast.error("Erreur lors du chargement des fermes");
            set((d) => {
              d.listings.isLoading = false;
            });
            return [];
          }
        },

        // ---------- Recherche dans la zone (debounce) ----------
        searchInArea: async (mapInstance) => {
          if (!mapInstance) return [];
          clearTimeout(searchTimer);
          return new Promise((resolve) => {
            searchTimer = setTimeout(async () => {
              const b = mapInstance.getBounds?.();
              if (!b) return resolve([]);
              const boundsArray = [
                [b.getWest(), b.getSouth()],
                [b.getEast(), b.getNorth()],
              ];
              const res = await get().fetchListings({
                page: 1,
                forceRefresh: true,
                bounds: boundsArray,
              });
              resolve(res);
            }, 220); // 200–300 ms est confortable
          });
        },

        // ---------- Helpers conversions ----------
        convertGoogleToMapboxCoords: (googleCoords) => {
          if (
            googleCoords &&
            typeof googleCoords.lat === "number" &&
            typeof googleCoords.lng === "number"
          ) {
            return [googleCoords.lng, googleCoords.lat];
          }
          return null;
        },

        convertMapboxToGoogleCoords: (mapboxCoords) => {
          if (Array.isArray(mapboxCoords) && mapboxCoords.length === 2) {
            return { lat: mapboxCoords[1], lng: mapboxCoords[0] };
          }
          return null;
        },
      })),
      {
        name: "farm-to-fork-mapbox-listings",
        // On persiste seulement l'état utile ; jamais l'instance Map
        partialize: (state) => ({
          map: {
            coordinates: state.map.coordinates,
            zoom: state.map.zoom,
            minZoom: state.map.minZoom,
            maxZoom: state.map.maxZoom,
            style: state.map.style,
            bearing: state.map.bearing,
            pitch: state.map.pitch,
          },
          filters: state.filters,
          filtersHydrated: state.filtersHydrated,
        }),
      }
    ),
    { name: "mapbox-listings-store" }
  )
);

// ==========================
// Hooks sélecteurs
// ==========================
export const useMapboxState = () =>
  useMapboxListingsStore((state) => state.map);
export const useMapboxActions = () =>
  useMapboxListingsStore((state) => ({
    setMapLoaded: state.setMapLoaded,
    setMapLoading: state.setMapLoading,
    setCoordinates: state.setCoordinates,
    setMapBounds: state.setMapBounds,
    setMapZoom: state.setMapZoom,
    setMapStyle: state.setMapStyle,
    setMapInstance: state.setMapInstance,
    setMapBearing: state.setMapBearing,
    setMapPitch: state.setMapPitch,
    convertGoogleToMapboxCoords: state.convertGoogleToMapboxCoords,
    convertMapboxToGoogleCoords: state.convertMapboxToGoogleCoords,
  }));

export const useListingsState = () =>
  useMapboxListingsStore((state) => state.listings);
export const useListingsActions = () =>
  useMapboxListingsStore((state) => ({
    fetchListings: state.fetchListings,
    searchInArea: state.searchInArea,
    setAllListings: state.setAllListings,
  }));

export const useFiltersState = () =>
  useMapboxListingsStore((state) => ({
    filters: state.filters,
    filtersHydrated: state.filtersHydrated,
  }));
export const useFiltersActions = () =>
  useMapboxListingsStore((state) => ({
    setFilters: state.setFilters,
    setFiltersHydrated: state.setFiltersHydrated,
  }));

export default useMapboxListingsStore;
