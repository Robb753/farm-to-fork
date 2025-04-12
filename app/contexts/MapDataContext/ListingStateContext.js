// app/contexts/MapDataContext/ListingStateContext.js

"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase/client";
import { useFilterState } from "./FilterStateContext";
import { useMapState } from "./MapStateContext";

const ListingStateContext = createContext(null);

const initialState = {
  all: [],
  visible: [],
  hoveredId: null,
  selectedId: null,
  openInfoWindowId: null,
  isLoading: false,
  dataFetched: false,
  hasMore: true,
  requestId: 0,
  lastQueryParams: null,
};

const ActionTypes = {
  SET_ALL: "SET_ALL",
  SET_VISIBLE: "SET_VISIBLE",
  SET_HOVERED: "SET_HOVERED",
  SET_SELECTED: "SET_SELECTED",
  SET_INFO_WINDOW: "SET_INFO_WINDOW",
  CLEAR_SELECTION: "CLEAR_SELECTION",
  SET_LOADING: "SET_LOADING",
  SET_DATA_FETCHED: "SET_DATA_FETCHED",
  SET_HAS_MORE: "SET_HAS_MORE",
  INCREMENT_REQUEST_ID: "INCREMENT_REQUEST_ID",
};

function reducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_ALL:
      return { ...state, all: action.payload };
    case ActionTypes.SET_VISIBLE:
      return { ...state, visible: action.payload };
    case ActionTypes.SET_HOVERED:
      return { ...state, hoveredId: action.payload };
    case ActionTypes.SET_SELECTED:
      return {
        ...state,
        selectedId: action.payload,
        openInfoWindowId: action.payload,
      };
    case ActionTypes.SET_INFO_WINDOW:
      return { ...state, openInfoWindowId: action.payload };
    case ActionTypes.CLEAR_SELECTION:
      return { ...state, selectedId: null, openInfoWindowId: null };
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ActionTypes.SET_DATA_FETCHED:
      return { ...state, dataFetched: action.payload };
    case ActionTypes.SET_HAS_MORE:
      return { ...state, hasMore: action.payload };
    case ActionTypes.INCREMENT_REQUEST_ID:
      return {
        ...state,
        requestId: state.requestId + 1,
        lastQueryParams: action.payload || state.lastQueryParams,
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

export function ListingStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { filters } = useFilterState();
  const { coordinates } = useMapState();
  const stateRef = useRef(state);

  stateRef.current = state;

  const fetchListings = useCallback(
    async ({ page = 1, append = false, forceRefresh = false } = {}) => {
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
        queryString === stateRef.current.lastQueryParams &&
        stateRef.current.all.length > 0
      ) {
        return stateRef.current.all;
      }
      if (stateRef.current.isLoading) return stateRef.current.all;

      dispatch({
        type: ActionTypes.INCREMENT_REQUEST_ID,
        payload: queryString,
      });
      const currentId = stateRef.current.requestId + 1;
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

        if (currentId !== stateRef.current.requestId)
          return stateRef.current.all;
        if (error) {
          toast.error(
            "Erreur lors de la recherche des listings : " + error.message
          );
          return stateRef.current.all;
        }

        dispatch({
          type: ActionTypes.SET_HAS_MORE,
          payload: data && data.length > 0,
        });

        const newData = append ? [...stateRef.current.all, ...data] : data;
        const newVisible = filterListingsInner(newData, filters);

        dispatch({ type: ActionTypes.SET_ALL, payload: newData });
        dispatch({ type: ActionTypes.SET_VISIBLE, payload: newVisible });
        dispatch({ type: ActionTypes.SET_DATA_FETCHED, payload: true });
        return newData;
      } catch (err) {
        console.error("Erreur dans fetchListings:", err);
        toast.error("Une erreur est survenue lors du chargement des listings.");
        return stateRef.current.all;
      } finally {
        if (currentId === stateRef.current.requestId) {
          dispatch({ type: ActionTypes.SET_LOADING, payload: false });
        }
      }
    },
    [filters, coordinates]
  );

  const value = useMemo(() => {
    return {
      listings: state.all,
      visibleListings: state.visible,
      hoveredListingId: state.hoveredId,
      selectedListingId: state.selectedId,
      openInfoWindowId: state.openInfoWindowId,
      isLoading: state.isLoading,
      dataFetched: state.dataFetched,
      hasMore: state.hasMore,
      setHoveredListingId: (id) =>
        dispatch({ type: ActionTypes.SET_HOVERED, payload: id }),
      setSelectedListingId: (id) =>
        dispatch({ type: ActionTypes.SET_SELECTED, payload: id }),
      setOpenInfoWindowId: (id) =>
        dispatch({ type: ActionTypes.SET_INFO_WINDOW, payload: id }),
      clearSelection: () => dispatch({ type: ActionTypes.CLEAR_SELECTION }),
      fetchListings,
      selectListing: (id) => {
        dispatch({ type: ActionTypes.SET_SELECTED, payload: id });
        requestAnimationFrame(() => {
          const el = document.getElementById(`listing-${id}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      },
    };
  }, [state, fetchListings]);

  return (
    <ListingStateContext.Provider value={value}>
      {children}
    </ListingStateContext.Provider>
  );
}

export function useListingState() {
  const context = useContext(ListingStateContext);
  if (!context) {
    throw new Error(
      "useListingState must be used within a ListingStateProvider"
    );
  }
  return context;
}
