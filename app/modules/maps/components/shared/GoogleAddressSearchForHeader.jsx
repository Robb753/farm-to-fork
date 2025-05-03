// app/modules/maps/components/shared/GoogleAddressSearchForHeader.jsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Search, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMapState } from "@/app/contexts/MapDataContext/MapStateContext";

function GoogleAddressSearchForHeader({ selectedAddress, onAddressChange }) {
  const { isApiLoaded, setCoordinates } = useMapState();
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Fonction pour gérer le changement de lieu
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

      console.log("✅ Lieu sélectionné:", place.formatted_address);

      // Mise à jour du texte de recherche avec le nom complet
      if (place.formatted_address) {
        setSearchText(place.formatted_address);
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const latLng = { lat, lng };

      // Mettre à jour les coordonnées dans le contexte
      setCoordinates(latLng);

      // Appeler les callbacks
      if (selectedAddress) selectedAddress({ value: place });
      if (onAddressChange) onAddressChange(place);

      // Rediriger vers la page explore avec les nouvelles coordonnées
      router.push(`/explore?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`);
      setIsLoading(false);
    } catch (error) {
      console.error("Erreur lors de la sélection du lieu:", error);
      toast.error("Une erreur s'est produite. Veuillez réessayer.");
      setIsLoading(false);
    }
  }, [selectedAddress, onAddressChange, setCoordinates, router]);

  // Initialiser l'autocomplétion
  useEffect(() => {
    // Vérifier si l'API est chargée et si le composant n'est pas déjà initialisé
    if (!isApiLoaded || !inputRef.current || isInitialized) return;

    try {
      console.log("⚡ Initialisation de l'autocomplétion Google");

      // Créer l'instance d'autocomplétion
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["(cities)"],
          componentRestrictions: { country: "fr" },
          fields: ["geometry", "name", "formatted_address", "place_id"],
        }
      );

      // Stocker l'instance
      autocompleteRef.current = autocomplete;

      // Ajouter l'écouteur d'événements directement pour le changement de lieu
      autocomplete.addListener("place_changed", function () {
        console.log("🎯 Événement place_changed déclenché");
        handlePlaceChanged();
      });

      // Marquer comme initialisé
      setIsInitialized(true);

      console.log("✅ Autocomplétion initialisée avec succès");

      // Cleanup lors du démontage
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

  // Fonction de recherche manuelle qui sera utilisée à la fois pour le bouton et la touche Entrée
  const handleManualSearch = () => {
    // Vérification du champ vide
    if (!searchText.trim()) return;

    console.log("⚡ Recherche manuelle déclenchée, texte:", searchText);

    // Récupérer directement le premier résultat de l'autocomplétion
    const autocompleteService = new google.maps.places.AutocompleteService();

    setIsLoading(true);

    autocompleteService.getPlacePredictions(
      {
        input: searchText,
        types: ["(cities)"],
        componentRestrictions: { country: "fr" },
      },
      (predictions, status) => {
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !predictions ||
          !predictions.length
        ) {
          console.warn("Aucune suggestion trouvée");
          setIsLoading(false);
          toast.error(
            "Aucune ville trouvée. Veuillez préciser votre recherche."
          );
          return;
        }

        console.log("✅ Suggestions trouvées:", predictions);

        // Utiliser le premier résultat (le plus pertinent)
        const topPrediction = predictions[0];

        // Créer un service PlacesService pour obtenir les détails du lieu
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

            // Mettre à jour le texte de recherche
            if (place.formatted_address) {
              setSearchText(place.formatted_address);
            }

            // Récupérer les coordonnées
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            // Mettre à jour les coordonnées dans le contexte
            setCoordinates({ lat, lng });

            // Appeler les callbacks
            if (selectedAddress) selectedAddress({ value: place });
            if (onAddressChange) onAddressChange(place);

            // Rediriger vers la page explore
            router.push(`/explore?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`);

            setIsLoading(false);
          }
        );
      }
    );
  };

  // Gérer la soumission par appui sur Entrée
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleManualSearch();
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
