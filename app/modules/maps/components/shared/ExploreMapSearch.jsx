// app/modules/maps/components/shared/ExploreMapSearch.jsx
"use client";

import React from "react";
import CitySearch from "./CitySearch";


/**
 * Composant wrapper pour la recherche dans la page explore
 * Utilise maintenant CitySearch pour une recherche limitée aux villes
 */
const ExploreMapSearch = () => {
  const handleCitySelect = (cityData) => {
    // La logique de navigation est déjà gérée par CitySearch
    console.log(
      "Ville sélectionnée depuis Explore:",
      cityData?.value?.formatted_address
    );
  };

  return (
    <CitySearch
      onCitySelect={handleCitySelect}
      placeholder="Rechercher une ville..."
    />
  );
};

export default ExploreMapSearch;
