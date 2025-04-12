"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { GoogleMap } from "@react-google-maps/api";
import { useMapState } from "@/app/contexts/MapDataContext/MapStateContext";
import { useListingState } from "@/app/contexts/MapDataContext/ListingStateContext";
import GoogleMarkerItem from "./GoogleMarkerItem";
import CustomInfoWindow from "./CustomInfoWindow";
import FarmInfoWindow from "./FarmInfoWindow";
import { Heart } from "lucide-react";
import { useSearchParams } from "next/navigation";

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  mapId: process.env.NEXT_PUBLIC_MAP_ID,
};

function GoogleMapSection({ isMapExpanded }) {
  const { isApiLoaded, coordinates, setCoordinates } = useMapState();
  const {
    visibleListings,
    openInfoWindowId,
    setOpenInfoWindowId,
    clearSelection,
    selectedListingId,
  } = useListingState();

  const mapInstanceRef = useRef(null);
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const initialUrlParsed = useRef(false);
  const searchParams = useSearchParams();
  const DEFAULT_CITY_ZOOM = 12;

  useEffect(() => {
    if (!initialUrlParsed.current) {
      const urlLat = parseFloat(searchParams.get("lat"));
      const urlLng = parseFloat(searchParams.get("lng"));

      if (!isNaN(urlLat) && !isNaN(urlLng)) {
        const coords = { lat: urlLat, lng: urlLng };
        setCoordinates(coords);
      }

      initialUrlParsed.current = true;
    }
  }, [searchParams, setCoordinates]);

  useEffect(() => {
    if (mapInstanceRef.current && coordinates) {
      const map = mapInstanceRef.current;
      const currentZoom = map.getZoom();
      const targetZoom = DEFAULT_CITY_ZOOM;

      if (typeof currentZoom !== "number" || isNaN(currentZoom)) {
        map.setZoom(targetZoom);
        map.panTo(coordinates);
        return;
      }

      map.panTo(coordinates);

      if (currentZoom !== targetZoom) {
        const step = currentZoom > targetZoom ? -1 : 1;
        let zoom = currentZoom;

        const interval = setInterval(() => {
          zoom += step;
          if (typeof zoom === "number" && zoom >= 0 && zoom <= 22) {
            map.setZoom(zoom);
          }

          if (zoom === targetZoom) clearInterval(interval);
        }, 150);
      } else {
        map.setZoom(targetZoom);
      }
    }
  }, [coordinates]);

  useEffect(() => {
    const stored = localStorage.getItem("farmToForkFavorites");
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const next = prev.includes(id)
        ? prev.filter((f) => f !== id)
        : [...prev, id];
      localStorage.setItem("farmToForkFavorites", JSON.stringify(next));
      return next;
    });
  }, []);

  const handleMapLoad = useCallback((map) => {
    mapInstanceRef.current = map;
  }, []);

  const handleCloseInfoWindow = useCallback(() => {
    setOpenInfoWindowId(null);
    clearSelection();
  }, [setOpenInfoWindowId, clearSelection]);

  const mapContainerStyle = useMemo(
    () => ({ width: "100%", height: "100%" }),
    []
  );

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const zoom = mapInstanceRef.current.getZoom();
      if (typeof zoom === "number") mapInstanceRef.current.setZoom(zoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const zoom = mapInstanceRef.current.getZoom();
      if (typeof zoom === "number") mapInstanceRef.current.setZoom(zoom - 1);
    }
  };

  const filteredListings = useMemo(() => {
    if (showFavoritesOnly) {
      return visibleListings.filter((listing) =>
        favorites.includes(listing.id)
      );
    }
    return visibleListings;
  }, [showFavoritesOnly, visibleListings, favorites]);

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
        options={mapOptions}
        onLoad={handleMapLoad}
      >
        {filteredListings.map((listing) => (
          <GoogleMarkerItem
            key={`marker-${listing.id}`}
            map={mapInstanceRef.current}
            item={listing}
          />
        ))}

        {openInfoWindowId &&
          mapInstanceRef.current &&
          (() => {
            const selected = visibleListings.find(
              (i) => i.id === openInfoWindowId
            );
            if (!selected) return null;

            return (
              <CustomInfoWindow
                map={mapInstanceRef.current}
                position={{ lat: +selected.lat, lng: +selected.lng }}
                onClose={handleCloseInfoWindow}
              >
                <FarmInfoWindow
                  item={selected}
                  onAddToFavorites={toggleFavorite}
                  isFavorite={favorites.includes(selected.id)}
                  onClose={handleCloseInfoWindow}
                />
              </CustomInfoWindow>
            );
          })()}
      </GoogleMap>

      <div className="absolute bottom-4 left-4 z-20 flex gap-2">
        <button
          onClick={() => setShowFavoritesOnly((prev) => !prev)}
          className="bg-white text-gray-800 px-3 py-1.5 rounded shadow text-sm hover:bg-gray-100 flex items-center gap-1"
        >
          <Heart className="h-4 w-4 text-gray-500" />
          <span>{showFavoritesOnly ? "Voir tout" : "Voir mes favoris"}</span>
        </button>
      </div>
    </div>
  );
}

export default React.memo(GoogleMapSection);
