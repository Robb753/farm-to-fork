"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import { useMapState } from "@/app/contexts/MapDataContext/MapStateContext";
import { useListingState } from "@/app/contexts/MapDataContext/ListingStateContext";
import ExploreMapSearch from "../../maps/components/shared/ExploreMapSearch";

function ListingMapView() {
  const { filters, coordinates, isLoading, fetchListings, hasMore } =
    useMapData();

  const { mapBounds } = useMapState();
  const { visibleListings } = useListingState();

  const searchParams = useSearchParams();
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Mise à jour du nombre total de résultats
  useEffect(() => {
    if (visibleListings) {
      setTotalResults(visibleListings.length);
    }
  }, [visibleListings]);

  // Chargement de plus de résultats
  const loadMoreListings = useCallback(() => {
    if (isLoading || !hasMore) return;
    const newPage = page + 1;
    setPage(newPage);
    fetchListings({ page: newPage, append: true });
  }, [page, hasMore, isLoading, fetchListings]);

  // Rafraîchir les résultats
  const refreshListings = useCallback(() => {
    setPage(1);
    fetchListings({ page: 1, forceRefresh: true }).then((data) => {
      if (data && data.length > 0) {
        toast.success(`${data.length} fermes trouvées`);
      } else {
        toast.info("Aucune ferme trouvée dans cette zone");
      }
    });
  }, [fetchListings]);

  // Basculer entre les modes d'affichage
  const toggleMapSize = useCallback(() => {
    setIsMapExpanded((prev) => !prev);
  }, []);

  return (
    <div className="relative flex flex-col bg-white">
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <FilterSection />
      </div>

      <div className="bg-gray-50 py-2 px-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm font-medium">
            {totalResults} résultat{totalResults !== 1 ? "s" : ""} sur la carte
          </span>
          <button
            onClick={refreshListings}
            disabled={isLoading}
            className="ml-2 text-green-600 hover:text-green-800 text-sm flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
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

      {mapBounds && (
        <div className="px-4 py-2 bg-green-50 border-b border-green-100 text-sm text-green-800">
        </div>
      )}

      <div className="relative flex flex-col md:flex-row transition-all duration-300 h-[calc(100vh-230px)]">
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
          <GoogleMapSection isMapExpanded={isMapExpanded} />

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

      {/* Bouton mobile pour basculer entre carte et liste */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={toggleMapSize}
          className="bg-green-600 text-white rounded-full p-4 shadow-lg flex items-center justify-center"
        >
          {isMapExpanded ? (
            <List className="w-6 h-6" />
          ) : (
            <MapPin className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
}

export default ListingMapView;
