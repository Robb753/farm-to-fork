// lib/store/types.ts

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapBounds {
  ne: LatLng;
  sw: LatLng;
}

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
  listingImages?: Array<{ url: string; id: number }>;
  description?: string;
  email?: string;
  phoneNumber?: string;
  website?: string;
  active?: boolean;
  created_at?: string;
  modified_at?: string;
  published_at?: string;
}

export interface FilterState {
  product_type: string[];
  certifications: string[];
  purchase_mode: string[];
  production_method: string[];
  additional_services: string[];
  availability: string[];
  mapType: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  role: "user" | "farmer" | "admin";
  favorites: number[];
}

export interface MapStateType {
  coordinates: LatLng | null;
  bounds: MapBounds | null;
  isApiLoaded: boolean;
  zoom: number;
}

export interface ListingsStateType {
  all: Listing[];
  visible: Listing[];
  selectedId: number | null;
  hoveredId: number | null;
  isLoading: boolean;
  hasMore: boolean;
}

export interface UserStateType {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

export interface AppState {
  map: MapStateType;
  listings: ListingsStateType;
  filters: FilterState;
  user: UserStateType;
}

export interface AppActions {
  // MAP ACTIONS
  setCoordinates: (coords: LatLng | null) => void;
  setMapBounds: (bounds: MapBounds | null) => void;
  setApiLoaded: (loaded: boolean) => void;
  setZoom: (zoom: number) => void;

  // LISTINGS ACTIONS
  setAllListings: (listings: Listing[]) => void;
  setVisibleListings: (listings: Listing[]) => void;
  setSelectedListing: (id: number | null) => void;
  setHoveredListing: (id: number | null) => void;
  setListingsLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  addListings: (listings: Listing[]) => void;

  // FILTERS ACTIONS
  toggleFilter: (filterKey: keyof FilterState, value: string) => void;
  resetFilters: () => void;
  setFilters: (filters: FilterState) => void;

  // USER ACTIONS
  setUserProfile: (profile: UserProfile | null) => void;
  setUserLoading: (loading: boolean) => void;
  setUserError: (error: string | null) => void;
  addFavorite: (listingId: number) => void;
  removeFavorite: (listingId: number) => void;

  // UTILS
  reset: () => void;
}
