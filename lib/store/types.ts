import { UserRole, Availability } from "@/lib/types/enums";

// ==================== TYPES DE BASE ====================

/**
 * Coordonnées géographiques (latitude, longitude)
 */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Limites d'une zone géographique sur la carte
 */
export interface MapBounds {
  ne: LatLng; // Nord-Est
  sw: LatLng; // Sud-Ouest
}

/**
 * Image associée à un listing
 */
export interface ListingImage {
  id: number;
  url: string;
}

/**
 * Listing (ferme, producteur, point de vente)
 */
export interface Listing {
  id: number;
  name: string;
  address: string;
  lat: string;
  lng: string;
  availability?: "open" | "closed";
  product_type?: string[];
  certifications?: string[];
  rating?: number;
  listingImages?: ListingImage[];
  description?: string;
  email?: string;
  phoneNumber?: string;
  website?: string;
  active?: boolean;
  created_at?: string;
  modified_at?: string;
  published_at?: string;
}

/**
 * État des filtres de recherche
 */
export interface FilterState {
  product_type: string[];
  certifications: string[];
  purchase_mode: string[];
  production_method: string[];
  additional_services: string[];
  availability: string[];
  mapType: string[];
}

/**
 * Profil utilisateur
 */
export interface UserProfile {
  id: string;
  email: string;
  role: "user" | "farmer" | "admin";
  favorites: number[];
}

/**
 * Type pour le rôle utilisateur (union type ou null)
 */
export type Role = "user" | "farmer" | "admin" | null;

// ==================== TYPES D'ÉTAT ====================

/**
 * État de la carte et de la géolocalisation
 */
export interface MapState {
  coordinates: LatLng | null;
  bounds: MapBounds | null;
  zoom: number;
  mapInstance: any; // Instance Mapbox
  isApiLoaded: boolean;
  isApiLoading: boolean;
}

/**
 * État des listings et interactions
 */
export interface ListingsState {
  all: Listing[];
  visible: Listing[];
  filtered: Listing[];
  selectedId: number | null;
  hoveredId: number | null;
  openInfoWindowId: number | null;
  isLoading: boolean;
  hasMore: boolean;
  page: number;
  totalCount: number;
}

/**
 * État utilisateur complet
 */
export interface UserState {
  profile: UserProfile | null;
  role: Role;
  isLoading: boolean;
  isSyncing: boolean;
  isReady: boolean;
  isWaitingForProfile: boolean;
  syncError: string | null;
  error: string | null;
}

/**
 * État des paramètres de l'application
 */
export interface SettingsState {
  language: "fr" | "en";
  theme: "light" | "dark";
}

/**
 * État UI global
 */
export interface UIState {
  isMapExpanded: boolean;
  isMobile: boolean;
}

// ==================== TYPES DE STORE ====================

/**
 * État global de l'application
 * @deprecated Utiliser les types d'état individuels (MapState, ListingsState, etc.)
 */
export interface AppState {
  map: MapState;
  listings: ListingsState;
  filters: FilterState;
  user: UserState;
  settings: SettingsState;
}

/**
 * Actions disponibles sur le store
 * @deprecated Ces actions sont maintenant définies dans chaque store individuel
 */
export interface AppActions {
  // MAP ACTIONS
  setCoordinates: (coords: LatLng | null) => void;
  setMapBounds: (bounds: MapBounds | null) => void;
  setApiLoaded: (loaded: boolean) => void;
  setZoom: (zoom: number) => void;
  setMapInstance: (instance: any) => void;

  // LISTINGS ACTIONS
  setAllListings: (listings: Listing[]) => void;
  setVisibleListings: (listings: Listing[]) => void;
  setFilteredListings: (listings: Listing[]) => void;
  setSelectedListing: (id: number | null) => void;
  setHoveredListing: (id: number | null) => void;
  setOpenInfoWindow: (id: number | null) => void;
  setListingsLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;
  addListings: (listings: Listing[]) => void;

  // FILTERS ACTIONS
  toggleFilter: (filterKey: keyof FilterState, value: string) => void;
  resetFilters: () => void;
  setFilters: (filters: FilterState) => void;

  // USER ACTIONS
  setUserProfile: (profile: UserProfile | null) => void;
  setUserRole: (role: Role) => void;
  setUserLoading: (loading: boolean) => void;
  setUserError: (error: string | null) => void;
  addFavorite: (listingId: number) => void;
  removeFavorite: (listingId: number) => void;

  // SETTINGS ACTIONS
  setLanguage: (language: "fr" | "en") => void;
  setTheme: (theme: "light" | "dark") => void;

  // UTILS
  reset: () => void;
}

// Backward compatibility - anciens noms de types
/** @deprecated Utiliser MapState */
export type MapStateType = MapState;
/** @deprecated Utiliser ListingsState */
export type ListingsStateType = ListingsState;
/** @deprecated Utiliser UserState */
export type UserStateType = UserState;
