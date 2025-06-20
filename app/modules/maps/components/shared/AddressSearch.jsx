// app/modules/maps/components/shared/AddressSearch.jsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Search, MapPin } from "lucide-react";
import { toast } from "sonner";

/**
 * Composant de recherche spécialisé pour les adresses complètes
 * Utilisé pour la création de fiches fermes (add-new-listing, edit-listing)
 */
function AddressSearch({
  onAddressSelect,
  placeholder = "Entrez votre adresse complète (numéro, rue, ville)",
  value = "",
  className = "",
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const selectedPlaceRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchText, setSearchText] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlaceChanged = useCallback(() => {
    try {
      setIsLoading(true);
      const place = autocompleteRef.current?.getPlace();

      if (!place || !place.geometry || !place.geometry.location) {
        console.warn("Aucune adresse valide sélectionnée");
        setIsLoading(false);
        if (searchText.trim()) {
          toast.error("Veuillez sélectionner une adresse dans la liste");
        }
        return;
      }

      selectedPlaceRef.current = place;

      if (place.formatted_address) {
        setSearchText(place.formatted_address);
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      // Callback avec toutes les informations nécessaires
      if (onAddressSelect) {
        onAddressSelect({
          address: place.formatted_address,
          coordinates: { lat, lng },
          place: place,
          components: place.address_components || [],
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Erreur lors de la sélection de l'adresse:", error);
      toast.error("Une erreur s'est produite. Veuillez réessayer.");
      setIsLoading(false);
    }
  }, [onAddressSelect, searchText]);

  useEffect(() => {
    if (!window.google?.maps || !inputRef.current || isInitialized) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["address"], // Adresses complètes uniquement
          componentRestrictions: { country: "fr" }, // France uniquement
          fields: [
            "geometry",
            "formatted_address",
            "address_components",
            "place_id",
            "name",
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
      toast.error("Un problème est survenu avec la recherche d'adresse.");
    }
  }, [handlePlaceChanged, isInitialized]);

  // Synchroniser la valeur externe avec l'état interne
  useEffect(() => {
    if (value !== searchText) {
      setSearchText(value);
    }
  }, [value]);

  const handleManualSearch = () => {
    if (!searchText.trim()) return;
    setIsLoading(true);

    // Vérifier si on a déjà un lieu sélectionné
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

      if (onAddressSelect) {
        onAddressSelect({
          address: place.formatted_address,
          coordinates: { lat, lng },
          place: place,
          components: place.address_components || [],
        });
      }
      setIsLoading(false);
      return;
    }

    // Recherche manuelle via l'API
    const autocompleteService = new google.maps.places.AutocompleteService();

    autocompleteService.getPlacePredictions(
      {
        input: searchText,
        types: ["address"],
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
            "Aucune adresse trouvée. Veuillez préciser votre recherche."
          );
          return;
        }

        const topPrediction = predictions[0];

        const placesService = new google.maps.places.PlacesService(
          document.createElement("div")
        );

        placesService.getDetails(
          {
            placeId: topPrediction.place_id,
            fields: [
              "geometry",
              "formatted_address",
              "address_components",
              "name",
            ],
          },
          (place, detailsStatus) => {
            if (
              detailsStatus !== google.maps.places.PlacesServiceStatus.OK ||
              !place
            ) {
              console.warn("Impossible d'obtenir les détails de l'adresse");
              setIsLoading(false);
              toast.error(
                "Impossible de trouver cette adresse. Veuillez réessayer."
              );
              return;
            }

            if (place.formatted_address) {
              setSearchText(place.formatted_address);
            }

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            if (onAddressSelect) {
              onAddressSelect({
                address: place.formatted_address,
                coordinates: { lat, lng },
                place: place,
                components: place.address_components || [],
              });
            }
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
      }, 100);
    }
  };

  return (
    <div
      className={`flex items-center border-2 rounded-md py-2 px-3 bg-white ${className}`}
    >
      <Search className="h-5 w-5 text-gray-500 mr-3" />
      <input
        type="text"
        ref={inputRef}
        value={searchText}
        onChange={(e) => {
          setSearchText(e.target.value);
          selectedPlaceRef.current = null;
        }}
        onKeyDown={handleKeyDown}
        placeholder={window.google?.maps ? placeholder : "Chargement..."}
        className="flex-grow bg-transparent outline-none text-sm text-black"
        aria-label="Recherche d'adresse complète"
        disabled={!window.google?.maps || isLoading}
      />
      {isLoading || !window.google?.maps ? (
        <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full ml-2"></div>
      ) : (
        <button
          onClick={handleManualSearch}
          className="ml-2 p-1 text-green-600 hover:text-green-700 transition-colors duration-200 focus:outline-none"
          aria-label="Rechercher"
          disabled={!window.google?.maps || isLoading}
        >
          <MapPin className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default AddressSearch;
