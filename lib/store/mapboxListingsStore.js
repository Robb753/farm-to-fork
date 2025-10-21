// lib/store/mapboxListingsStore.js
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

// Configuration Mapbox
export const MAPBOX_CONFIG = {
  style: "mapbox://styles/mapbox/streets-v12", // Style par défaut
  center: [1.88, 46.6], // Centre de la France [lng, lat]
  zoom: 6,
  minZoom: 3,
  maxZoom: 18,
};

// Styles de carte disponibles
export const MAP_STYLES = {
  streets: "mapbox://styles/mapbox/streets-v12",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
  satellite: "mapbox://styles/mapbox/satellite-v9",
  satelliteStreets: "mapbox://styles/mapbox/satellite-streets-v12",
  // Style custom pour Farm2Fork (à créer plus tard)
  farmToFork: "mapbox://styles/votre-username/farmtofork-style",
};

// Types de filtres inchangés
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
  // ... autres filtres inchangés
];

const initialFilters = Object.fromEntries(
  filterSections.map(({ key }) => [key, []])
);

// Helper pour filtrer les listings (inchangé)
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

// Store principal adapté pour Mapbox
const useMapboxListingsStore = create()(
  devtools(
    persist(
      immer((set, get) => ({
        // État de la carte Mapbox
        map: {
          isLoaded: false,
          isLoading: false,
          coordinates: null, // [lng, lat] format Mapbox
          bounds: null, // [[swLng, swLat], [neLng, neLat]]
          zoom: MAPBOX_CONFIG.zoom,
          style: MAPBOX_CONFIG.style,
          mapInstance: null,
          bearing: 0,
          pitch: 0,
        },

        // État des listings (inchangé)
        listings: {
          all: [],
          visible: [],
          filtered: [],
          isLoading: false,
          hasMore: true,
          page: 1,
          totalCount: 0,
        },

        // État des interactions (inchangé)
        interactions: {
          hoveredListingId: null,
          selectedListingId: null,
          openInfoWindowId: null,
        },

        // Filtres (inchangé)
        filters: initialFilters,
        filtersHydrated: false,

        // Actions pour la carte Mapbox
        setMapLoaded: (loaded) =>
          set((state) => {
            state.map.isLoaded = loaded;
          }),

        setMapLoading: (loading) =>
          set((state) => {
            state.map.isLoading = loading;
          }),

        // Coordinates au format Mapbox [lng, lat]
        setCoordinates: (coords) =>
          set((state) => {
            if (coords && Array.isArray(coords) && coords.length === 2) {
              state.map.coordinates = coords;
            } else if (
              coords &&
              typeof coords.lat === "number" &&
              typeof coords.lng === "number"
            ) {
              // Conversion depuis format Google Maps {lat, lng}
              state.map.coordinates = [coords.lng, coords.lat];
            }
          }),

        // Bounds au format Mapbox [[swLng, swLat], [neLng, neLat]]
        setMapBounds: (bounds) =>
          set((state) => {
            state.map.bounds = bounds;
          }),

        setMapZoom: (zoom) =>
          set((state) => {
            state.map.zoom = zoom;
          }),

        setMapStyle: (style) =>
          set((state) => {
            state.map.style = style;
          }),

        setMapInstance: (instance) =>
          set((state) => {
            state.map.mapInstance = instance;
          }),

        setMapBearing: (bearing) =>
          set((state) => {
            state.map.bearing = bearing;
          }),

        setMapPitch: (pitch) =>
          set((state) => {
            state.map.pitch = pitch;
          }),

        // Actions pour les listings (inchangées)
        setAllListings: (listings) =>
          set((state) => {
            state.listings.all = listings || [];
            state.listings.filtered = filterListings(listings, state.filters);
            state.listings.visible = state.listings.filtered;
          }),

        // ... toutes les autres actions listings inchangées

        // Action principale adaptée pour Mapbox
        fetchListings: async ({
          page = 1,
          append = false,
          forceRefresh = false,
          bounds = null,
        } = {}) => {
          const state = get();

          if (state.listings.isLoading && !forceRefresh)
            return state.listings.all;

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

            // Appliquer les bounds Mapbox
            if (bounds || state.map.bounds) {
              const activeBounds = bounds || state.map.bounds;
              // Format Mapbox: [[swLng, swLat], [neLng, neLat]]
              const [[swLng, swLat], [neLng, neLat]] = activeBounds;

              query = query
                .gte("lat", swLat)
                .lte("lat", neLat)
                .gte("lng", swLng)
                .lte("lng", neLng);
            } else if (state.map.coordinates) {
              // Recherche dans un rayon basé sur le zoom
              const [lng, lat] = state.map.coordinates;
              const radius = state.map.zoom
                ? Math.max(20 - state.map.zoom, 1) * 5
                : 10;
              const latDelta = radius / 111;
              const lngDelta = radius / (111 * Math.cos((lat * Math.PI) / 180));

              query = query
                .gte("lat", lat - latDelta)
                .lte("lat", lat + latDelta)
                .gte("lng", lng - lngDelta)
                .lte("lng", lng + lngDelta);
            }

            // Pagination
            const limit = 20;
            query = query
              .range((page - 1) * limit, page * limit - 1)
              .order("created_at", { ascending: false });

            const { data, error, count } = await query;

            if (error) throw error;

            set((draft) => {
              if (append) {
                const combined = [...draft.listings.all, ...data];
                draft.listings.all = combined;
                draft.listings.filtered = filterListings(
                  combined,
                  draft.filters
                );
              } else {
                draft.listings.all = data;
                draft.listings.filtered = filterListings(data, draft.filters);
              }

              draft.listings.visible = draft.listings.filtered;
              draft.listings.hasMore = count > page * limit;
              draft.listings.totalCount = count || 0;
              draft.listings.page = page;
              draft.listings.isLoading = false;
            });

            return data;
          } catch (error) {
            console.error("Error fetching listings:", error);
            toast.error("Erreur lors du chargement des fermes");

            set((draft) => {
              draft.listings.isLoading = false;
            });

            return [];
          }
        },

        // Action pour rechercher dans une zone spécifique (adaptée pour Mapbox)
        searchInArea: async (mapInstance) => {
          if (!mapInstance) return;

          const bounds = mapInstance.getBounds();
          if (!bounds) return;

          const boundsArray = [
            [bounds.getWest(), bounds.getSouth()], // [swLng, swLat]
            [bounds.getEast(), bounds.getNorth()], // [neLng, neLat]
          ];

          return get().fetchListings({
            page: 1,
            forceRefresh: true,
            bounds: boundsArray,
          });
        },

        // Helpers pour la conversion entre Google Maps et Mapbox
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
          if (
            mapboxCoords &&
            Array.isArray(mapboxCoords) &&
            mapboxCoords.length === 2
          ) {
            return { lat: mapboxCoords[1], lng: mapboxCoords[0] };
          }
          return null;
        },

        // ... toutes les autres actions inchangées
      })),
      {
        name: "farm-to-fork-mapbox-listings",
        partialize: (state) => ({
          map: {
            coordinates: state.map.coordinates,
            zoom: state.map.zoom,
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

// Hooks sélecteurs adaptés
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

// Réexporter les autres hooks inchangés
export const useListingsState = () =>
  useMapboxListingsStore((state) => state.listings);
export const useListingsActions = () =>
  useMapboxListingsStore((state) => ({
    fetchListings: state.fetchListings,
    searchInArea: state.searchInArea,
    // ... autres actions
  }));

export default useMapboxListingsStore;