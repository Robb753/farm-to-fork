// app/contexts/MapDataContext/MapStateContext.js

"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
} from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const GOOGLE_MAPS_LIBRARIES = ["places"];

const MapStateContext = createContext(null);

const initialState = {
  coordinates: null,
};

const ActionTypes = {
  SET_COORDINATES: "SET_COORDINATES",
};

function reducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_COORDINATES:
      return { ...state, coordinates: action.payload };
    default:
      return state;
  }
}

export function MapStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACE_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // ✅ Callback stable et mémoïsée pour éviter les changements inutiles
  const setCoordinates = useCallback((coords) => {
    if (
      !coords ||
      typeof coords.lat !== "number" ||
      typeof coords.lng !== "number"
    )
      return;
    dispatch({ type: ActionTypes.SET_COORDINATES, payload: coords });
  }, []);

  // ✅ Valeur mémoïsée sans dépendance inutile sur state entier
  const value = useMemo(
    () => ({
      coordinates: state.coordinates,
      setCoordinates,
      isApiLoaded: isLoaded,
    }),
    [state.coordinates, setCoordinates, isLoaded]
  );

  return (
    <MapStateContext.Provider value={value}>
      {children}
    </MapStateContext.Provider>
  );
}

export function useMapState() {
  const context = useContext(MapStateContext);
  if (!context) {
    throw new Error("useMapState must be used within a MapStateProvider");
  }
  return context;
}
