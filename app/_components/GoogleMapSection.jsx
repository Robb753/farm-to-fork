import React, { useEffect, useRef, useState } from "react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import GoogleMarkerItem from "./GoogleMarkerItem";
import { useMapListing } from "../contexts/MapListingContext";

function MyMap({ coordinates, setSelectedListing, isMapExpanded }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const mapListingContext = useMapListing();
  const { visibleListings, listings, setVisibleListings } =
    mapListingContext || {
      listings: [], // Toutes les fermes disponibles
      visibleListings: [],
      setVisibleListings: () => {},
    };

  // Vérifier si Google Maps est prêt
  useEffect(() => {
    if (!window.google || !window.google.maps) {
      console.error("Google Maps API not loaded");
      return;
    }

    if (mapRef.current && !map) {
      const initializeMap = async () => {
        const { ColorScheme } = await window.google.maps.importLibrary("core");

        const newMap = new window.google.maps.Map(mapRef.current, {
          mapId: process.env.NEXT_PUBLIC_MAP_ID,
          center: coordinates || { lat: 48.8575, lng: 2.23453 },
          zoom: 12,
          scaleControlOptions: 1,
          disableDefaultUI: true,
          streetViewControl: false,
          zoomControl: true,
          gestureHandling: "cooperative",
          mapTypeId: "roadmap",
          mapTypeControl: false,
          colorScheme: ColorScheme.LIGHT,
        });

        setMap(newMap);
      };

      initializeMap();
    }
  }, [map, coordinates]);

  // Centrer la carte quand les coordonnées changent
  useEffect(() => {
    if (map && coordinates) {
      map.setCenter(coordinates);
    }
  }, [map, coordinates]);

  // Gérer l'affichage des fermes visibles selon les limites de la carte
  useEffect(() => {
    if (!map || !listings) return; // Assurer que la carte et les fermes sont disponibles

    const handleBoundsChanged = () => {
      const bounds = map.getBounds();
      if (bounds) {
        // Filtrer les fermes visibles dans la zone actuelle de la carte
        const filteredListings = listings.filter(
          ({ coordinates: { lat, lng } }) => bounds.contains({ lat, lng })
        );

        // Mettre à jour les fermes visibles dans le contexte uniquement si elles changent
        setVisibleListings((prevListings) => {
          const prevIds = prevListings.map((item) => item.id);
          const newIds = filteredListings.map((item) => item.id);
          if (JSON.stringify(prevIds) !== JSON.stringify(newIds)) {
            return filteredListings;
          }
          return prevListings; // Ne change rien si c'est la même liste
        });
      }
    };

    const boundsListener = map.addListener("idle", handleBoundsChanged);

    // Nettoyage du listener lors du démontage
    return () => {
      if (boundsListener) {
        window.google.maps.event.removeListener(boundsListener);
      }
    };
  }, [map, listings]); // Retirer `setVisibleListings` des dépendances

  return (
    <div
      ref={mapRef}
      id="map"
      className="flex-grow"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: isMapExpanded ? 0 : 10,
      }}
    >
      {map &&
        visibleListings.map((item) => (
          <GoogleMarkerItem
            key={item.id}
            map={map}
            item={item}
            setSelectedListing={setSelectedListing}
            clearInfoWindows={() => {}}
          />
        ))}
    </div>
  );
}

export default function GoogleMapSection({ coordinates, isMapExpanded }) {
  const [selectedListing, setSelectedListing] = useState(null);

  return (
    <div
      className={`flex-grow flex flex-col ${
        isMapExpanded ? "fixed inset-1 mt-6" : ""
      }`}
    >
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_PLACE_API_KEY}>
        <MyMap
          coordinates={coordinates}
          setSelectedListing={setSelectedListing}
          isMapExpanded={isMapExpanded}
        />
      </APIProvider>
    </div>
  );
}
