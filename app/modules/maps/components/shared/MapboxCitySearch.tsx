"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Search, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import { logger } from "@/lib/logger";

/**
 * Interfaces TypeScript pour MapboxCitySearch
 */
interface MapboxCitySearchProps {
  /** Callback appelé lors de la sélection d'une ville */
  onCitySelect?: (city: CitySearchResult) => void;
  /** Placeholder du champ de recherche */
  placeholder?: string;
  /** Variante du composant - hero pour landing, header pour navigation */
  variant?: "hero" | "header";
  /** Code pays pour limiter les résultats (ex: "FR", "FR,DE,BE") */
  country?: string;
  /** Classe CSS personnalisée */
  className?: string;
}

interface CitySearchResult {
  id: string;
  text: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  bbox?: [number, number, number, number]; // [minX, minY, maxX, maxY]
  context?: ContextItem[];
  zoom?: number;
}

interface ContextItem {
  id: string;
  text: string;
  wikidata?: string;
  short_code?: string;
}

interface MapboxGeocodeResponse {
  type: string;
  query: string[];
  features: MapboxFeature[];
  attribution: string;
}

interface MapboxFeature {
  id: string;
  type: string;
  place_type: string[];
  relevance: number;
  properties: Record<string, any>;
  text: string;
  place_name: string;
  center: [number, number];
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  bbox?: [number, number, number, number];
  context?: ContextItem[];
}

interface NavigationPayload {
  center?: [number, number];
  bbox?: [number, number, number, number];
  place_name?: string;
  text?: string;
  zoom?: number;
}

/**
 * Composant de recherche de ville Mapbox avec navigation intégrée
 */
const MapboxCitySearch: React.FC<MapboxCitySearchProps> = ({
  onCitySelect,
  placeholder = "Rechercher une ville...",
  variant = "hero",
  country = "FR",
  className = "",
}) => {
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const suppressNextSearchRef = useRef<boolean>(false);

  // États
  const [searchText, setSearchText] = useState<string>("");
  const [suggestions, setSuggestions] = useState<CitySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Hooks Next.js
  const router = useRouter();
  const pathname = usePathname();
  const urlParams = useSearchParams();

  /**
   * Recherche Mapbox
   */
  const searchPlaces = useCallback(
    async (query: string): Promise<void> => {
      if (suppressNextSearchRef.current) {
        logger.debug(
          "MapboxCitySearch: recherche supprimée (après sélection)",
          {
            query,
          }
        );
        return;
      }

      if (!query.trim() || query.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      // Annuler la requête précédente
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      setIsLoading(true);

      try {
        const searchParams = new URLSearchParams({
          access_token: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "",
          country,
          types: "place,locality,neighborhood",
          language: "fr",
          limit: "8",
        });

        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?${searchParams.toString()}`;

        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(
            `Erreur HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data: MapboxGeocodeResponse = await response.json();

        const formattedResults: CitySearchResult[] = data.features.map(
          (feature) => ({
            id: feature.id,
            text: feature.text,
            place_name: feature.place_name,
            center: feature.center,
            bbox: feature.bbox,
            context: feature.context || [],
          })
        );

        setSuggestions(formattedResults);
        setShowSuggestions(formattedResults.length > 0);
        setSelectedIndex(-1);

        logger.debug("MapboxCitySearch: résultats", {
          query,
          count: formattedResults.length,
          country,
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          logger.debug("MapboxCitySearch: requête annulée", { query });
          return;
        }

        logger.error("MapboxCitySearch: erreur recherche Mapbox", error, {
          query,
          country,
        });

        toast.error("Erreur lors de la recherche de ville");
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    },
    [country]
  );

  /**
   * Debounce
   */
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!suppressNextSearchRef.current) {
        void searchPlaces(searchText);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchText, searchPlaces]);

  /**
   * Navigation
   */
  const navigateWith = useCallback(
    (payload: NavigationPayload): void => {
      try {
        const { center, bbox, place_name, text, zoom = 12 } = payload;
        let lng: number | undefined;
        let lat: number | undefined;

        if (Array.isArray(center) && center.length === 2) {
          [lng, lat] = center;
        }

        const params = new URLSearchParams(urlParams?.toString() || "");

        if (Number.isFinite(lat)) params.set("lat", lat!.toFixed(6));
        if (Number.isFinite(lng)) params.set("lng", lng!.toFixed(6));
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

        window.setTimeout(() => {
          setShowSuggestions(false);
          setSuggestions([]);
          if (variant === "header") setSearchText("");
        }, 100);

        logger.debug("MapboxCitySearch: navigation", {
          target,
          mode: variant === "hero" || pathname === "/" ? "push" : "replace",
        });
      } catch (error) {
        logger.error("MapboxCitySearch: erreur navigation", error);
        toast.error("Erreur lors de la navigation");
      }
    },
    [router, pathname, urlParams, variant]
  );

  /**
   * Sélection
   */
  const selectSuggestion = useCallback(
    (suggestion: CitySearchResult): void => {
      try {
        suppressNextSearchRef.current = true;

        setSearchText(suggestion.place_name);
        setShowSuggestions(false);
        setSuggestions([]);

        inputRef.current?.blur();

        const cityData: CitySearchResult = { ...suggestion, zoom: 12 };
        onCitySelect?.(cityData);

        navigateWith(suggestion);

        logger.debug("MapboxCitySearch: ville sélectionnée", {
          id: suggestion.id,
          place_name: suggestion.place_name,
          center: suggestion.center,
        });
      } catch (error) {
        logger.error("MapboxCitySearch: erreur sélection", error, {
          suggestionId: suggestion?.id,
        });
        toast.error("Erreur lors de la sélection de ville");
      }
    },
    [navigateWith, onCitySelect]
  );

  /**
   * Clavier
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (!showSuggestions || suggestions.length === 0) {
        if (e.key === "Enter") {
          e.preventDefault();
          if (searchText.trim()) void searchPlaces(searchText);
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
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            selectSuggestion(suggestions[selectedIndex]);
          } else if (suggestions[0]) {
            selectSuggestion(suggestions[0]);
          }
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

  /**
   * Click outside
   */
  useEffect(() => {
    const handleClickOutside = (e: Event): void => {
      const target = e.target as Node;
      const clickedOutside =
        suggestionsRef.current &&
        !suggestionsRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target);

      if (clickedOutside) setShowSuggestions(false);
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  /**
   * Cleanup requêtes
   */
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  /**
   * Reset lors changements URL
   */
  const paramsString = urlParams?.toString() || "";
  useEffect(() => {
    setShowSuggestions(false);
    setSuggestions([]);
    suppressNextSearchRef.current = false;
  }, [pathname, paramsString]);

  /**
   * Clear
   */
  const clearSearch = useCallback((): void => {
    setSearchText("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  /**
   * Token Mapbox manquant
   */
  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    logger.warn("MapboxCitySearch: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN manquant");
    return (
      <div
        className={cn(
          "flex items-center border-2 rounded-full py-2 px-4 max-w-lg w-full",
          className
        )}
        style={{
          backgroundColor: COLORS.BG_GRAY,
          borderColor: COLORS.BORDER,
        }}
      >
        <Search className="h-5 w-5 mr-3" style={{ color: COLORS.TEXT_MUTED }} />
        <span className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>
          Token Mapbox requis
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full max-w-lg", className)}>
      {/* Champ */}
      <div
        className="flex items-center border-2 rounded-full py-2 px-4 shadow-lg w-full transition-colors"
        style={{
          backgroundColor: COLORS.BG_WHITE,
          borderColor: showSuggestions ? COLORS.PRIMARY : COLORS.BORDER,
        }}
      >
        <Search
          className="h-5 w-5 mr-3 flex-shrink-0"
          style={{ color: COLORS.TEXT_MUTED }}
        />

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
              setShowSuggestions(true);
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="flex-grow bg-transparent outline-none text-sm"
          style={{ color: COLORS.TEXT_PRIMARY }}
          aria-label="Recherche de ville"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          autoComplete="off"
        />

        {isLoading ? (
          <div
            className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full ml-2 flex-shrink-0"
            style={{
              borderColor: `${COLORS.PRIMARY} transparent transparent transparent`,
            }}
          />
        ) : searchText ? (
          <button
            onClick={clearSearch}
            className="ml-2 p-1 rounded-full transition-colors flex-shrink-0 hover:bg-opacity-80"
            style={{ backgroundColor: `${COLORS.BG_GRAY}80` }}
            aria-label="Effacer la recherche"
            type="button"
          >
            <svg
              className="w-4 h-4"
              style={{ color: COLORS.TEXT_MUTED }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
            className="ml-2 p-2 rounded-full transition-colors flex-shrink-0"
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
            }}
            aria-label="Rechercher"
            type="button"
          >
            <MapPin className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl z-[9999] max-h-80 overflow-y-auto"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            border: `1px solid ${COLORS.BORDER}`,
          }}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => selectSuggestion(suggestion)}
              className={cn(
                "w-full text-left px-4 py-3 transition-colors border-b last:border-b-0",
                "first:rounded-t-xl last:rounded-b-xl focus:outline-none focus:ring-2",
                index === selectedIndex ? "ring-2" : ""
              )}
              style={{
                backgroundColor:
                  index === selectedIndex
                    ? `${COLORS.PRIMARY}10`
                    : "transparent",
                borderColor:
                  index === selectedIndex
                    ? `${COLORS.PRIMARY}30`
                    : COLORS.BORDER,
                borderBottomWidth: "1px",
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              type="button"
            >
              <div className="flex items-start gap-3">
                <MapPin
                  className="w-4 h-4 mt-1 flex-shrink-0"
                  style={{ color: COLORS.PRIMARY }}
                />
                <div className="flex-grow min-w-0">
                  <div
                    className="font-medium truncate"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {suggestion.text}
                  </div>
                  <div
                    className="text-sm truncate"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {suggestion.place_name}
                  </div>

                  {Array.isArray(suggestion.context) &&
                    suggestion.context.length > 0 && (
                      <div
                        className="text-xs mt-1"
                        style={{ color: COLORS.TEXT_MUTED }}
                      >
                        {suggestion.context
                          .filter(
                            (c) =>
                              c.id.includes("region") ||
                              c.id.includes("country")
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

      {/* État vide */}
      {showSuggestions &&
        suggestions.length === 0 &&
        searchText.length >= 3 &&
        !isLoading && (
          <div
            className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl z-[400] p-4 text-center"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              border: `1px solid ${COLORS.BORDER}`,
            }}
          >
            <div>
              <Search
                className="w-8 h-8 mx-auto mb-2"
                style={{ color: COLORS.TEXT_MUTED }}
              />
              <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>
                Aucune ville trouvée
              </p>
              <p className="text-xs mt-1" style={{ color: COLORS.TEXT_MUTED }}>
                Essayez avec un autre nom de ville
              </p>
            </div>
          </div>
        )}
    </div>
  );
};

export default MapboxCitySearch;
