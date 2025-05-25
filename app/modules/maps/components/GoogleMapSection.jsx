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
import { useFilterState } from "@/app/contexts/MapDataContext/FilterStateContext";
import CustomInfoWindow from "./CustomInfoWindow";
import FarmInfoWindow from "./FarmInfoWindow";
import { useSearchParams } from "next/navigation";
import { useUpdateExploreUrl } from "@/utils/updateExploreUrl";

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

function filtersToUrlParams(filters) {
  const result = {};
  Object.entries(filters).forEach(([key, values]) => {
    if (Array.isArray(values) && values.length > 0) {
      result[key] = values.join(",");
    }
  });
  return result;
}

function GoogleMapSection({ isMapExpanded }) {
  const {
    isApiLoaded,
    coordinates,
    setCoordinates,
    handleMapLoad: contextHandleMapLoad,
  } = useMapState();

  const {
    allListings,
    hoveredListingId,
    setHoveredListingId,
    openInfoWindowId,
    setOpenInfoWindowId,
    clearSelection,
  } = useListingState();

  const { filters, filtersHydrated } = useFilterState();
  const updateExploreUrl = useUpdateExploreUrl();

  const mapInstanceRef = useRef(null);
  const searchParams = useSearchParams();
  const initialUrlParsed = useRef(false);

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
      map.addListener("idle", updateUrlWithCenter);
      map.addListener("click", () => {
        setOpenInfoWindowId(null);
        clearSelection();
      });
      if (contextHandleMapLoad) {
        contextHandleMapLoad(map);
      }
    },
    [
      updateUrlWithCenter,
      setOpenInfoWindowId,
      clearSelection,
      contextHandleMapLoad,
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
        zoom={12}
        options={mapOptions}
        onLoad={handleMapLoad}
      />
    </div>
  );
}

export default React.memo(GoogleMapSection);
