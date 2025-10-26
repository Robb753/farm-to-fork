// lib/store/mapboxListingsStore.js
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

/* ==========================
   Config Mapbox (exportée)
========================== */
export const MAPBOX_CONFIG = {
  style: "mapbox://styles/mapbox/streets-v12",
  center: [2.2137, 46.2276],
  zoom: 4.6,
  minZoom: 3,
  maxZoom: 18,
};

/* ==========================
   Types de filtres
========================== */
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

/* ==========================
   Mapping UI -> ENUM BDD
   (pour le pseudo-filtre mapType)
========================== */
const MAP_TYPE_TO_ENUM = {
  conventional: "Agriculture conventionnelle",
  organic: "Agriculture biologique",
  sustainable: "Agriculture durable",
  reasoned: "Agriculture raisonnée",
};

/* ==========================
   Helpers init sûrs
========================== */
const makeInitialFilters = () => {
  const base = Object.fromEntries(filterSections.map(({ key }) => [key, []]));
  return { ...base, mapType: [] }; // <- alias UI pour production_method
};
const initialFilters = makeInitialFilters();

/* ==========================
   Filtrage local (memo-free)
========================== */
const filterListings = (allListings, filters) => {
  const hasActive = Object.values(filters).some((arr) => arr?.length > 0);
  if (!hasActive || !allListings) return allListings || [];

  return allListings.filter((listing) =>
    Object.entries(filters).every(([key, values]) => {
      if (!values?.length) return true;

      // alias + mapping pour mapType
      const effectiveKey = key === "mapType" ? "production_method" : key;
      const compareValues =
        key === "mapType"
          ? values.map((v) => MAP_TYPE_TO_ENUM[v]).filter(Boolean)
          : values;

      const source = Array.isArray(listing[effectiveKey])
        ? listing[effectiveKey]
        : listing[effectiveKey]
          ? [listing[effectiveKey]]
          : [];

      if (source.length === 0) return false;
      return compareValues.some((v) => source.includes(v));
    })
  );
};

/* ==========================
   Pagination & anti-course
========================== */
export const PAGE_SIZE = 20;
let currentReqId = 0;
let searchTimer = null;

/* ==========================
   Store Zustand
========================== */
const useMapboxListingsStore = create()(
  devtools(
    persist(
      immer((set, get) => ({
        /* --------- MAP --------- */
        map: {
          isLoaded: false,
          isLoading: false,
          coordinates: MAPBOX_CONFIG.center, // [lng, lat]
          bounds: null,
          zoom: MAPBOX_CONFIG.zoom,
          minZoom: MAPBOX_CONFIG.minZoom,
          maxZoom: MAPBOX_CONFIG.maxZoom,
          style: MAPBOX_CONFIG.style,
          mapInstance: null,
          bearing: 0,
          pitch: 0,
        },

        /* --------- LISTINGS --------- */
        listings: {
          all: [],
          visible: [],
          filtered: [],
          isLoading: false,
          hasMore: true,
          page: 1,
          totalCount: 0,
        },

        /* --------- INTERACTIONS --------- */
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

        /* --------- FILTRES --------- */
        filters: initialFilters,
        filtersHydrated: false,

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
            s.filters = makeInitialFilters();
            s.listings.filtered = filterListings(s.listings.all, s.filters);
            s.listings.visible = s.listings.filtered;
          }),

        setFiltersHydrated: (v) =>
          set((s) => {
            s.filtersHydrated = !!v;
          }),

        /* --------- MAP setters --------- */
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

        /* --------- LISTINGS actions --------- */
        setAllListings: (listings) =>
          set((s) => {
            s.listings.all = listings || [];
            s.listings.filtered = filterListings(s.listings.all, s.filters);
            s.listings.visible = s.listings.filtered;
          }),

        /* --------- FETCH (avec alias & mapping) --------- */
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

            // Appliquer les filtres actifs
            Object.entries(state.filters).forEach(([key, values]) => {
              if (!values || values.length === 0) return;

              if (key === "mapType") {
                const mapped = values
                  .map((v) => MAP_TYPE_TO_ENUM[v])
                  .filter(Boolean);
                if (mapped.length > 0) {
                  query = query.contains("production_method", mapped);
                }
              } else {
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
              // Fallback fenêtre autour du center selon le zoom
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

        /* --------- Recherche dans la zone (debounce) --------- */
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

        /* --------- Helpers conversions --------- */
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

        // 🔁 Versionnage + migration des anciens defaults → Europe de l’Ouest
        version: 3,
        migrate: (persisted, fromVersion) => {
          if (!persisted || fromVersion >= 3) return persisted;

          try {
            const coords = persisted.map?.coordinates;
            const zoom = persisted.map?.zoom;

            const approxEq = (a, b, eps = 1e-3) =>
              typeof a === "number" &&
              typeof b === "number" &&
              Math.abs(a - b) < eps;

            // anciens defaults à migrer :
            const oldFR =
              Array.isArray(coords) &&
              coords.length === 2 &&
              approxEq(coords[0], 1.88) &&
              approxEq(coords[1], 46.6) &&
              approxEq(zoom ?? 0, 6);

            const oldEU =
              Array.isArray(coords) &&
              coords.length === 2 &&
              approxEq(coords[0], 15.2551) &&
              approxEq(coords[1], 54.526) &&
              approxEq(zoom ?? 0, 4.2);

            if (oldFR || oldEU) {
              persisted.map.coordinates = [...MAPBOX_CONFIG.center];
              persisted.map.zoom = MAPBOX_CONFIG.zoom;
            }
          } catch {
            // no-op
          }
          return persisted;
        },

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

/* ==========================
   Hooks sélecteurs
========================== */
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

// 👇 renvoie directement l’objet des filtres
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

// ---- Interactions (exports attendus)
export const useInteractionsState = () =>
  useMapboxListingsStore((s) => s.interactions);
export const useInteractionsActions = () =>
  useMapboxListingsStore((s) => ({
    setHoveredListingId: s.setHoveredListingId,
    setSelectedListingId: s.setSelectedListingId,
    setOpenInfoWindowId: s.setOpenInfoWindowId,
  }));

export default useMapboxListingsStore;
