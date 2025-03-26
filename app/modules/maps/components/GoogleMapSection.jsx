"use client";

import React, { useEffect, useRef, useState } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import GoogleMarkerItem from "./GoogleMarkerItem";
import { useMapListing } from "@/app/contexts/MapListingContext";
import { useCoordinates } from "@/app/contexts/CoordinateContext";

function MyMap({ setSelectedListing, isMapExpanded }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const { coordinates } = useCoordinates();
  const mapListingContext = useMapListing();
  const { visibleListings, listings, setVisibleListings } =
    mapListingContext || {
      listings: [],
      visibleListings: [],
      setVisibleListings: () => {},
    };

  const [isLoaded, setIsLoaded] = useState(false);

  // ✅ Vérifier si Google Maps API est bien chargée
  useEffect(() => {
    const checkGoogleMaps = setInterval(() => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        clearInterval(checkGoogleMaps);
      }
    }, 500);

    return () => clearInterval(checkGoogleMaps);
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const initializeMap = async () => {
      if (mapInstance.current) return; // ✅ Empêche la recréation de la carte si déjà initialisée

      const { ColorScheme } = await window.google.maps.importLibrary("core");

      const newMap = new window.google.maps.Map(mapRef.current, {
        mapId: process.env.NEXT_PUBLIC_MAP_ID,
        center: coordinates || { lat: 48.8575, lng: 2.23453 },
        zoom: 12,
        disableDefaultUI: true,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.TOP_RIGHT, // ✅ Déplace les boutons en haut à droite
        },
        mapTypeId: "roadmap",
        mapTypeControl: false,
        colorScheme: ColorScheme.LIGHT,
      });

      mapInstance.current = newMap;

      newMap.addListener("idle", () => {
        const bounds = newMap.getBounds();
        if (bounds) {
          const filteredListings = listings.filter(
            ({ coordinates: { lat, lng } }) => bounds.contains({ lat, lng })
          );
          setVisibleListings(filteredListings);
        }
      });
    };

    initializeMap();
  }, [isLoaded, listings, setVisibleListings, coordinates]);

  // ✅ Forcer la mise à jour de la carte après changement `isMapExpanded`
  useEffect(() => {
    if (mapInstance.current) {
      setTimeout(() => {
        window.google.maps.event.trigger(mapInstance.current, "resize");
        mapInstance.current.setCenter(coordinates);
      }, 300); // ✅ Petit délai pour éviter un bug d'affichage
    }
  }, [isMapExpanded]);

  return (
    <div
      ref={mapRef}
      id="map"
      className={`transition-all duration-300 ${
        isMapExpanded
          ? "fixed -top-[40px] left-0 w-full h-[calc(100vh-80px)] z-10"
          : "w-[65vw] lg:w-[55vw] xl:w-[50vw] h-[100vh] mx-auto rounded-lg shadow-md"
      }`}
    >
      {mapInstance.current &&
        visibleListings.map((item) => (
          <GoogleMarkerItem
            key={item.id}
            map={mapInstance.current}
            item={item}
            setSelectedListing={setSelectedListing}
            clearInfoWindows={() => {}}
          />
        ))}
    </div>
  );
}

export default function GoogleMapSection({ isMapExpanded }) {
  const [selectedListing, setSelectedListing] = useState(null);

  return (
    <div className={`relative w-full transition-all duration-300`}>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_PLACE_API_KEY}>
        <MyMap
          setSelectedListing={setSelectedListing}
          isMapExpanded={isMapExpanded}
        />
      </APIProvider>
    </div>
  );
}
