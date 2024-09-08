import React, { useEffect, useRef, useState } from "react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import GoogleMarkerItem from "./GoogleMarkerItem";

function MyMap({
  coordinates,
  listing,
  setSelectedListing,
  onVisibleListingsChange,
  isMapExpanded,
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);

  useEffect(() => {
    const checkIfLoaded = setInterval(() => {
      if (window.google && window.google.maps) {
        setIsGoogleMapsReady(true);
        clearInterval(checkIfLoaded);
      }
    }, 100);

    return () => clearInterval(checkIfLoaded);
  }, []);

  useEffect(() => {
    const initializeMap = async () => {
      if (isGoogleMapsReady && mapRef.current && !map) {
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
      }
    };

    initializeMap();
  }, [isGoogleMapsReady, map, coordinates]);

  useEffect(() => {
    if (map && coordinates) {
      map.setCenter(coordinates);
    }
  }, [map, coordinates]);

  useEffect(() => {
    if (!map) return;

    const handleBoundsChanged = () => {
      const bounds = map.getBounds();
      if (bounds) {
        const visibleListings = listing.filter(
          ({ coordinates: { lat, lng } }) => bounds.contains({ lat, lng })
        );
        if (onVisibleListingsChange) {
          onVisibleListingsChange(visibleListings);
        }
      }
    };

    map.addListener("bounds_changed", handleBoundsChanged);
    handleBoundsChanged();

    return () => window.google.maps.event.clearListeners(map, "bounds_changed");
  }, [map, listing, onVisibleListingsChange]);

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
        listing.map((item) => (
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

export default function GoogleMapSection({
  coordinates,
  listing,
  isMapExpanded,
  onVisibleListingsChange,
}) {
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
          listing={listing}
          setSelectedListing={setSelectedListing}
          onVisibleListingsChange={onVisibleListingsChange}
          isMapExpanded={isMapExpanded}
        />
      </APIProvider>
    </div>
  );
}
