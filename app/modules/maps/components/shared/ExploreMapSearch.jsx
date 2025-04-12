"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useMapState } from "@/app/contexts/MapDataContext/MapStateContext";

const ExploreMapSearch = () => {
  const { isApiLoaded, setCoordinates } = useMapState();
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [lastQuery, setLastQuery] = useState("");

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();

    if (!place || !place.geometry || !place.geometry.location) {
      // Ne montre l’erreur que si l’utilisateur a appuyé sur Entrée
      if (lastQuery.trim().length > 0) {
        toast.error("Veuillez sélectionner une ville valide");
      }
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    if (lat && lng) {
      setCoordinates({ lat, lng });
    }
  }, [setCoordinates, lastQuery]);

  useEffect(() => {
    if (!isApiLoaded || !inputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["(cities)"],
        componentRestrictions: { country: "fr" },
        fields: ["geometry", "name", "formatted_address"],
      }
    );

    autocompleteRef.current = autocomplete;
    autocomplete.addListener("place_changed", handlePlaceChanged);

    const inputEl = inputRef.current;

    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();

        const query = inputEl.value.trim();
        if (!query) return; // ne fait rien si vide

        setLastQuery(query); // stocke pour trigger erreur s’il le faut

        // On attend une suggestion, sinon le place n’est pas encore prêt
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
        }, 150); // délai augmenté pour laisser le temps de charger les suggestions
      }
    };

    const handleInput = (e) => {
      setLastQuery(e.target.value); // met à jour la saisie pour Enter
    };

    inputEl.addEventListener("keydown", handleKeyDown);
    inputEl.addEventListener("input", handleInput);

    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
      inputEl.removeEventListener("keydown", handleKeyDown);
      inputEl.removeEventListener("input", handleInput);
    };
  }, [isApiLoaded, handlePlaceChanged]);

  return (
    <div className="flex items-center border-2 rounded-full py-2 px-4 shadow-lg bg-white max-w-lg w-full">
      <Search className="h-5 w-5 text-gray-500 mr-3" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Sélectionner votre ville"
        className="flex-grow bg-transparent outline-none text-sm text-black"
        onFocus={() => inputRef.current?.select()}
        aria-label="Recherche d'adresse"
      />
    </div>
  );
};

export default ExploreMapSearch;
