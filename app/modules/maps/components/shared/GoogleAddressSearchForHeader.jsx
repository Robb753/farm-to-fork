"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Search, MapPin } from "@/utils/icons";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMapState } from "@/app/contexts/MapDataContext/MapStateContext";

function GoogleAddressSearchForHeader({ selectedAddress, onAddressChange }) {
  const { isApiLoaded, setCoordinates } = useMapState();
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const selectedPlaceRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handlePlaceChanged = useCallback(() => {
    try {
      setIsLoading(true);
      const place = autocompleteRef.current?.getPlace();

      if (!place || !place.geometry || !place.geometry.location) {
        console.warn("Aucun lieu valide sélectionné");
        setIsLoading(false);
        toast.error("Veuillez sélectionner une ville dans la liste");
        if (onAddressChange) onAddressChange(null);
        return;
      }
      selectedPlaceRef.current = place;

      if (place.formatted_address) {
        setSearchText(place.formatted_address);
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const latLng = { lat, lng };

      setCoordinates(latLng);
      if (selectedAddress) selectedAddress({ value: place });
      if (onAddressChange) onAddressChange(place);

      router.push(`/explore?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`);
      setIsLoading(false);
    } catch (error) {
      console.error("Erreur lors de la sélection du lieu:", error);
      toast.error("Une erreur s'est produite. Veuillez réessayer.");
      setIsLoading(false);
    }
  }, [selectedAddress, onAddressChange, setCoordinates, router]);

  useEffect(() => {
    if (!isApiLoaded || !inputRef.current || isInitialized) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["address"],
          componentRestrictions: { country: "fr" },
          fields: [
            "geometry",
            "formatted_address",
            "place_id",
            "address_components",
          ],
        }
      );

      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        handlePlaceChanged();
      });

      setIsInitialized(true);

      return () => {
        if (autocompleteRef.current) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'initialisation de l'autocomplétion:",
        error
      );
      toast.error(
        "Un problème est survenu avec la recherche. Veuillez réessayer."
      );
    }
  }, [isApiLoaded, handlePlaceChanged, isInitialized]);

  const handleManualSearch = () => {
    if (!searchText.trim()) return;
    setIsLoading(true);

    if (!selectedPlaceRef.current && autocompleteRef.current?.getPlace) {
      const place = autocompleteRef.current.getPlace();
      if (place?.geometry) {
        selectedPlaceRef.current = place;
      }
    }

    if (selectedPlaceRef.current?.geometry) {
      const place = selectedPlaceRef.current;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      setCoordinates({ lat, lng });
      if (selectedAddress) selectedAddress({ value: place });
      if (onAddressChange) onAddressChange(place);
      router.push(`/explore?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`);
      setIsLoading(false);
      return;
    }

    const autocompleteService = new google.maps.places.AutocompleteService();

    autocompleteService.getPlacePredictions(
      {
        input: searchText,
        types: ["(cities)"],
      },
      (predictions, status) => {
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !predictions?.length
        ) {
          console.warn("Aucune suggestion trouvée");
          setIsLoading(false);
          toast.error(
            "Aucune ville trouvée. Veuillez préciser votre recherche."
          );
          return;
        }

        const exactMatch = predictions.find(
          (p) =>
            p.description
              .toLowerCase()
              .includes(searchText.trim().toLowerCase()) &&
            searchText.trim().length > 3
        );

        const topPrediction = exactMatch || predictions[0];

        const placesService = new google.maps.places.PlacesService(
          document.createElement("div")
        );

        placesService.getDetails(
          {
            placeId: topPrediction.place_id,
            fields: ["geometry", "name", "formatted_address"],
          },
          (place, detailsStatus) => {
            if (
              detailsStatus !== google.maps.places.PlacesServiceStatus.OK ||
              !place
            ) {
              console.warn("Impossible d'obtenir les détails du lieu");
              setIsLoading(false);
              toast.error(
                "Impossible de trouver cette ville. Veuillez réessayer."
              );
              return;
            }

            if (place.formatted_address) {
              setSearchText(place.formatted_address);
            }

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            setCoordinates({ lat, lng });
            if (selectedAddress) selectedAddress({ value: place });
            if (onAddressChange) onAddressChange(place);
            router.push(`/explore?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`);
            setIsLoading(false);
          }
        );
      }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      setTimeout(() => {
        handleManualSearch();
      }, 100); // ⏳ Petit délai pour que Google enregistre correctement le lieu sélectionné au clavier
    }
  };

  return (
    <div className="flex items-center border-2 rounded-full py-2 px-4 shadow-lg bg-white max-w-lg w-full">
      <Search className="h-5 w-5 text-gray-500 mr-3" />
      <input
        type="text"
        ref={inputRef}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isApiLoaded ? "Sélectionner votre ville" : "Chargement..."}
        className="flex-grow bg-transparent outline-none text-sm text-black"
        onFocus={() => inputRef.current?.select()}
        aria-label="Recherche d'adresse"
        disabled={!isApiLoaded || isLoading}
      />
      {isLoading || !isApiLoaded ? (
        <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full ml-2"></div>
      ) : (
        <button
          onClick={handleManualSearch}
          className="ml-2 p-2 bg-green-600 rounded-full text-white hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
          aria-label="Rechercher"
          disabled={!isApiLoaded || isLoading}
        >
          <MapPin className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default GoogleAddressSearchForHeader;
