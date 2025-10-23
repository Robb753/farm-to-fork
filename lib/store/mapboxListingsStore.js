// lib/store/mapboxListingsStore.js
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

// Helpers init sûrs
const makeInitialFilters = () => {
  const base = Object.fromEntries(filterSections.map(({ key }) => [key, []]));
  return { ...base, mapType: [] }; // <- important pour “Type d’agriculture”
};
const initialFilters = makeInitialFilters();

/* ------- filtrage local ------- */
const filterListings = (allListings, filters) => {
  const hasActive = Object.values(filters).some((arr) => arr?.length > 0);
  if (!hasActive || !allListings) return allListings || [];
  return allListings.filter((listing) =>
    Object.entries(filters).every(([key, values]) => {
      if (!values?.length) return true;
      const source = Array.isArray(listing[key])
        ? listing[key]
        : listing[key]
          ? [listing[key]]
          : [];
      if (source.length === 0) return false;
      return values.some((v) => source.includes(v));
    })
  );
};

export const PAGE_SIZE = 20;
let currentReqId = 0;
let searchTimer = null;

const useMapboxListingsStore = create()(
  devtools(
    persist(
      immer((set, get) => ({
        /* --------- MAP / LISTINGS / INTERACTIONS (inchangé) --------- */
        map: {
          isLoaded: false,
          isLoading: false,
          coordinates: [1.88, 46.6],
          bounds: null,
          zoom: 6,
          minZoom: 3,
          maxZoom: 18,
          style: "mapbox://styles/mapbox/streets-v12",
          mapInstance: null,
          bearing: 0,
          pitch: 0,
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

        setHoveredListingId: (id) =>
          set((s) => {
            s.interactions.hoveredListingId = id;
          }),
        setSelectedListingId: (id) =>
          set((s) => {
            s.interactions.selectedListingId = id;
          }),
        setOpenInfoWindowId: (id) =>
          set((s) => {
            s.interactions.openInfoWindowId = id;
          }),

        /* ---------------- FILTRES ---------------- */
        filters: initialFilters,
        filtersHydrated: false,

        /* Actions Filtres —> **AJOUTÉES / CORRIGÉES** */
        toggleFilter: (key, value) =>
          set((s) => {
            const curr = Array.isArray(s.filters[key]) ? s.filters[key] : [];
            const exists = curr.includes(value);
            const next = exists
              ? curr.filter((v) => v !== value)
              : [...curr, value];
            s.filters[key] = next;
            s.listings.filtered = filterListings(s.listings.all, s.filters);
            s.listings.visible = s.listings.filtered;
          }),

        setFilters: (partial) =>
          set((s) => {
            // merge safe: force arrays, conserve les autres clés
            const next = { ...s.filters };
            Object.entries(partial || {}).forEach(([k, v]) => {
              next[k] = Array.isArray(v) ? [...v] : v ? [v] : [];
            });
            s.filters = next;
            s.listings.filtered = filterListings(s.listings.all, s.filters);
            s.listings.visible = s.listings.filtered;
          }),

        resetFilters: () =>
          set((s) => {
            s.filters = makeInitialFilters(); // new object
            s.listings.filtered = filterListings(s.listings.all, s.filters);
            s.listings.visible = s.listings.filtered;
          }),

        setFiltersHydrated: (v) =>
          set((s) => {
            s.filtersHydrated = !!v;
          }),

        /* ---------------- MAP setters (inchangé) ---------------- */
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

        /* ---------------- LISTINGS fetch (inchangé) ---------------- */
        setAllListings: (listings) =>
          set((s) => {
            s.listings.all = listings || [];
            s.listings.filtered = filterListings(s.listings.all, s.filters);
            s.listings.visible = s.listings.filtered;
          }),

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

            Object.entries(state.filters).forEach(([key, values]) => {
              if (values && values.length > 0) {
                query = query.contains(key, values);
              }
            });

            const activeBounds = bounds || state.map.bounds;
            if (activeBounds) {
              const [[swLng, swLat], [neLng, neLat]] = activeBounds;
              query = query
                .gte("lat", swLat)
                .lte("lat", neLat)
                .gte("lng", swLng)
                .lte("lng", neLng);
            } else if (state.map.coordinates) {
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

            query = query
              .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
              .order("created_at", { ascending: false });

            const { data, error, count } = await query;
            if (error) throw error;
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
            if (reqId !== currentReqId) return [];
            console.error("Error fetching listings:", error);
            toast.error("Erreur lors du chargement des fermes");
            set((d) => {
              d.listings.isLoading = false;
            });
            return [];
          }
        },

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
            }, 220);
          });
        },

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

/* ---------------- Hooks sélecteurs (SIMPLIFIÉS) ---------------- */
export const useMapboxState = () => useMapboxListingsStore((s) => s.map);
export const useMapboxActions = () =>
  useMapboxListingsStore((s) => ({
    setMapLoaded: s.setMapLoaded,
    setMapLoading: s.setMapLoading,
    setCoordinates: s.setCoordinates,
    setMapBounds: s.setMapBounds,
    setMapZoom: s.setMapZoom,
    setMapStyle: s.setMapStyle,
    setMapInstance: s.setMapInstance,
    setMapBearing: s.setMapBearing,
    setMapPitch: s.setMapPitch,
    convertGoogleToMapboxCoords: s.convertGoogleToMapboxCoords,
    convertMapboxToGoogleCoords: s.convertMapboxToGoogleCoords,
  }));

export const useListingsState = () => useMapboxListingsStore((s) => s.listings);
export const useListingsActions = () =>
  useMapboxListingsStore((s) => ({
    fetchListings: s.fetchListings,
    searchInArea: s.searchInArea,
    setAllListings: s.setAllListings,
  }));

export const useInteractionsState = () =>
  useMapboxListingsStore((s) => s.interactions);
export const useInteractionsActions = () =>
  useMapboxListingsStore((s) => ({
    setHoveredListingId: s.setHoveredListingId,
    setSelectedListingId: s.setSelectedListingId,
    setOpenInfoWindowId: s.setOpenInfoWindowId,
  }));

// 👇 Maintenant, ce hook renvoie **directement** l'objet des filtres
export const useFiltersState = () => useMapboxListingsStore((s) => s.filters);
export const useFiltersHydrated = () =>
  useMapboxListingsStore((s) => s.filtersHydrated);
export const useFiltersActions = () =>
  useMapboxListingsStore((s) => ({
    toggleFilter: s.toggleFilter,
    resetFilters: s.resetFilters,
    setFilters: s.setFilters,
    setFiltersHydrated: s.setFiltersHydrated,
  }));

export default useMapboxListingsStore;
