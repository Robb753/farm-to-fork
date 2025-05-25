"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useMapState } from "@/app/contexts/MapDataContext/MapStateContext";
import { useRouter } from "next/navigation";

const ExploreMapSearch = () => {
  const { isApiLoaded, setCoordinates } = useMapState();
  const router = useRouter();
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const selectedPlaceRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePlaceChanged = useCallback(() => {
    try {
      setIsLoading(true);
      const place = autocompleteRef.current?.getPlace();

      if (!place || !place.geometry || !place.geometry.location) {
        console.warn("Aucun lieu valide sélectionné");
        setIsLoading(false);
        if (searchText.trim()) {
          toast.error("Veuillez sélectionner une ville dans la liste");
        }
        return;
      }

      console.log(
        "✅ Lieu sélectionné dans ExploreMapSearch:",
        place.formatted_address
      );
      selectedPlaceRef.current = place;

      if (place.formatted_address) {
        setSearchText(place.formatted_address);
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setCoordinates({ lat, lng });
      router.push(`/explore?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`);
      setIsLoading(false);
    } catch (error) {
      console.error("Erreur lors de la sélection du lieu:", error);
      toast.error("Une erreur s'est produite. Veuillez réessayer.");
      setIsLoading(false);
    }
  }, [setCoordinates, searchText, router]);

  useEffect(() => {
    if (!isApiLoaded || !inputRef.current || isInitialized) return;

    try {
      console.log(
        "⚡ Initialisation de l'autocomplétion Google dans ExploreMapSearch"
      );

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["(cities)"],
          componentRestrictions: { country: "fr" },
          fields: ["geometry", "name", "formatted_address", "place_id"],
        }
      );

      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        console.log(
          "🎯 Événement place_changed déclenché dans ExploreMapSearch"
        );
        handlePlaceChanged();
      });

      setIsInitialized(true);

      return () => {
        window.google.maps.event.clearInstanceListeners(autocomplete);
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

    console.log("⚡ Recherche manuelle déclenchée, texte:", searchText);
    setIsLoading(true);

    // 🔁 Fallback getPlace si place_changed pas déclenché
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
      router.push(`/explore?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`);
      setIsLoading(false);
      return;
    }

    const autocompleteService = new google.maps.places.AutocompleteService();

    autocompleteService.getPlacePredictions(
      {
        input: searchText,
        types: ["(cities)"],
        componentRestrictions: { country: "fr" },
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

        console.log("✅ Suggestions trouvées:", predictions);

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

            console.log("✅ Détails du lieu récupérés:", place);
            if (place.formatted_address) {
              setSearchText(place.formatted_address);
            }

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            setCoordinates({ lat, lng });
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
      }, 100); // ⏳ Laisse le temps à getPlace de s'initialiser correctement
    }
  };

  return (
    <div className="flex items-center border-2 rounded-full py-2 px-4 shadow-lg bg-white max-w-lg w-full">
      <Search className="h-5 w-5 text-gray-500 mr-3" />
      <input
        type="text"
        ref={inputRef}
        value={searchText}
        onChange={(e) => {
          setSearchText(e.target.value);
          selectedPlaceRef.current = null; // ✅ Reset pour permettre une nouvelle recherche correcte
        }}
        onKeyDown={handleKeyDown}
        placeholder={isApiLoaded ? "Rechercher une ville..." : "Chargement..."}
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
};

export default ExploreMapSearch;
