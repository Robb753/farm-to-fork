// app/modules/maps/components/shared/ExploreMapSearch.jsx
"use client";

import React from "react";
import MapboxCitySearch from "./MapboxCitySearch";


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
