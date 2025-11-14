// lib/store/mapStore.ts - Version corrigée
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// Types locaux pour éviter les imports problématiques
export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapBounds {
  ne: LatLng; // Nord-Est
  sw: LatLng; // Sud-Ouest
}

/**
 * Interface pour l'état de la carte
 */
interface MapState {
  // ═══ État de la carte ═══
  coordinates: LatLng | null;
  bounds: MapBounds | null;
  zoom: number;
  mapInstance: any; // Instance Mapbox

  // ═══ État de l'API ═══
  isApiLoaded: boolean;
  isApiLoading: boolean;
}

/**
 * Interface pour les actions de la carte
 */
interface MapActions {
  // ═══ Actions de base ═══
  setCoordinates: (coords: LatLng | null) => void;
  setMapBounds: (bounds: MapBounds | null) => void;
  setZoom: (zoom: number) => void;
  setMapInstance: (instance: any) => void;

  // ═══ Actions API ═══
  setApiLoaded: (loaded: boolean) => void;
  setApiLoading: (loading: boolean) => void;

  // ═══ Actions composées ═══
  updateMapBoundsAndFilter: (bounds: MapBounds | null) => void;

  // ═══ Reset ═══
  reset: () => void;
}

/**
 * Type combiné pour le store
 */
type MapStore = MapState & MapActions;

/**
 * État initial de la carte
 */
const INITIAL_MAP_STATE: MapState = {
  coordinates: null,
  bounds: null,
  zoom: 4.6,
  mapInstance: null,
  isApiLoaded: false,
  isApiLoading: false,
};

/**
 * Store spécialisé pour la gestion de la carte
 */
export const useMapStore = create<MapStore>()(
  subscribeWithSelector((set, get) => ({
    // ═══ État initial ═══
    ...INITIAL_MAP_STATE,

    // ═══ Actions de base ═══
    setCoordinates: (coordinates) => {
      set({ coordinates });
    },

    setMapBounds: (bounds) => {
      set({ bounds });
    },

    setZoom: (zoom) => {
      set({ zoom });
    },

    setMapInstance: (mapInstance) => {
      set({ mapInstance });
    },

    // ═══ Actions API ═══
    setApiLoaded: (isApiLoaded) => {
      set({ isApiLoaded, isApiLoading: false });
    },

    setApiLoading: (isApiLoading) => {
      set({ isApiLoading });
    },

    // ═══ Actions composées ═══
    updateMapBoundsAndFilter: (bounds) => {
      set({ bounds });

      // Déclencher un événement pour notifier les autres stores
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mapBoundsUpdated", { detail: bounds })
        );
      }
    },

    // ═══ Reset ═══
    reset: () => {
      set({ ...INITIAL_MAP_STATE });
    },
  }))
);

// ═══ Selectors optimisés ═══

/**
 * Hook pour obtenir l'état complet de la carte
 */
export const useMapState = () =>
  useMapStore((state) => ({
    coordinates: state.coordinates,
    bounds: state.bounds,
    zoom: state.zoom,
    mapInstance: state.mapInstance,
    isApiLoaded: state.isApiLoaded,
    isApiLoading: state.isApiLoading,
  }));

/**
 * Hook pour obtenir les actions de la carte
 */
export const useMapActions = () =>
  useMapStore((state) => ({
    setCoordinates: state.setCoordinates,
    setMapBounds: state.setMapBounds,
    setZoom: state.setZoom,
    setMapInstance: state.setMapInstance,
    setApiLoaded: state.setApiLoaded,
    setApiLoading: state.setApiLoading,
    updateMapBoundsAndFilter: state.updateMapBoundsAndFilter,
    reset: state.reset,
  }));

/**
 * Selectors spécifiques
 */
export const useMapCoordinates = () =>
  useMapStore((state) => state.coordinates);
export const useMapBounds = () => useMapStore((state) => state.bounds);
export const useMapZoom = () => useMapStore((state) => state.zoom);
export const useMapInstance = () => useMapStore((state) => state.mapInstance);
export const useIsMapApiLoaded = () =>
  useMapStore((state) => state.isApiLoaded);
export const useIsMapApiLoading = () =>
  useMapStore((state) => state.isApiLoading);

// ═══ Export du store brut pour compatibilité ═══
export default useMapStore;
