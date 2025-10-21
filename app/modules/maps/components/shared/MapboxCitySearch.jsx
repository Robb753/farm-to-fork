// app/modules/maps/components/shared/MapboxCitySearch.jsx
"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Search, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMapboxActions } from "@/lib/store/mapboxListingsStore";

/**
 * Composant de recherche de ville utilisant l'API Mapbox Geocoding
 * Alternative moderne à Google Places pour Farm2Fork
 */
const MapboxCitySearch = ({
  onCitySelect,
  placeholder = "Rechercher une ville...",
}) => {
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const abortControllerRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const router = useRouter();
  const { setCoordinates } = useMapboxActions();

  // Fonction de recherche avec l'API Mapbox Geocoding
  const searchPlaces = useCallback(async (query) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
          new URLSearchParams({
            access_token: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
            country: "FR", // Limité à la France
            types: "place,locality,neighborhood", // Villes et quartiers
            language: "fr",
            limit: "8",
          }),
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const formattedSuggestions = data.features.map((feature) => ({
        id: feature.id,
        text: feature.text,
        place_name: feature.place_name,
        center: feature.center, // [lng, lat]
        context: feature.context || [],
        bbox: feature.bbox,
      }));

      setSuggestions(formattedSuggestions);
      setShowSuggestions(formattedSuggestions.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Erreur de géocodage Mapbox:", error);
        toast.error("Erreur lors de la recherche");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlaces(searchText);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, searchPlaces]);

  // Sélectionner une suggestion
  const selectSuggestion = useCallback(
    (suggestion) => {
      const [lng, lat] = suggestion.center;
      const coordinates = [lng, lat];

      setSearchText(suggestion.place_name);
      setShowSuggestions(false);
      setSuggestions([]);
      setCoordinates(coordinates);

      // Callback personnalisé
      if (onCitySelect) {
        onCitySelect({
          coordinates,
          name: suggestion.text,
          place_name: suggestion.place_name,
          bbox: suggestion.bbox,
        });
      }

      // Navigation vers explore
      router.push(`/explore?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`);
    },
    [onCitySelect, setCoordinates, router]
  );

  // Gestion du clavier - CORRIGÉ
  const handleKeyDown = useCallback(
    (e) => {
      if (!showSuggestions || suggestions.length === 0) {
        if (e.key === "Enter") {
          e.preventDefault();
          // Recherche manuelle si pas de suggestions
          if (searchText.trim()) {
            searchPlaces(searchText);
          }
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;

        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            selectSuggestion(suggestions[selectedIndex]);
          } else if (suggestions.length > 0) {
            selectSuggestion(suggestions[0]);
          }
          break;

        case "Escape":
          setShowSuggestions(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;

        default:
          // Ne rien faire pour les autres touches
          break;
      }
    },
    [
      showSuggestions,
      suggestions,
      selectedIndex,
      selectSuggestion,
      searchText,
      searchPlaces,
    ]
  );

  // Fermer les suggestions au clic dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Nettoyage des requêtes en cours
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleInputChange = (e) => {
    setSearchText(e.target.value);
    if (!e.target.value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const clearSearch = () => {
    setSearchText("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Vérification du token Mapbox
  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return (
      <div className="flex items-center border-2 rounded-full py-2 px-4 bg-gray-100 max-w-lg w-full">
        <Search className="h-5 w-5 text-gray-400 mr-3" />
        <span className="text-gray-500 text-sm">Token Mapbox requis</span>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-lg">
      {/* Champ de recherche */}
      <div className="flex items-center border-2 rounded-full py-2 px-4 shadow-lg bg-white w-full">
        <Search className="h-5 w-5 text-gray-500 mr-3 flex-shrink-0" />

        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="flex-grow bg-transparent outline-none text-sm text-black"
          aria-label="Recherche de ville"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          autoComplete="off"
        />

        {/* Indicateur de chargement ou bouton clear */}
        {isLoading ? (
          <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full ml-2 flex-shrink-0" />
        ) : searchText ? (
          <button
            onClick={clearSearch}
            className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            aria-label="Effacer la recherche"
          >
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => inputRef.current?.focus()}
            className="ml-2 p-2 bg-green-600 rounded-full text-white hover:bg-green-700 transition-colors flex-shrink-0"
            aria-label="Rechercher"
          >
            <MapPin className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Liste des suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => selectSuggestion(suggestion)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl ${
                index === selectedIndex ? "bg-green-50 border-green-200" : ""
              }`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.text}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {suggestion.place_name}
                  </div>
                  {/* Afficher le contexte (département, région) */}
                  {suggestion.context.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {suggestion.context
                        .filter(
                          (ctx) =>
                            ctx.id.includes("region") ||
                            ctx.id.includes("country")
                        )
                        .map((ctx) => ctx.text)
                        .join(", ")}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Message si aucun résultat */}
      {showSuggestions &&
        suggestions.length === 0 &&
        searchText.length >= 3 &&
        !isLoading && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-4 text-center">
            <div className="text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Aucune ville trouvée</p>
              <p className="text-xs text-gray-400 mt-1">
                Essayez avec un autre nom de ville
              </p>
            </div>
          </div>
        )}
    </div>
  );
};

export default MapboxCitySearch;
