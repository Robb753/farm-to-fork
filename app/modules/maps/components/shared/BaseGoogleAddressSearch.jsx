"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMapState } from "@/app/contexts/MapDataContext/MapStateContext";

function GoogleAddressSearchForHeader({ selectedAddress, onAddressChange }) {
  const { isApiLoaded, setCoordinates } = useMapState();
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const router = useRouter();

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place || !place.geometry || !place.geometry.location) {
      toast.error("Veuillez sélectionner une ville valide");
      if (onAddressChange) onAddressChange(null);
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const latLng = { lat, lng };

    setCoordinates(latLng);

    if (selectedAddress) selectedAddress(place);
    if (onAddressChange) onAddressChange(place);

    router.push(`/explore?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`);
  }, [selectedAddress, onAddressChange, setCoordinates, router]);

  useEffect(() => {
    if (!isApiLoaded || !inputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["(cities)"],
        componentRestrictions: { country: "fr" },
        fields: ["geometry", "name", "formatted_address", "place_id"],
      }
    );

    autocompleteRef.current = autocomplete;

    // ✅ utilise la fonction callback existante
    autocomplete.addListener("place_changed", handlePlaceChanged);

    // ✅ permet à "Entrée" de simuler une sélection même si on ne clique pas
    const inputEl = inputRef.current;
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();

        const arrowDown = new KeyboardEvent("keydown", {
          key: "ArrowDown",
          code: "ArrowDown",
          keyCode: 40,
          which: 40,
          bubbles: true,
        });

        inputEl.dispatchEvent(arrowDown);

        setTimeout(() => {
          const enter = new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
          });
          inputEl.dispatchEvent(enter);
        }, 100);
      }
    };

    inputEl.addEventListener("keydown", handleKeyDown);

    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
      inputEl.removeEventListener("keydown", handleKeyDown);
    };
  }, [isApiLoaded, handlePlaceChanged]);

  return (
    <div className="flex items-center border-2 rounded-full py-2 px-4 shadow-lg bg-white max-w-lg w-full">
      <Search className="h-5 w-5 text-gray-500 mr-3" />
      <input
        type="text"
        ref={inputRef}
        placeholder="Sélectionner votre ville"
        className="flex-grow bg-transparent outline-none text-sm text-black"
        onFocus={() => inputRef.current?.select()}
        aria-label="Recherche d'adresse"
      />
    </div>
  );
}

export default GoogleAddressSearchForHeader;
