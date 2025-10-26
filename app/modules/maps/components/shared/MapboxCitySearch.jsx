// app/modules/maps/components/shared/MapboxCitySearch.jsx
"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Search, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

/**
 * Mapbox city search with built-in navigation.
 * - variant="hero": used on landing (push to /explore)
 * - variant="header": used in header on /explore (replace URL)
 */
const MapboxCitySearch = ({
  onCitySelect, // optional (analytics, etc.)
  placeholder = "Rechercher une ville...",
  variant = "hero", // "hero" | "header"
  country = "FR", // limit results (can be "FR,DE,BE" etc.)
}) => {
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const abortControllerRef = useRef(null);

  // empêche la relance d'une recherche immédiate après sélection
  const suppressNextSearchRef = useRef(false);

  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const router = useRouter();
  const pathname = usePathname();
  const urlParams = useSearchParams();

  // --- Search ---
  const searchPlaces = useCallback(
    async (query) => {
      if (suppressNextSearchRef.current) return; // ⛔️ skip si on vient de sélectionner

      if (!query.trim() || query.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?` +
            new URLSearchParams({
              access_token: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
              country,
              types: "place,locality,neighborhood",
              language: "fr",
              limit: "8",
            }),
          { signal: abortControllerRef.current.signal }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const formatted = data.features.map((f) => ({
          id: f.id,
          text: f.text,
          place_name: f.place_name,
          center: f.center, // [lng, lat]
          bbox: f.bbox, // [minX,minY,maxX,maxY]
          context: f.context || [],
        }));
        setSuggestions(formatted);
        setShowSuggestions(formatted.length > 0);
        setSelectedIndex(-1);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("Mapbox geocoding error:", e);
          toast.error("Erreur lors de la recherche");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [country]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (!suppressNextSearchRef.current) {
        searchPlaces(searchText);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchText, searchPlaces]);

  // --- Navigation builder ---
  const navigateWith = useCallback(
    (payload) => {
      const { center, bbox, place_name, text, zoom = 12 } = payload || {};
      let lng, lat;
      if (Array.isArray(center)) [lng, lat] = center;

      const params = new URLSearchParams(urlParams?.toString() || "");
      if (Number.isFinite(lat)) params.set("lat", lat.toFixed(6));
      if (Number.isFinite(lng)) params.set("lng", lng.toFixed(6));
      if (Number.isFinite(zoom)) params.set("zoom", String(zoom));
      const label = String(place_name || text || "").trim();
      if (label) params.set("city", label);
      if (Array.isArray(bbox) && bbox.length === 4) {
        params.set("bbox", bbox.map((n) => Number(n).toFixed(6)).join(","));
      }

      const target = `/explore?${params.toString()}`;
      if (variant === "hero" || pathname === "/") {
        router.push(target);
      } else {
        router.replace(target, { scroll: false });
      }
    },
    [router, pathname, urlParams, variant]
  );

  // --- Select handler ---
  const selectSuggestion = useCallback(
    (s) => {
      // empêche le useEffect(search) de ré-ouvrir la liste
      suppressNextSearchRef.current = true;

      setSearchText(s.place_name);
      setShowSuggestions(false);
      setSuggestions([]);

      // blur immédiatement (ferme la liste dans la plupart des UIs)
      inputRef.current?.blur();

      onCitySelect?.({
        center: s.center,
        bbox: s.bbox,
        place_name: s.place_name,
        text: s.text,
        zoom: 12,
      });

      navigateWith(s);
    },
    [navigateWith, onCitySelect]
  );

  // --- Keyboard ---
  const handleKeyDown = useCallback(
    (e) => {
      if (!showSuggestions || suggestions.length === 0) {
        if (e.key === "Enter") {
          e.preventDefault();
          if (searchText.trim()) searchPlaces(searchText);
        }
        return;
      }
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((p) => (p < suggestions.length - 1 ? p + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((p) => (p > 0 ? p - 1 : suggestions.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0) selectSuggestion(suggestions[selectedIndex]);
          else selectSuggestion(suggestions[0]);
          break;
        case "Escape":
          setShowSuggestions(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
        default:
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

  // --- Misc ---
  // fermeture au clic hors composant
  useEffect(() => {
    const clickOutside = (e) => {
      const clickedOutside =
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target);
      if (clickedOutside) setShowSuggestions(false);
    };
    document.addEventListener("pointerdown", clickOutside);
    return () => document.removeEventListener("pointerdown", clickOutside);
  }, []);

  // annuler fetchs pendants
  useEffect(() => () => abortControllerRef.current?.abort(), []);

  // quand l’URL change (après navigation / recentrage carte), on ferme + on réactive la recherche
  const paramsString = urlParams?.toString() || "";
  useEffect(() => {
    setShowSuggestions(false);
    setSuggestions([]);
    // relâche la suppression pour les recherches ultérieures
    suppressNextSearchRef.current = false;
  }, [pathname, paramsString]);

  const clearSearch = () => {
    setSearchText("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

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
      <div className="flex items-center border-2 rounded-full py-2 px-4 shadow-lg bg-white w-full">
        <Search className="h-5 w-5 text-gray-500 mr-3 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            if (!e.target.value.trim()) {
              setSuggestions([]);
              setShowSuggestions(false);
            } else {
              // si l'utilisateur retape après une sélection, on rouvre
              setShowSuggestions(true);
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="flex-grow bg-transparent outline-none text-sm text-black"
          aria-label="Recherche de ville"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          autoComplete="off"
        />
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

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-[400] max-h-80 overflow-y-auto"
        >
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              // ⚠️ pas de preventDefault: on veut laisser blur se produire
              onClick={() => selectSuggestion(s)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl ${
                i === selectedIndex ? "bg-green-50 border-green-200" : ""
              }`}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {s.text}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {s.place_name}
                  </div>
                  {Array.isArray(s.context) && s.context.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {s.context
                        .filter(
                          (c) =>
                            c.id.includes("region") || c.id.includes("country")
                        )
                        .map((c) => c.text)
                        .join(", ")}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions &&
        suggestions.length === 0 &&
        searchText.length >= 3 &&
        !isLoading && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-[400] p-4 text-center">
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
