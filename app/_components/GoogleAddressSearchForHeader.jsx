import React, { useEffect, useRef, useState } from "react";
import { SearchIcon } from "lucide-react";
import { useGoogleMaps } from "../contexts/GoogleMapsContext";
import { useCoordinates } from "../contexts/CoordinateContext";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";

function GoogleAddressSearchForHeader({
  selectedAddress,
  setParentCoordinates,
  onAddressChange,
}) {
  const { isApiLoaded } = useGoogleMaps();
  const inputRef = useRef(null);
  const { coordinates, setCoordinates } = useCoordinates();
  const router = useRouter();

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
          toast.error("Veuillez sélectionner une adresse valide");
          return;
        }

        // Si un lieu valide est sélectionné
        selectedAddress(place);
        const latLng = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setCoordinates(latLng);
        setParentCoordinates(latLng);
        if (onAddressChange) onAddressChange(place);

        // Lance la recherche après la sélection d'un lieu
        const query = new URLSearchParams({
          lat: latLng.lat.toString(),
          lng: latLng.lng.toString(),
        }).toString();
        router.push(`/productor?${query}`);
      };

      autocompleteInstance.addListener("place_changed", handlePlaceChanged);
    }
  }, [
    isApiLoaded,
    selectedAddress,
    setCoordinates,
    onAddressChange,
    setParentCoordinates,
    router,
  ]);

  return (
    <div className="flex items-center md:border-2 rounded-full py-2 md:shadow-sm px-2 sm:px-4">
      <input
        type="text"
        ref={inputRef}
        placeholder="Start Your Search"
        className="flex-grow pl-2 sm:pl-5 bg-transparent outline-none text-sm sm:text-base"
      />

      <div
        onClick={() => toast.error("Veuillez sélectionner une adresse valide")}
        className="hidden md:inline-flex"
      >
        <SearchIcon className="h-5 w-5 sm:h-7 sm:w-7 bg-primary text-white rounded-full p-1 cursor-pointer md:mx-2 transition-transform transform hover:scale-110 duration-200 ease-out" />
      </div>
    </div>
  );
}

export default GoogleAddressSearchForHeader;
