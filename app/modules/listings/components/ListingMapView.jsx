"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  MapPin,
  List,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import FilterSection from "@/app/_components/layout/FilterSection";
import GoogleMapSection from "../../maps/components/GoogleMapSection";
import Listing from "./Listing";
import { useMapData } from "@/app/contexts/MapDataContext/useMapData";
import ExploreMapSearch from "../../maps/components/shared/ExploreMapSearch";

function ListingMapView() {
  const {
    filters,
    coordinates,
    setCoordinates,
    isLoading,
    fetchListings,
    visibleListings = [],
    hasMore,
  } = useMapData();

  const searchParams = useSearchParams();
  const lat = parseFloat(searchParams.get("lat"));
  const lng = parseFloat(searchParams.get("lng"));

  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [mapInstance, setMapInstance] = useState(null);

  const prevCoordsRef = useRef({ lat: null, lng: null });
  const initialFetchDoneRef = useRef(false);
  const filtersRef = useRef(filters);
  const fetchRef = useRef(fetchListings);

  useEffect(() => {
    fetchRef.current = fetchListings;
  }, [fetchListings]);

  useEffect(() => {
    if (!isNaN(lat) && !isNaN(lng)) {
      const newCoords = { lat, lng };
      const hasChanged =
        prevCoordsRef.current.lat !== newCoords.lat ||
        prevCoordsRef.current.lng !== newCoords.lng;

      if (hasChanged) {
        prevCoordsRef.current = newCoords;

        setCoordinates((prev) => {
          if (
            !prev ||
            prev.lat !== newCoords.lat ||
            prev.lng !== newCoords.lng
          ) {
            return newCoords;
          }
          return prev;
        });

        if (!initialFetchDoneRef.current) {
          initialFetchDoneRef.current = true;
          fetchRef.current({ page: 1, forceRefresh: true });
        }

        // 👉 Déplacement fluide de la carte
        if (mapInstance) {
          mapInstance.panTo(new window.google.maps.LatLng(newCoords));
        }
      }
    }
  }, [lat, lng, setCoordinates, mapInstance]);

  useEffect(() => {
    if (JSON.stringify(filtersRef.current) !== JSON.stringify(filters)) {
      filtersRef.current = filters;
      const timer = setTimeout(() => {
        setPage(1);
        fetchRef.current({ page: 1 });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [filters]);

  const loadMoreListings = useCallback(() => {
    if (isLoading || !hasMore) return;
    const newPage = page + 1;
    setPage(newPage);
    fetchRef.current({ page: newPage, append: true });
  }, [page, hasMore, isLoading]);

  const refreshListings = useCallback(() => {
    setPage(1);
    fetchRef.current({ page: 1, forceRefresh: true }).then((data) => {
      if (data && data.length > 0) {
        toast.success(`${data.length} fermes trouvées`);
      } else {
        toast.info("Aucune ferme trouvée dans cette zone");
      }
    });
  }, []);

  const toggleMapSize = useCallback(() => {
    setIsMapExpanded((prev) => !prev);
  }, []);

  const listingsCount = visibleListings?.length || 0;

  const handleCitySelect = (place) => {
    const lat = place?.geometry?.location?.lat();
    const lng = place?.geometry?.location?.lng();
    if (lat && lng) {
      const newCoords = { lat, lng };
      setCoordinates(newCoords);
      if (mapInstance) {
        mapInstance.panTo(new window.google.maps.LatLng(newCoords));
      }
    }
  };

  return (
    <div className="relative flex flex-col bg-white">
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <FilterSection />
      </div>

      <div className="bg-gray-50 py-2 px-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm font-medium">
            {listingsCount} résultats
          </span>
          <button
            onClick={refreshListings}
            disabled={isLoading}
            className="ml-2 text-green-600 hover:text-green-800 text-sm flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Actualiser</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 text-sm">
            <span className="text-gray-600 mr-1">Affichage :</span>
            <button
              className={`px-2 py-1 rounded-md flex items-center gap-1 ${
                !isMapExpanded
                  ? "bg-green-100 text-green-800"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => setIsMapExpanded(false)}
            >
              <List className="h-4 w-4" />
              <span>Liste</span>
            </button>
            <button
              className={`px-2 py-1 rounded-md flex items-center gap-1 ${
                isMapExpanded
                  ? "bg-green-100 text-green-800"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => setIsMapExpanded(true)}
            >
              <MapPin className="h-4 w-4" />
              <span>Carte</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col md:flex-row transition-all duration-300 h-[calc(100vh-200px)]">
        <div
          className={`overflow-y-auto transition-all duration-300 ${
            isMapExpanded
              ? "hidden md:block md:w-0 opacity-0 md:opacity-100"
              : "w-full md:w-1/2 opacity-100"
          }`}
        >
          <Listing
            onLoadMore={loadMoreListings}
            hasMore={hasMore}
            isLoading={isLoading}
          />
        </div>

        <div
          className={`relative transition-all duration-300 ${
            isMapExpanded ? "w-full h-full" : "w-full md:w-1/2 h-full"
          }`}
        >
          <div className="absolute top-4 left-4 z-20 w-[300px] max-w-[90vw]">
            <ExploreMapSearch />
          </div>
          <GoogleMapSection
            isMapExpanded={isMapExpanded}
            onMapLoad={(map) => setMapInstance(map)}
          />

          {/* 🧭 Contrôles */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={toggleMapSize}
              className="bg-white text-gray-700 hover:bg-gray-50 p-2 rounded-md shadow-md flex items-center gap-2 transition-all border border-gray-200"
              title={isMapExpanded ? "Réduire la carte" : "Agrandir la carte"}
            >
              {isMapExpanded ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
              <span className="md:inline hidden">
                {isMapExpanded ? "Réduire" : "Plein écran"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListingMapView;
