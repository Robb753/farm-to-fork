// app/contexts/MapDataContext.js
"use client";
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase/client";

const GOOGLE_MAPS_LIBRARIES = ["places"];

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

const initialFilters = Object.fromEntries(
  filterSections.map(({ key }) => [key, []])
);

const initialState = {
  map: { coordinates: null, isApiLoaded: false },
  listings: {
    all: [],
    visible: [],
    hoveredId: null,
    selectedId: null,
    openInfoWindowId: null,
  },
  filters: initialFilters,
  dataState: {
    isLoading: false,
    dataFetched: false,
    requestId: 0,
    lastQueryParams: null,
    hasMore: true,
  },
};

const ActionTypes = {
  SET_COORDINATES: "SET_COORDINATES",
  SET_API_LOADED: "SET_API_LOADED",
  SET_LISTINGS: "SET_LISTINGS",
  SET_VISIBLE_LISTINGS: "SET_VISIBLE_LISTINGS",
  SET_HOVERED_LISTING: "SET_HOVERED_LISTING",
  SET_SELECTED_LISTING: "SET_SELECTED_LISTING",
  SET_INFO_WINDOW: "SET_INFO_WINDOW",
  CLEAR_SELECTION: "CLEAR_SELECTION",
  TOGGLE_FILTER: "TOGGLE_FILTER",
  RESET_FILTERS: "RESET_FILTERS",
  SET_LOADING: "SET_LOADING",
  SET_DATA_FETCHED: "SET_DATA_FETCHED",
  INCREMENT_REQUEST_ID: "INCREMENT_REQUEST_ID",
  SET_HAS_MORE: "SET_HAS_MORE",
};

function mapDataReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_COORDINATES:
      return {
        ...state,
        map: { ...state.map, coordinates: action.payload },
      };
    case ActionTypes.SET_API_LOADED:
      return {
        ...state,
        map: { ...state.map, isApiLoaded: action.payload },
      };
    case ActionTypes.SET_LISTINGS: {
      const allListings = action.payload;
      const visibleListings = filterListingsInner(allListings, state.filters);
      return {
        ...state,
        listings: {
          ...state.listings,
          all: allListings,
          visible: visibleListings,
        },
      };
    }
    case ActionTypes.SET_VISIBLE_LISTINGS:
      return {
        ...state,
        listings: { ...state.listings, visible: action.payload },
      };
    case ActionTypes.SET_HOVERED_LISTING:
      return {
        ...state,
        listings: { ...state.listings, hoveredId: action.payload },
      };
    case ActionTypes.SET_SELECTED_LISTING:
      return {
        ...state,
        listings: {
          ...state.listings,
          selectedId: action.payload,
          openInfoWindowId: action.payload,
        },
      };
    case ActionTypes.SET_INFO_WINDOW:
      return {
        ...state,
        listings: { ...state.listings, openInfoWindowId: action.payload },
      };
    case ActionTypes.CLEAR_SELECTION:
      return {
        ...state,
        listings: {
          ...state.listings,
          selectedId: null,
          openInfoWindowId: null,
        },
      };
    case ActionTypes.TOGGLE_FILTER: {
      const { filterKey, value } = action.payload;
      const current = state.filters[filterKey] || [];
      const newFilter = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const newFilters = { ...state.filters, [filterKey]: newFilter };
      const visibleListings = filterListingsInner(
        state.listings.all,
        newFilters
      );
      return {
        ...state,
        filters: newFilters,
        listings: { ...state.listings, visible: visibleListings },
      };
    }
    case ActionTypes.RESET_FILTERS:
      return {
        ...state,
        filters: initialFilters,
        listings: { ...state.listings, visible: state.listings.all },
      };
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        dataState: { ...state.dataState, isLoading: action.payload },
      };
    case ActionTypes.SET_DATA_FETCHED:
      return {
        ...state,
        dataState: { ...state.dataState, dataFetched: action.payload },
      };
    case ActionTypes.SET_HAS_MORE:
      return {
        ...state,
        dataState: { ...state.dataState, hasMore: action.payload },
      };
    case ActionTypes.INCREMENT_REQUEST_ID:
      return {
        ...state,
        dataState: {
          ...state.dataState,
          requestId: state.dataState.requestId + 1,
          lastQueryParams: action.payload || state.dataState.lastQueryParams,
        },
      };
    default:
      return state;
  }
}

function filterListingsInner(allListings, filters) {
  const hasActive = Object.values(filters).some((arr) => arr.length > 0);
  if (!hasActive) return allListings;
  return allListings.filter((listing) =>
    Object.entries(filters).every(([key, values]) => {
      if (values.length === 0) return true;
      const listingValues = Array.isArray(listing[key])
        ? listing[key]
        : [listing[key]];
      return values.some((v) => listingValues.includes(v));
    })
  );
}

const MapDataContext = createContext(null);

export function MapDataProvider({ children }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACE_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [state, dispatch] = useReducer(mapDataReducer, initialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (isLoaded) {
      dispatch({ type: ActionTypes.SET_API_LOADED, payload: true });
    }
  }, [isLoaded]);

  const setCoordinates = (coords) => {
    if (
      !coords ||
      typeof coords.lat !== "number" ||
      typeof coords.lng !== "number"
    )
      return;
    dispatch({ type: ActionTypes.SET_COORDINATES, payload: coords });
  };

  const fetchListings = useCallback(
    async ({
      page = 1,
      append = false,
      forceRefresh = false,
      filters = stateRef.current.filters,
      coordinates = stateRef.current.map.coordinates,
    } = {}) => {
      const queryParams = {
        page,
        filters: JSON.stringify(filters),
        coordinates: coordinates
          ? `${coordinates.lat},${coordinates.lng}`
          : null,
      };
      const queryString = JSON.stringify(queryParams);

      if (
        !forceRefresh &&
        queryString === stateRef.current.dataState.lastQueryParams &&
        stateRef.current.listings.all.length > 0
      ) {
        return stateRef.current.listings.all;
      }
      if (stateRef.current.dataState.isLoading)
        return stateRef.current.listings.all;

      dispatch({
        type: ActionTypes.INCREMENT_REQUEST_ID,
        payload: queryString,
      });
      const currentId = stateRef.current.dataState.requestId + 1;
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });

      try {
        let query = supabase
          .from("listing")
          .select("*, listingImages(url, listing_id)")
          .eq("active", true)
          .order("id", { ascending: false })
          .range((page - 1) * 10, page * 10 - 1);

        const activeFilters = Object.keys(filters)
          .filter((k) => filters[k]?.length > 0)
          .map((k) => `${k}.cs.{${filters[k].join(",")}}`)
          .join(",");

        if (activeFilters) query = query.or(activeFilters);

        const { data, error } = await query;

        if (currentId !== stateRef.current.dataState.requestId)
          return stateRef.current.listings.all;
        if (error) {
          toast.error(
            "Erreur lors de la recherche des listings : " + error.message
          );
          return stateRef.current.listings.all;
        }

        dispatch({
          type: ActionTypes.SET_HAS_MORE,
          payload: data && data.length > 0,
        });

        const newData = append
          ? [...stateRef.current.listings.all, ...data]
          : data;
        dispatch({ type: ActionTypes.SET_LISTINGS, payload: newData });
        dispatch({ type: ActionTypes.SET_DATA_FETCHED, payload: true });
        return newData;
      } catch (err) {
        console.error("Erreur dans fetchListings:", err);
        toast.error("Une erreur est survenue lors du chargement des listings.");
        return stateRef.current.listings.all;
      } finally {
        if (currentId === stateRef.current.dataState.requestId) {
          dispatch({ type: ActionTypes.SET_LOADING, payload: false });
        }
      }
    },
    []
  );

  const actions = {
    setCoordinates,
    setListings: (listings) =>
      dispatch({ type: ActionTypes.SET_LISTINGS, payload: listings }),
    setVisibleListings: (listings) =>
      dispatch({ type: ActionTypes.SET_VISIBLE_LISTINGS, payload: listings }),
    setHoveredListingId: (id) =>
      dispatch({ type: ActionTypes.SET_HOVERED_LISTING, payload: id }),
    setSelectedListingId: (id) =>
      dispatch({ type: ActionTypes.SET_SELECTED_LISTING, payload: id }),
    setOpenInfoWindowId: (id) =>
      dispatch({ type: ActionTypes.SET_INFO_WINDOW, payload: id }),
    selectListing: (id) => {
      dispatch({ type: ActionTypes.SET_SELECTED_LISTING, payload: id });
      requestAnimationFrame(() => {
        const el = document.getElementById(`listing-${id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    },
    clearSelection: () => dispatch({ type: ActionTypes.CLEAR_SELECTION }),
    toggleFilter: (filterKey, value) => {
      dispatch({
        type: ActionTypes.TOGGLE_FILTER,
        payload: { filterKey, value },
      });
    },
    resetFilters: () => dispatch({ type: ActionTypes.RESET_FILTERS }),
    fetchListings,
  };

  const contextValue = useMemo(
    () => ({
      coordinates: state.map.coordinates,
      setCoordinates: actions.setCoordinates,
      isApiLoaded: state.map.isApiLoaded,
      isGoogleMapsLoaded: isLoaded,
      googleMapsLoadError: loadError,
      listings: state.listings.all,
      setListings: actions.setListings,
      visibleListings: state.listings.visible,
      setVisibleListings: actions.setVisibleListings,
      hoveredListingId: state.listings.hoveredId,
      setHoveredListingId: actions.setHoveredListingId,
      selectedListingId: state.listings.selectedId,
      setSelectedListingId: actions.setSelectedListingId,
      openInfoWindowId: state.listings.openInfoWindowId,
      setOpenInfoWindowId: actions.setOpenInfoWindowId,
      selectListing: actions.selectListing,
      clearSelection: actions.clearSelection,
      filters: state.filters,
      toggleFilter: actions.toggleFilter,
      resetFilters: actions.resetFilters,
      isLoading: state.dataState.isLoading,
      dataFetched: state.dataState.dataFetched,
      hasMore: state.dataState.hasMore,
      fetchListings: actions.fetchListings,
      filterListings: (listings, filters) =>
        filterListingsInner(listings, filters),
    }),
    [state, isLoaded, loadError, fetchListings]
  );

  return (
    <MapDataContext.Provider value={contextValue}>
      {children}
    </MapDataContext.Provider>
  );
}

export function useMapData() {
  const context = useContext(MapDataContext);
  if (!context) {
    console.warn("useMapData doit être utilisé dans un MapDataProvider");
    return {};
  }
  return context;
}
