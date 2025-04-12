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
import { useSearchParams, useRouter } from "next/navigation";

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

function GoogleMapSection({ isMapExpanded, onMapLoad }) {
  const { isApiLoaded, coordinates, setCoordinates } = useMapState();
  const {
    visibleListings,
    openInfoWindowId,
    setOpenInfoWindowId,
    clearSelection,
    selectedListingId,
    hoveredListingId,
    setHoveredListingId,
  } = useListingState();

  const mapInstanceRef = useRef(null);
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const initialUrlParsed = useRef(false);
  const searchParams = useSearchParams();
  const router = useRouter();

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
      mapInstanceRef.current.panTo(coordinates);
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

  const updateUrlWithCenter = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const center = map.getCenter();
    if (!center) return;

    const lat = center.lat().toFixed(6);
    const lng = center.lng().toFixed(6);

    router.replace(`/explore?lat=${lat}&lng=${lng}`, { scroll: false });
  }, [router]);

  const handleCloseInfoWindow = useCallback(() => {
    setOpenInfoWindowId(null);
    clearSelection();
  }, [setOpenInfoWindowId, clearSelection]);

  const handleMapLoad = useCallback(
    (map) => {
      mapInstanceRef.current = map;

      map.addListener("idle", updateUrlWithCenter);
      map.addListener("click", handleCloseInfoWindow);

      if (typeof onMapLoad === "function") {
        onMapLoad(map);
      }
    },
    [updateUrlWithCenter, handleCloseInfoWindow, onMapLoad]
  );

  const mapContainerStyle = useMemo(
    () => ({ width: "100%", height: "100%" }),
    []
  );

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
        zoom={12}
        options={mapOptions}
        onLoad={handleMapLoad}
      >
        {filteredListings.map((listing) => (
          <GoogleMarkerItem
            key={`marker-${listing.id}`}
            map={mapInstanceRef.current}
            item={listing}
            isHovered={hoveredListingId === listing.id}
            onMouseEnter={() => setHoveredListingId(listing.id)}
            onMouseLeave={() => setHoveredListingId(null)}
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
    </div>
  );
}

export default React.memo(GoogleMapSection);
