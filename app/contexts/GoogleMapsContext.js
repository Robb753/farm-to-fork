"use client"
import React, { createContext, useContext, useState, useEffect } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const GoogleMapsContext = createContext();

export function GoogleMapsProvider({ children }) {
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACE_API_KEY,
    libraries: ["places"],
  });

  useEffect(() => {
    if (isLoaded) {
      setIsApiLoaded(true);
    }
  }, [isLoaded]);

  return (
    <GoogleMapsContext.Provider value={{ isApiLoaded, isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error("useGoogleMaps must be used within a GoogleMapsProvider");
  }
  return context;
}
