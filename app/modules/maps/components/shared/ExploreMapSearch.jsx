// app/modules/maps/components/shared/ExploreMapSearch.jsx
"use client";

import React from "react";
import dynamic from "next/dynamic";

// Chargement dynamique pour éviter les erreurs d'hydratation
const MapboxCitySearch = dynamic(() => import("./MapboxCitySearch"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center border-2 rounded-full py-2 px-4 shadow-lg bg-white w-full">
      <div className="w-5 h-5 bg-gray-200 rounded mr-3 animate-pulse"></div>
      <div className="flex-grow h-4 bg-gray-200 rounded animate-pulse"></div>
    </div>
  ),
});

/**
 * Composant wrapper pour la recherche dans la page explore
 * Utilise MapboxCitySearch avec l'API Mapbox Geocoding
 */
const ExploreMapSearch = () => {
  const handleCitySelect = (cityData) => {
    // La logique de navigation est déjà gérée par MapboxCitySearch
    console.log("Ville sélectionnée depuis Explore:", cityData?.place_name);
  };

  return (
    <MapboxCitySearch
      onCitySelect={handleCitySelect}
      placeholder="Rechercher une ville..."
    />
  );
};

export default ExploreMapSearch;
