"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { GoogleMap } from "@react-google-maps/api";
// ✅ Nouveaux imports Zustand
import {
  useMapState,
  useMapActions,
  useListingsState,
  useInteractionsActions,
  useFiltersState,
} from "@/lib/store/mapListingsStore";
import { useSearchParams } from "next/navigation";
import { useUpdateExploreUrl } from "@/utils/updateExploreUrl";
import GoogleMarkerItem from "@/app/modules/maps/components/GoogleMarkerItem";

// Hook pour détecter si on est sur mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};

// Options de carte pour desktop
const getDesktopMapOptions = () => ({
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  gestureHandling: "cooperative", // Comportement normal sur desktop
  mapId: process.env.NEXT_PUBLIC_MAP_ID,
});

// Options de carte pour mobile
const getMobileMapOptions = () => ({
  disableDefaultUI: true,
  zoomControl: false, // Supprime les boutons zoom/dezoom
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  gestureHandling: "greedy", // Supprime "utiliser deux doigts"
  mapId: process.env.NEXT_PUBLIC_MAP_ID,
});

function filtersToUrlParams(filters) {
  const result = {};
  Object.entries(filters).forEach(([key, values]) => {
    if (Array.isArray(values) && values.length > 0) {
      result[key] = values.join(",");
    }
  });
  return result;
}

function GoogleMapSection({ isMapExpanded, isMobile: forceMobile = null }) {
  // ✅ Hooks Zustand remplacent les anciens contextes
  const { isApiLoaded, coordinates, mapZoom } = useMapState();

  const {
    setCoordinates,
    setMapBounds,
    setMapZoom,
    setMapInstance,
    setApiLoaded,
  } = useMapActions();

  const { visible: visibleListings } = useListingsState();

  const { setOpenInfoWindowId, clearSelection } = useInteractionsActions();

  const filters = useFiltersState();

  const updateExploreUrl = useUpdateExploreUrl();

  const mapInstanceRef = useRef(null);
  const searchParams = useSearchParams();
  const initialUrlParsed = useRef(false);
  const [filtersHydrated, setFiltersHydrated] = useState(true); // Simplifié pour la migration

  // Détection mobile avec possibilité de forcer via prop
  const detectedMobile = useIsMobile();
  const isMobile = forceMobile !== null ? forceMobile : detectedMobile;

  const [initialZoom, setInitialZoom] = useState(12);

  // Options de carte conditionnelles selon la plateforme
  const mapOptions = useMemo(() => {
    return isMobile ? getMobileMapOptions() : getDesktopMapOptions();
  }, [isMobile]);

  // Détecte viewport pour zoom initial
  useEffect(() => {
    if (isMobile || window.innerWidth < 640) {
      setInitialZoom(11);
    } else {
      setInitialZoom(12);
    }
  }, [isMobile]);

  // Lis lat/lng depuis URL
  useEffect(() => {
    if (!initialUrlParsed.current) {
      const urlLat = parseFloat(searchParams.get("lat"));
      const urlLng = parseFloat(searchParams.get("lng"));
      if (!isNaN(urlLat) && !isNaN(urlLng)) {
        setCoordinates({ lat: urlLat, lng: urlLng });
      }
      initialUrlParsed.current = true;
    }
  }, [searchParams, setCoordinates]);

  useEffect(() => {
    if (mapInstanceRef.current && coordinates) {
      mapInstanceRef.current.panTo(coordinates);
    }
  }, [coordinates]);

  const updateUrlWithCenter = useCallback(() => {
    if (!filtersHydrated) return;
    const map = mapInstanceRef.current;
    if (!map) return;

    const center = map.getCenter();
    if (!center) return;

    const lat = center.lat().toFixed(6);
    const lng = center.lng().toFixed(6);

    updateExploreUrl({
      lat,
      lng,
      ...filtersToUrlParams(filters),
    });
  }, [filters, filtersHydrated, updateExploreUrl]);

  const handleMapLoad = useCallback(
    (map) => {
      mapInstanceRef.current = map;

      // ✅ Mise à jour du store Zustand
      setMapInstance(map);

      // Sur mobile, on évite de mettre à jour l'URL à chaque mouvement
      if (!isMobile) {
        map.addListener("idle", () => {
          // Mettre à jour les bounds dans le store
          const bounds = map.getBounds();
          if (bounds) {
            const boundsObj = {
              ne: {
                lat: bounds.getNorthEast().lat(),
                lng: bounds.getNorthEast().lng(),
              },
              sw: {
                lat: bounds.getSouthWest().lat(),
                lng: bounds.getSouthWest().lng(),
              },
            };
            setMapBounds(boundsObj);
          }

          // Mettre à jour le zoom
          setMapZoom(map.getZoom());

          // Mettre à jour l'URL
          updateUrlWithCenter();
        });
      } else {
        // Sur mobile, mettre à jour les bounds quand même mais sans URL
        map.addListener("idle", () => {
          const bounds = map.getBounds();
          if (bounds) {
            const boundsObj = {
              ne: {
                lat: bounds.getNorthEast().lat(),
                lng: bounds.getNorthEast().lng(),
              },
              sw: {
                lat: bounds.getSouthWest().lat(),
                lng: bounds.getSouthWest().lng(),
              },
            };
            setMapBounds(boundsObj);
          }
          setMapZoom(map.getZoom());
        });
      }

      map.addListener("click", () => {
        setOpenInfoWindowId(null);
        clearSelection();
      });
    },
    [
      updateUrlWithCenter,
      setOpenInfoWindowId,
      clearSelection,
      setMapInstance,
      setMapBounds,
      setMapZoom,
      isMobile,
    ]
  );

  const mapContainerStyle = useMemo(
    () => ({ width: "100%", height: "100%" }),
    []
  );

  if (!isApiLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={coordinates || { lat: 46.6, lng: 1.88 }}
        zoom={initialZoom}
        options={mapOptions} // Options conditionnelles mobile/desktop
        onLoad={handleMapLoad}
      >
        {/* Boucle sur les listings visibles */}
        {visibleListings.map((item) => (
          <GoogleMarkerItem
            key={item.id}
            map={mapInstanceRef.current}
            item={item}
          />
        ))}
      </GoogleMap>
    </div>
  );
}

export default React.memo(GoogleMapSection);
