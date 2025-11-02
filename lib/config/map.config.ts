// lib/config/map.config.ts
// Configuration Mapbox centralisée

import type { LatLng } from "@/lib/types";

// ==================== CONFIGURATION MAPBOX ====================

/**
 * Configuration principale de Mapbox
 */
export const MAPBOX_CONFIG = {
  /**
   * Style de carte Mapbox
   * Styles disponibles:
   * - mapbox://styles/mapbox/streets-v12 (streets)
   * - mapbox://styles/mapbox/outdoors-v12 (outdoors)
   * - mapbox://styles/mapbox/light-v11 (light)
   * - mapbox://styles/mapbox/dark-v11 (dark)
   * - mapbox://styles/mapbox/satellite-v9 (satellite)
   * - mapbox://styles/mapbox/satellite-streets-v12 (satellite-streets)
   */
  style: "mapbox://styles/mapbox/streets-v12",

  /**
   * Centre initial de la carte (France métropolitaine)
   * [longitude, latitude]
   */
  center: [2.2137, 46.2276] as [number, number],

  /**
   * Niveau de zoom initial
   */
  zoom: 4.6,

  /**
   * Niveau de zoom minimum
   */
  minZoom: 3,

  /**
   * Niveau de zoom maximum
   */
  maxZoom: 18,

  /**
   * Pitch initial (inclinaison 3D de la carte)
   */
  pitch: 0,

  /**
   * Bearing initial (rotation de la carte)
   */
  bearing: 0,
} as const;

/**
 * Centre initial comme objet LatLng
 */
export const MAP_CENTER: LatLng = {
  lat: 46.2276,
  lng: 2.2137,
};

// ==================== STYLES DE CARTE DISPONIBLES ====================

/**
 * Styles de carte Mapbox disponibles
 */
export const MAP_STYLES = {
  STREETS: "mapbox://styles/mapbox/streets-v12",
  OUTDOORS: "mapbox://styles/mapbox/outdoors-v12",
  LIGHT: "mapbox://styles/mapbox/light-v11",
  DARK: "mapbox://styles/mapbox/dark-v11",
  SATELLITE: "mapbox://styles/mapbox/satellite-v9",
  SATELLITE_STREETS: "mapbox://styles/mapbox/satellite-streets-v12",
} as const;

export type MapStyle = (typeof MAP_STYLES)[keyof typeof MAP_STYLES];

// ==================== CONFIGURATION DES MARQUEURS ====================

/**
 * Configuration des marqueurs (pins) sur la carte
 */
export const MARKER_CONFIG = {
  /**
   * Couleur par défaut des marqueurs
   */
  defaultColor: "#16a34a", // Vert principal

  /**
   * Couleur des marqueurs survolés
   */
  hoveredColor: "#15803d", // Vert foncé

  /**
   * Couleur des marqueurs sélectionnés
   */
  selectedColor: "#22c55e", // Vert clair

  /**
   * Taille des marqueurs
   */
  size: {
    default: 40,
    hovered: 50,
    selected: 50,
  },

  /**
   * Animation au survol
   */
  animation: {
    enabled: true,
    duration: 200, // ms
  },
} as const;

// ==================== CONFIGURATION DES CLUSTERS ====================

/**
 * Configuration du clustering (regroupement de marqueurs)
 */
export const CLUSTER_CONFIG = {
  /**
   * Activer le clustering
   */
  enabled: true,

  /**
   * Rayon de cluster en pixels
   */
  radius: 50,

  /**
   * Zoom maximum pour le clustering
   * Au-delà de ce niveau, les marqueurs individuels sont affichés
   */
  maxZoom: 14,

  /**
   * Couleurs des clusters selon le nombre de points
   */
  colors: {
    small: "#16a34a", // < 10 points
    medium: "#15803d", // 10-50 points
    large: "#14532d", // > 50 points
  },

  /**
   * Tailles des clusters
   */
  sizes: {
    small: 40,
    medium: 50,
    large: 60,
  },
} as const;

// ==================== CONFIGURATION DES POPUPS ====================

/**
 * Configuration des popups d'information
 */
export const POPUP_CONFIG = {
  /**
   * Offset vertical du popup par rapport au marqueur
   */
  offset: 25,

  /**
   * Fermer le popup au clic sur la carte
   */
  closeOnClick: false,

  /**
   * Bouton de fermeture
   */
  closeButton: true,

  /**
   * Animation d'ouverture/fermeture
   */
  animation: true,

  /**
   * Largeur maximale du popup
   */
  maxWidth: "400px",
} as const;

// ==================== CONFIGURATION DE LA NAVIGATION ====================

/**
 * Configuration des contrôles de navigation
 */
export const NAVIGATION_CONFIG = {
  /**
   * Afficher les contrôles de zoom (+/-)
   */
  showZoom: true,

  /**
   * Afficher le contrôle de boussole
   */
  showCompass: true,

  /**
   * Position des contrôles
   */
  position: "top-right" as const,
} as const;

// ==================== CONFIGURATION DE GÉOLOCALISATION ====================

/**
 * Configuration de la géolocalisation utilisateur
 */
export const GEOLOCATION_CONFIG = {
  /**
   * Activer le suivi de la position
   */
  trackUserLocation: true,

  /**
   * Afficher la direction de la boussole
   */
  showUserHeading: false,

  /**
   * Zoom automatique sur la position de l'utilisateur
   */
  fitBoundsOptions: {
    maxZoom: 15,
  },
} as const;

// ==================== LIMITES GÉOGRAPHIQUES ====================

/**
 * Limites géographiques de la France métropolitaine
 * [ouest, sud, est, nord]
 */
export const FRANCE_BOUNDS: [number, number, number, number] = [
  -5.2, // Ouest (longitude)
  41.3, // Sud (latitude)
  9.6, // Est (longitude)
  51.1, // Nord (latitude)
];

/**
 * Régions prédéfinies
 */
export const REGIONS = {
  FRANCE: {
    name: "France",
    center: [2.2137, 46.2276] as [number, number],
    zoom: 5.5,
    bounds: FRANCE_BOUNDS,
  },
  ILE_DE_FRANCE: {
    name: "Île-de-France",
    center: [2.3488, 48.8534] as [number, number],
    zoom: 9,
  },
  AUVERGNE_RHONE_ALPES: {
    name: "Auvergne-Rhône-Alpes",
    center: [5.7245, 45.7640] as [number, number],
    zoom: 7,
  },
  // Ajoutez d'autres régions au besoin
} as const;

export type Region = keyof typeof REGIONS;

// ==================== CONFIGURATION DE PERFORMANCE ====================

/**
 * Configuration de performance
 */
export const PERFORMANCE_CONFIG = {
  /**
   * Délai de debounce pour les recherches de carte (ms)
   */
  searchDebounceMs: 300,

  /**
   * Délai de debounce pour les mouvements de carte (ms)
   */
  moveDebounceMs: 500,

  /**
   * Charger les tuiles de manière asynchrone
   */
  asyncTileLoading: true,

  /**
   * Utiliser le cache des tuiles
   */
  tileCache: true,
} as const;

// ==================== EXPORT GROUPÉ ====================

/**
 * Export groupé de toute la configuration map
 */
export const MAP_CONFIG = {
  MAPBOX: MAPBOX_CONFIG,
  CENTER: MAP_CENTER,
  STYLES: MAP_STYLES,
  MARKER: MARKER_CONFIG,
  CLUSTER: CLUSTER_CONFIG,
  POPUP: POPUP_CONFIG,
  NAVIGATION: NAVIGATION_CONFIG,
  GEOLOCATION: GEOLOCATION_CONFIG,
  FRANCE_BOUNDS,
  REGIONS,
  PERFORMANCE: PERFORMANCE_CONFIG,
} as const;
