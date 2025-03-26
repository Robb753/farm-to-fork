"use client";

import React, { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useGoogleMaps } from "../../../contexts/GoogleMapsContext";
import { useCoordinates } from "../../../contexts/CoordinateContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function GoogleAddressSearchForHeader({ selectedAddress, onAddressChange }) {
  const { isApiLoaded } = useGoogleMaps();
  const inputRef = useRef(null);
  const { setCoordinates } = useCoordinates();
  const router = useRouter();

  useEffect(() => {
    if (!isApiLoaded || !inputRef.current) return;

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
        toast.error("Veuillez sélectionner une ville valide");
        if (onAddressChange) onAddressChange(null);
        return;
      }

      const latLng = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      // ✅ Mise à jour des coordonnées globales
      setCoordinates(latLng);
      if (selectedAddress) selectedAddress(place);
      if (onAddressChange) onAddressChange(place);

      // ✅ Redirection vers `/explore` avec les coordonnées
      router.push(`/explore?lat=${latLng.lat}&lng=${latLng.lng}`);
    };

    autocompleteInstance.addListener("place_changed", handlePlaceChanged);

    return () => {
      window.google.maps.event.clearInstanceListeners(autocompleteInstance);
    };
  }, [isApiLoaded, selectedAddress, setCoordinates, onAddressChange, router]);

  return (
    <div className="flex items-center border-2 rounded-full py-2 px-4 shadow-lg bg-white max-w-lg w-full">
      <Search className="h-5 w-5 text-gray-500 mr-3" />
      <input
        type="text"
        ref={inputRef}
        placeholder="Sélectionner votre ville"
        className="flex-grow bg-transparent outline-none text-sm text-black"
        onFocus={() => inputRef.current?.select()}
      />
    </div>
  );
}

export default GoogleAddressSearchForHeader;
