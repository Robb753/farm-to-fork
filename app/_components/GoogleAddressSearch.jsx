import React, { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { useGoogleMaps } from "../contexts/GoogleMapsContext";

function GoogleAddressSearch({
  selectedAddress,
  setCoordinates,
  onAddressChange,
}) {
  const { isApiLoaded } = useGoogleMaps();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isApiLoaded && inputRef.current) {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["(cities)"],
          componentRestrictions: { country: "fr" },
        }
      );

      const handlePlaceChanged = () => {
        const place = autocompleteInstance.getPlace();
        if (!place || !place.geometry) {
          selectedAddress(null);
          setCoordinates({ lat: 48.8575, lng: 2.23453 }); // Coordonnées par défaut (Paris)
          if (onAddressChange) onAddressChange(null);
          return;
        }

        selectedAddress(place);
        const latLng = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setCoordinates(latLng);
        if (onAddressChange) onAddressChange(place);
      };

      autocompleteInstance.addListener("place_changed", handlePlaceChanged);

      const handleKeyDown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault(); // Empêche l'envoi du formulaire si nécessaire
          handlePlaceChanged(); // Exécute la logique de recherche
        }
      };

      inputRef.current.addEventListener("keydown", handleKeyDown);

      return () => {
        if (inputRef.current) {
          inputRef.current.removeEventListener("keydown", handleKeyDown);
        }
      };
    }
  }, [isApiLoaded, selectedAddress, setCoordinates, onAddressChange]);

  return (
    <div className="flex items-center bg-slate-200">
      <MapPin className="h-8 w-8 p-2 bg-primary sm:h-10 sm:w-10" />
      <input
        ref={inputRef}
        placeholder="Search"
        className="w-full text-sm sm:text-base p-2"
      />
    </div>
  );
}

export default GoogleAddressSearch;
