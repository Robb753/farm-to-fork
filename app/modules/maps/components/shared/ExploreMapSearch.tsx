"use client";

import React from "react";
import dynamic from "next/dynamic";
import { COLORS } from "@/lib/config";

/**
 * Interface pour les données de ville reçues
 */
interface CitySearchResult {
  id: string;
  text: string;
  place_name: string;
  center: [number, number];
  bbox?: [number, number, number, number];
  context?: Array<{ id: string; text: string }>;
  zoom?: number;
}

/**
 * Props du composant ExploreMapSearch
 */
interface ExploreMapSearchProps {
  /** Classe CSS personnalisée */
  className?: string;
  /** Placeholder personnalisé */
  placeholder?: string;
  /** Callback supplémentaire lors de la sélection */
  onCitySelect?: (cityData: CitySearchResult) => void;
}

/**
 * Chargement dynamique de MapboxCitySearch pour éviter les erreurs d'hydratation SSR
 */
const MapboxCitySearch = dynamic(() => import("./MapboxCitySearch"), {
  ssr: false,
  loading: () => (
    <div 
      className="flex items-center border-2 rounded-full py-2 px-4 shadow-lg w-full"
      style={{
        backgroundColor: COLORS.BG_WHITE,
        borderColor: COLORS.BORDER,
      }}
    >
      {/* ✅ Skeleton loader avec couleurs du design system */}
      <div 
        className="w-5 h-5 rounded mr-3 animate-pulse"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      />
      <div 
        className="flex-grow h-4 rounded animate-pulse"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      />
    </div>
  ),
});

/**
 * Composant wrapper pour la recherche dans la page explore
 * 
 * Features:
 * - Utilise MapboxCitySearch avec l'API Mapbox Geocoding
 * - Chargement dynamique pour éviter les problèmes SSR
 * - Loading state élégant avec le design system
 * - Navigation automatique gérée par MapboxCitySearch
 * - Callback optionnel pour analytics/tracking
 * 
 * @param props - Configuration du composant
 * @returns Composant de recherche pour la page explore
 */
const ExploreMapSearch: React.FC<ExploreMapSearchProps> = ({
  className,
  placeholder = "Rechercher une ville...",
  onCitySelect,
}) => {
  /**
   * Handler pour la sélection de ville
   * La logique de navigation est déjà gérée par MapboxCitySearch
   */
  const handleCitySelect = (cityData: CitySearchResult): void => {
    try {
      // Log pour debugging/analytics
      console.log("🌍 Ville sélectionnée depuis Explore:", {
        place_name: cityData?.place_name,
        center: cityData?.center,
        id: cityData?.id,
      });

      // Callback optionnel pour analytics ou autres traitements
      onCitySelect?.(cityData);
    } catch (error) {
      console.error("Erreur lors du traitement de la sélection de ville:", error);
    }
  };

  return (
    <MapboxCitySearch
      onCitySelect={handleCitySelect}
      placeholder={placeholder}
      variant="header" // Variant pour la page explore (replace URL)
      className={className}
    />
  );
};

export default ExploreMapSearch;