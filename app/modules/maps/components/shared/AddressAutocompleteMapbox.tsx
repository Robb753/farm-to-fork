"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";

/**
 * Interfaces TypeScript pour AddressAutocompleteMapbox
 */
interface AddressComponents {
  line1: string;
  city: string;
  postcode: string;
  region: string;
  country: string;
}

interface AddressSelectPayload {
  place_name: string;
  label: string;
  lng: number;
  lat: number;
  bbox?: [number, number, number, number];
  address: AddressComponents;
}

interface AddressAutocompleteProps {
  /** Valeur actuelle du champ */
  value: string;
  /** Callback appelé quand le texte change */
  onChange: (text: string) => void;
  /** Callback appelé quand une adresse est sélectionnée */
  onSelect: (payload: AddressSelectPayload) => void;
  /** Placeholder du champ de saisie */
  placeholder?: string;
  /** Code pays pour limiter les résultats */
  country?: string;
  /** Classe CSS personnalisée */
  className?: string;
  /** Désactiver le composant */
  disabled?: boolean;
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
  address?: string;
  bbox?: [number, number, number, number];
  context?: Array<{
    id: string;
    text: string;
    wikidata?: string;
    short_code?: string;
  }>;
}

interface MapboxGeocodeResponse {
  type: string;
  query: string[];
  features: MapboxFeature[];
  attribution: string;
}

interface AddressItem {
  id: string;
  place_name: string;
  label: string;
  center: [number, number];
  bbox?: [number, number, number, number];
  address: AddressComponents;
}

/**
 * Composant d'autocomplétion d'adresse via Mapbox Geocoding API
 * 
 * Features:
 * - Autocomplétion d'adresses avec API Mapbox
 * - Parsing intelligent des composants d'adresse
 * - Navigation clavier complète (flèches, Enter, Escape)
 * - Debouncing des requêtes avec abort controller
 * - Design system intégré avec COLORS
 * - États de chargement et erreurs
 * - Accessibilité ARIA complète
 * - Validation des coordonnées géographiques
 * 
 * @param props - Configuration du composant
 * @returns Composant d'autocomplétion d'adresse
 */
export default function AddressAutocompleteMapbox({
  value,
  onChange,
  onSelect,
  placeholder = "Saisir une adresse...",
  country = "FR",
  className = "",
  disabled = false,
}: AddressAutocompleteProps): JSX.Element {
  // États locaux
  const [query, setQuery] = useState<string>(value || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<AddressItem[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [cursor, setCursor] = useState<number>(-1);
  const [error, setError] = useState<string>("");

  // Refs pour la gestion du DOM et des requêtes
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Synchronisation valeur externe → interne
   */
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  /**
   * Extrait un contexte spécifique des données Mapbox
   */
  const extractContext = useCallback((context: MapboxFeature['context'], idPart: string): string => {
    return context?.find((c) => (c.id || "").includes(idPart))?.text || "";
  }, []);

  /**
   * Parse les composants d'adresse depuis une feature Mapbox
   */
  const parseAddressComponents = useCallback((feature: MapboxFeature): AddressComponents => {
    const context = feature.context || [];
    
    const city = extractContext(context, "place") || 
                 extractContext(context, "locality") || 
                 extractContext(context, "district") || "";
    
    const postcode = extractContext(context, "postcode") || "";
    const region = extractContext(context, "region") || "";
    const countryText = extractContext(context, "country") || "";
    
    // Construction intelligente de la ligne d'adresse
    let line1: string;
    if (feature.address) {
      line1 = `${feature.address} ${feature.text}`.trim(); // numéro + voie
    } else if (feature.place_type?.includes("place")) {
      line1 = feature.text;
    } else {
      line1 = feature.place_name;
    }

    return {
      line1,
      city,
      postcode,
      region,
      country: countryText,
    };
  }, [extractContext]);

  /**
   * Recherche d'adresses via l'API Mapbox Geocoding
   */
  const search = useCallback(
    async (text: string): Promise<void> => {
      const trimmedQuery = text.trim();
      if (!trimmedQuery || trimmedQuery.length < 3) {
        setItems([]);
        setOpen(false);
        setError("");
        return;
      }

      // Annuler la requête précédente
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      setLoading(true);
      setError("");

      try {
        const searchParams = new URLSearchParams({
          access_token: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "",
          country,
          language: "fr",
          limit: "8",
          types: "address,place,locality,neighborhood,postcode",
          autocomplete: "true",
        });

        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmedQuery)}.json?${searchParams}`;

        const response = await fetch(url, { 
          signal: abortRef.current.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }

        const data: MapboxGeocodeResponse = await response.json();
        const features = data.features || [];

        const mappedItems: AddressItem[] = features.map((feature) => {
          const addressComponents = parseAddressComponents(feature);

          return {
            id: feature.id,
            place_name: feature.place_name,
            label: feature.place_name,
            center: feature.center,
            bbox: feature.bbox,
            address: addressComponents,
          };
        });

        setItems(mappedItems);
        setOpen(mappedItems.length > 0);
        setCursor(-1);

        console.debug(`Recherche adresse "${trimmedQuery}": ${mappedItems.length} résultats`);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          console.debug("Requête de recherche d'adresse annulée");
          return;
        }

        console.error("Erreur lors de la recherche d'adresse Mapbox:", err);
        setError("Erreur lors de la recherche");
        setItems([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    },
    [country, parseAddressComponents]
  );

  /**
   * Debouncing de la recherche
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query, search]);

  /**
   * Gestion de la sélection d'un élément
   */
  const handleSelect = useCallback((item: AddressItem): void => {
    try {
      const [lng, lat] = item.center || [0, 0];

      // Validation des coordonnées
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        console.error("Coordonnées invalides pour l'adresse sélectionnée:", item);
        setError("Coordonnées d'adresse invalides");
        return;
      }

      const payload: AddressSelectPayload = {
        place_name: item.place_name,
        label: item.label,
        lng,
        lat,
        bbox: item.bbox,
        address: item.address,
      };

      onSelect(payload);
      setOpen(false);
      setError("");

      console.debug("Adresse sélectionnée:", payload);
    } catch (error) {
      console.error("Erreur lors de la sélection d'adresse:", error);
      setError("Erreur lors de la sélection");
    }
  }, [onSelect]);

  /**
   * Gestion des événements clavier
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (!open) {
        if (e.key === "Enter" && query.trim().length >= 3) {
          e.preventDefault();
          search(query);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setCursor((prev) => (prev < items.length - 1 ? prev + 1 : 0));
          break;

        case "ArrowUp":
          e.preventDefault();
          setCursor((prev) => (prev > 0 ? prev - 1 : items.length - 1));
          break;

        case "Enter":
          e.preventDefault();
          if (cursor >= 0 && items[cursor]) {
            handleSelect(items[cursor]);
          } else if (items[0]) {
            handleSelect(items[0]);
          }
          break;

        case "Escape":
          setOpen(false);
          setCursor(-1);
          inputRef.current?.blur();
          break;

        default:
          break;
      }
    },
    [open, query, items, cursor, handleSelect, search]
  );

  /**
   * Fermeture au clic à l'extérieur
   */
  useEffect(() => {
    const handleClickOutside = (e: Event): void => {
      const target = e.target as Node;
      const clickedOutside =
        listRef.current &&
        !listRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target);

      if (clickedOutside) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Nettoyage lors du démontage
   */
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  /**
   * Effacement du champ
   */
  const handleClear = useCallback((): void => {
    setQuery("");
    onChange("");
    setItems([]);
    setOpen(false);
    setError("");
    inputRef.current?.focus();
  }, [onChange]);

  /**
   * Gestion du changement de texte
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    setError("");
  }, [onChange]);

  return (
    <div className={cn("relative", className)}>
      {/* ✅ Champ de saisie avec design system */}
      <div 
        className={cn(
          "flex items-center border rounded-lg px-3 py-2 transition-colors",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-text",
          error ? "border-red-300 bg-red-50" : ""
        )}
        style={{
          backgroundColor: disabled ? COLORS.BG_GRAY : COLORS.BG_WHITE,
          borderColor: error ? COLORS.ERROR : open ? COLORS.PRIMARY : COLORS.BORDER,
        }}
      >
        <MapPin 
          className="h-4 w-4 mr-2" 
          style={{ color: error ? COLORS.ERROR : COLORS.PRIMARY }}
        />
        
        <input
          ref={inputRef}
          className="flex-1 outline-none bg-transparent text-sm"
          style={{ color: COLORS.TEXT_PRIMARY }}
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label="Saisie d'adresse"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-describedby={error ? "address-error" : undefined}
        />

        {/* ✅ États du bouton avec design system */}
        {loading ? (
          <Loader2 
            className="h-4 w-4 animate-spin" 
            style={{ color: COLORS.PRIMARY }}
          />
        ) : query && !disabled ? (
          <button
            className="ml-2 p-1 rounded transition-colors hover:bg-opacity-80"
            style={{ backgroundColor: `${COLORS.BG_GRAY}80` }}
            onClick={handleClear}
            aria-label="Effacer l'adresse"
            type="button"
          >
            <X 
              className="h-4 w-4" 
              style={{ color: COLORS.TEXT_MUTED }}
            />
          </button>
        ) : null}
      </div>

      {/* ✅ Message d'erreur */}
      {error && (
        <div 
          id="address-error"
          className="mt-1 text-xs"
          style={{ color: COLORS.ERROR }}
        >
          {error}
        </div>
      )}

      {/* ✅ Liste des suggestions avec design system */}
      {open && items.length > 0 && !disabled && (
        <div
          ref={listRef}
          className="absolute z-50 mt-2 w-full rounded-xl shadow-lg max-h-72 overflow-y-auto"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            border: `1px solid ${COLORS.BORDER}`,
          }}
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setCursor(index)}
              className={cn(
                "w-full text-left px-3 py-2 border-b last:border-none transition-colors",
                "first:rounded-t-xl last:rounded-b-xl focus:outline-none focus:ring-2"
              )}
              style={{
                backgroundColor: index === cursor ? `${COLORS.PRIMARY}10` : "transparent",
                borderBottomColor: COLORS.BORDER,
              }}
              type="button"
            >
              <div 
                className="font-medium truncate"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {item.address?.line1 || item.place_name}
              </div>
              <div 
                className="text-xs truncate mt-1"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {item.place_name}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ✅ État vide */}
      {open && items.length === 0 && query.length >= 3 && !loading && !error && (
        <div
          className="absolute z-50 mt-2 w-full rounded-xl shadow-lg p-4 text-center"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            border: `1px solid ${COLORS.BORDER}`,
          }}
        >
          <MapPin 
            className="w-8 h-8 mx-auto mb-2" 
            style={{ color: COLORS.TEXT_MUTED }}
          />
          <p 
            className="text-sm"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            Aucune adresse trouvée
          </p>
          <p 
            className="text-xs mt-1"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            Essayez avec une adresse différente
          </p>
        </div>
      )}
    </div>
  );
}