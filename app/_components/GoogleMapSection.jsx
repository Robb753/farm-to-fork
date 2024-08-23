import React, { useEffect, useRef, useState } from "react";
import { Wrapper } from "@googlemaps/react-wrapper";
import GoogleMarkerItem from "./GoogleMarkerItem";

const mapOption = {
  mapId: process.env.NEXT_PUBLIC_MAP_ID,
  zoom: 11,
  disableDefaultUI: true,
  zoomControl: true,
};

function MyMap({
  coordinates,
  listing,
  setSelectedListing,
  selectedListing,
  setVisibleListings, // Ajout d'une fonction pour mettre à jour les fermes visibles
  isMapExpanded,
}) {
  const [map, setMap] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        ...mapOption,
        center: coordinates || { lat: 48.8575, lng: 2.23453 },
      });
      setMap(newMap);
    }
  }, [ref, map, coordinates]);

  useEffect(() => {
    if (map && coordinates) {
      map.setCenter(coordinates);
    }
  }, [coordinates, map]);

  // Ajout d'un useEffect pour écouter les changements de vue de la carte
  useEffect(() => {
    if (map) {
      const handleBoundsChanged = () => {
        const bounds = map.getBounds();
        if (bounds) {
          const visibleListings = listing.filter((item) => {
            const { lat, lng } = item.coordinates;
            return (
              bounds.getSouthWest().lat() <= lat &&
              bounds.getNorthEast().lat() >= lat &&
              bounds.getSouthWest().lng() <= lng &&
              bounds.getNorthEast().lng() >= lng
            );
          });
          setVisibleListings(visibleListings);
        }
      };

      // Écoute l'événement de changement de vue de la carte
      map.addListener("bounds_changed", handleBoundsChanged);

      // Effectue le filtrage initial lorsque la carte est chargée
      handleBoundsChanged();

      // Nettoie l'événement à la désactivation du composant
      return () => {
        window.google.maps.event.clearListeners(map, "bounds_changed");
      };
    }
  }, [map, listing, setVisibleListings]);

  return (
    <div
      ref={ref}
      id="map"
      style={{
        width: "100%",
        height: "80vh",
        borderRadius: isMapExpanded ? 0 : 10,
      }}
    >
      {map &&
        listing.map((item, index) => {
          return (
            <GoogleMarkerItem
              key={item.id}
              map={map}
              item={item}
              index={index}
              setSelectedListing={setSelectedListing}
              selectedListing={selectedListing}
            />
          );
        })}
    </div>
  );
}

export default function GoogleMapSection({
  coordinates,
  listing,
  isMapExpanded,
  setVisibleListings, // Ajout de la fonction de filtrage
}) {
  const [selectedListing, setSelectedListing] = useState(null);
  return (
    <div className={isMapExpanded ? "fixed inset-1 z-10" : ""}>
      <Wrapper
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_PLACE_API_KEY}
        version="beta"
        libraries={["marker"]}
      >
        <MyMap
          coordinates={coordinates}
          listing={listing}
          setSelectedListing={setSelectedListing}
          selectedListing={selectedListing}
          setVisibleListings={setVisibleListings} // Passe la fonction au composant enfant
        />
      </Wrapper>
    </div>
  );
}
