// FilterSection/utils/validation.ts

import { FilterState } from "@/lib/store/shared/types";
import { FILTER_KEYS, type FilterKey } from "./constants";

/**
 * Validation des clés de filtre
 */
export function isFilterKey(key: string): key is FilterKey {
  return (FILTER_KEYS as readonly string[]).includes(key);
}

/**
 * Validation sécurisée des coordonnées URL
 */
export function validateCoordinates(
  lat: string | null,
  lng: string | null
): { lat: number; lng: number } | null {
  if (!lat || !lng) return null;

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  // Vérifications de sécurité
  if (!isFinite(latNum) || !isFinite(lngNum)) return null;
  if (Math.abs(latNum) > 90 || Math.abs(lngNum) > 180) return null;

  return { lat: latNum, lng: lngNum };
}

/**
 * Validation des filtres depuis l'URL
 */
export function validateFilterFromUrl(value: string | null): string[] {
  if (!value) return [];

  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v.length < 100); // Limite de sécurité
}

/**
 * Merge sécurisé des filtres partiels
 */
export function mergeFilters(partial: Partial<FilterState>): FilterState {
  return {
    product_type: partial.product_type ?? [],
    certifications: partial.certifications ?? [],
    purchase_mode: partial.purchase_mode ?? [],
    production_method: partial.production_method ?? [],
    additional_services: partial.additional_services ?? [],
    availability: partial.availability ?? [],
    mapType: partial.mapType ?? [],
  };
}

/**
 * Conversion des filtres vers paramètres URL
 */
export function filtersToUrlParams(
  filters: FilterState
): Record<string, string> {
  const params: Record<string, string> = {};

  (Object.entries(filters) as [FilterKey, string[]][]).forEach(
    ([key, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        // Sanitize les valeurs avant l'URL
        const sanitizedValues = values
          .filter((v) => typeof v === "string" && v.length > 0)
          .map((v) => encodeURIComponent(v));

        if (sanitizedValues.length > 0) {
          params[key] = sanitizedValues.join(",");
        }
      }
    }
  );

  return params;
}

/**
 * Validation d'un objet FilterState complet
 */
export function isValidFilterState(obj: unknown): obj is FilterState {
  if (!obj || typeof obj !== "object") return false;

  const requiredKeys: FilterKey[] = [
    "product_type",
    "certifications",
    "purchase_mode",
    "production_method",
    "additional_services",
    "availability",
    "mapType",
  ];

  for (const key of requiredKeys) {
    if (!(key in obj) || !Array.isArray((obj as any)[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Nettoyage des valeurs de filtre suspectes
 */
export function sanitizeFilterValue(value: string): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  // Rejeter les valeurs trop longues ou contenant des caractères dangereux
  if (trimmed.length === 0 || trimmed.length > 100) return null;
  if (trimmed.includes("<") || trimmed.includes(">") || trimmed.includes("&"))
    return null;

  return trimmed;
}

/**
 * Calcul du nombre total de filtres actifs
 */
export function calculateActiveFilterCount(filters: FilterState): number {
  return Object.values(filters).reduce(
    (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
    0
  );
}
