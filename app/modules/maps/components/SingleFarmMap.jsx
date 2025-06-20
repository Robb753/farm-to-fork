"use client";

import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import React from "react";

// ✅ Constantes définies hors du composant
const containerStyle = {
  width: "100%",
  height: "100%",
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
};

const GOOGLE_MAP_LIBRARIES = ["places"];

export default function SingleFarmMap({ lat, lng }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    mapIds: [process.env.NEXT_PUBLIC_MAP_ID],
    libraries: GOOGLE_MAP_LIBRARIES,
    language: "fr",
    region: "FR",
    version: "weekly",
  });

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 text-gray-600">
        Chargement de la carte...
      </div>
    );
  }

  const center = { lat: parseFloat(lat), lng: parseFloat(lng) };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
      options={mapOptions}
    >
      <MarkerF position={center} />
    </GoogleMap>
  );
}
