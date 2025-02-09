import React, { useEffect, useRef } from "react";
import { SearchIcon } from "lucide-react";
import { useGoogleMaps } from "../contexts/GoogleMapsContext";
import { useCoordinates } from "../contexts/CoordinateContext";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";

function GoogleAddressSearch({
  selectedAddress,
  setCoordinates,
  onAddressChange,
}) {
  const { isApiLoaded } = useGoogleMaps();
  const inputRef = useRef(null);
  const { coordinates, setCoordinates: setLocalCoordinates } = useCoordinates();
  const router = useRouter();

  // Déplace `handleViewMapClick` ici pour qu'il soit accessible
  const handleViewMapClick = () => {
    if (coordinates?.lat && coordinates?.lng) {
      const query = new URLSearchParams({
        lat: coordinates.lat.toString(),
        lng: coordinates.lng.toString(),
      }).toString();
      router.push(`/productor?${query}`);
    } else {
      toast.error("Veuillez sélectionner une adresse valide");
      <Toaster richColors />;
    }
  };

  useEffect(() => {
    if (isApiLoaded && inputRef.current) {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["geocode"],
          componentRestrictions: { country: "fr" },
        }
      );

      const handlePlaceChanged = () => {
        const place = autocompleteInstance.getPlace();
        if (!place || !place.geometry) {
          selectedAddress(null);
          setLocalCoordinates({ lat: 48.8575, lng: 2.23453 }); // Coordonnées par défaut (Paris)
          if (onAddressChange) onAddressChange(null);
          return;
        }

        selectedAddress(place);
        const latLng = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setLocalCoordinates(latLng);
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
  }, [
    isApiLoaded,
    selectedAddress,
    setLocalCoordinates,
    setCoordinates,
    onAddressChange,
  ]);

  return (
    <div className="flex items-center md:border-2 rounded-full py-2 md:shadow-sm px-2 sm:px-4">
      {/* Input field */}
      <input
        type="text"
        ref={inputRef}
        placeholder="Start Your Search"
        className="flex-grow pl-2 sm:pl-5 bg-transparent outline-none text-sm sm:text-base"
      />

      {/* Search icon */}
      <div onClick={handleViewMapClick} className="hidden md:inline-flex">
        <SearchIcon className="h-5 w-5 sm:h-7 sm:w-7 bg-primary text-white rounded-full p-1 cursor-pointer md:mx-2 transition-transform transform hover:scale-110 duration-200 ease-out" />
      </div>
    </div>
  );
}

export default GoogleAddressSearch;
