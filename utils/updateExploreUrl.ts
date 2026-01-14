"use client";

import { useRouter, useSearchParams } from "next/navigation";

/**
 * Type pour les valeurs de paramètres URL acceptées
 */
type URLParamValue = string | number | boolean | null | undefined;

/**
 * Interface pour les mises à jour de paramètres URL
 */
interface URLUpdates {
  /** Latitude pour la carte */
  lat?: URLParamValue;
  /** Longitude pour la carte */
  lng?: URLParamValue;
  /** Niveau de zoom */
  zoom?: URLParamValue;
  /** Filtres de produits */
  product_type?: URLParamValue;
  /** Certifications */
  certifications?: URLParamValue;
  /** Modes d'achat */
  purchase_mode?: URLParamValue;
  /** Méthodes de production */
  production_method?: URLParamValue;
  /** Services additionnels */
  additional_services?: URLParamValue;
  /** Disponibilité */
  availability?: URLParamValue;
  /** Type de carte */
  mapType?: URLParamValue;
  /** Option pour retourner l'URL sans naviguer */
  returnUrlOnly?: boolean;
  /** Autres paramètres dynamiques */
  [key: string]: URLParamValue;
}

/**
 * Interface pour le retour de la fonction hook
 */
interface UpdateExploreUrlFunction {
  (updates?: URLUpdates): string | void;
}

/**
 * Hook personnalisé pour mettre à jour l'URL de la page d'exploration de façon type-safe
 * 
 * Features:
 * - Gestion type-safe des paramètres URL
 * - Support des coordonnées de carte (lat, lng, zoom)
 * - Support de tous les filtres de l'application
 * - Option pour retourner l'URL sans naviguer
 * - Nettoyage automatique des valeurs vides
 * - Intégration Next.js App Router
 * 
 * @returns Fonction pour mettre à jour les paramètres URL
 * 
 * @example
 * ```typescript
 * const updateUrl = useUpdateExploreUrl();
 * 
 * // Mettre à jour les coordonnées
 * updateUrl({ lat: "48.8566", lng: "2.3522", zoom: "10" });
 * 
 * // Mettre à jour les filtres
 * updateUrl({ product_type: "Légumes", certifications: "Bio" });
 * 
 * // Obtenir l'URL sans naviguer
 * const url = updateUrl({ lat: "45.764", returnUrlOnly: true });
 * 
 * // Nettoyer un paramètre
 * updateUrl({ product_type: null });
 * ```
 */
export function useUpdateExploreUrl(): UpdateExploreUrlFunction {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (updates: URLUpdates = {}): string | void => {
    // Validation de base des entrées
    if (!updates || typeof updates !== 'object') {
      console.warn('useUpdateExploreUrl: updates doit être un objet');
      return;
    }

    // Créer une copie des paramètres actuels
    const currentParams = new URLSearchParams(searchParams.toString());

    // Appliquer les mises à jour
    Object.entries(updates).forEach(([key, value]) => {
      // Ignorer les clés de contrôle
      if (key === 'returnUrlOnly') {
        return;
      }

      // Nettoyer les valeurs vides
      if (value === null || value === undefined || value === "") {
        currentParams.delete(key);
      } else {
        // Convertir la valeur en string pour URLSearchParams
        const stringValue = String(value);
        currentParams.set(key, stringValue);
      }
    });

    // Construire la nouvelle URL
    const queryString = currentParams.toString();
    const newUrl = `/explore${queryString ? `?${queryString}` : ''}`;

    // Retourner l'URL si demandé
    if (updates.returnUrlOnly) {
      return newUrl;
    }

    // Naviguer vers la nouvelle URL
    try {
      router.replace(newUrl, { scroll: false });
    } catch (error) {
      console.error('Erreur lors de la navigation:', error);
    }
  };
}

/**
 * Helper pour créer des mises à jour de coordonnées type-safe
 */
export const createCoordinateUpdate = (
  lat: number | string,
  lng: number | string,
  zoom?: number | string
): URLUpdates => ({
  lat: String(lat),
  lng: String(lng),
  ...(zoom !== undefined && { zoom: String(zoom) }),
});

/**
 * Helper pour créer des mises à jour de filtres type-safe
 */
export const createFilterUpdate = (filters: {
  productType?: string;
  certifications?: string;
  purchaseMode?: string;
  productionMethod?: string;
  additionalServices?: string;
  availability?: string;
  mapType?: string;
}): URLUpdates => ({
  ...(filters.productType !== undefined && { product_type: filters.productType }),
  ...(filters.certifications !== undefined && { certifications: filters.certifications }),
  ...(filters.purchaseMode !== undefined && { purchase_mode: filters.purchaseMode }),
  ...(filters.productionMethod !== undefined && { production_method: filters.productionMethod }),
  ...(filters.additionalServices !== undefined && { additional_services: filters.additionalServices }),
  ...(filters.availability !== undefined && { availability: filters.availability }),
  ...(filters.mapType !== undefined && { mapType: filters.mapType }),
});

/**
 * Helper pour nettoyer tous les paramètres
 */
export const createClearAllUpdate = (): URLUpdates => ({
  lat: null,
  lng: null,
  zoom: null,
  product_type: null,
  certifications: null,
  purchase_mode: null,
  production_method: null,
  additional_services: null,
  availability: null,
  mapType: null,
});

/**
 * Type guard pour vérifier si une valeur est une coordonnée valide
 */
export const isValidCoordinate = (value: URLParamValue): value is string | number => {
  if (value === null || value === undefined) return false;
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
};

/**
 * Validation des coordonnées géographiques
 */
export const validateCoordinates = (lat: URLParamValue, lng: URLParamValue): boolean => {
  if (!isValidCoordinate(lat) || !isValidCoordinate(lng)) {
    return false;
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);

  // Vérifier les plages valides pour lat/lng
  return latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
};

/**
 * Export par défaut pour compatibilité
 */
export default useUpdateExploreUrl;