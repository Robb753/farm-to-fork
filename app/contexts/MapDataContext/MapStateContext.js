// app/contexts/MapDataContext/MapStateContext.jsx
import { GoogleMapsLoader } from "@/utils/googleMapsLoader";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { toast } from "sonner";

const MapStateContext = createContext(null);

export function MapStateProvider({ children }) {
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [mapZoom, setMapZoom] = useState(12);
  const [mapInstance, setMapInstance] = useState(null);

  // Référence pour éviter des mises à jour trop fréquentes
  const boundsChangeTimeoutRef = useRef(null);

  // Chargement de l'API Google Maps
  useEffect(() => {
    // Vérifier si l'API est déjà chargée
    if (GoogleMapsLoader.checkLoaded()) {
      setIsApiLoaded(true);
      return;
    }

    // Si l'API est en cours de chargement, ne rien faire
    if (isApiLoading) return;

    // Commencer le chargement
    setIsApiLoading(true);

    GoogleMapsLoader.load()
      .then(() => {
        setIsApiLoaded(true);
      })
      .catch((error) => {
        console.error(
          "❌ Erreur lors du chargement de l'API Google Maps:",
          error
        );
        toast.error("Impossible de charger la carte. Veuillez réessayer.");
      })
      .finally(() => {
        setIsApiLoading(false);
      });
  }, [isApiLoading]);

  // Fonction pour mettre à jour les bounds avec debounce
  const updateMapBounds = useCallback((newBounds) => {
    if (boundsChangeTimeoutRef.current) {
      clearTimeout(boundsChangeTimeoutRef.current);
    }

    boundsChangeTimeoutRef.current = setTimeout(() => {
      setMapBounds(newBounds);
    }, 300); // Debounce de 300ms pour éviter les mises à jour trop fréquentes
  }, []);

  // Fonction pour capturer les instances Map et les bounds lors du chargement
  const handleMapLoad = useCallback(
    (map) => {
      setMapInstance(map);

      // Capture des bounds initiaux
      if (map && map.getBounds()) {
        updateMapBounds({
          ne: {
            lat: map.getBounds().getNorthEast().lat(),
            lng: map.getBounds().getNorthEast().lng(),
          },
          sw: {
            lat: map.getBounds().getSouthWest().lat(),
            lng: map.getBounds().getSouthWest().lng(),
          },
        });
      }

      // Écouter les événements de zoom et déplacement
      map.addListener("idle", () => {
        setMapZoom(map.getZoom());
        if (map.getBounds()) {
          updateMapBounds({
            ne: {
              lat: map.getBounds().getNorthEast().lat(),
              lng: map.getBounds().getNorthEast().lng(),
            },
            sw: {
              lat: map.getBounds().getSouthWest().lat(),
              lng: map.getBounds().getSouthWest().lng(),
            },
          });
        }
      });
    },
    [updateMapBounds]
  );

  const value = {
    isApiLoaded,
    isApiLoading,
    coordinates,
    setCoordinates,
    mapBounds,
    mapZoom,
    mapInstance,
    handleMapLoad,
  };

  return (
    <MapStateContext.Provider value={value}>
      {children}
    </MapStateContext.Provider>
  );
}

export const useMapState = () => {
  const context = useContext(MapStateContext);
  if (!context) {
    throw new Error("useMapState must be used within a MapStateProvider");
  }
  return context;
};
