"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCoordinates } from "../../../contexts/CoordinateContext";
import { useMapListing } from "../../../contexts/MapListingContext";
import { useFilters } from "../../../contexts/FiltersContext";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import FilterSection from "../../../_components/layout/FilterSection";
import Listing from "./Listing";
import GoogleMapSection from "../../maps/components/GoogleMapSection";

function ListingMapView() {
  const { filters } = useFilters();
  const mapListingContext = useMapListing();
  const searchParams = useSearchParams();
  const { setCoordinates } = useCoordinates();

  if (!mapListingContext) {
    console.error("MapListingProvider not set properly.");
    return null;
  }

  const { setListings, setVisibleListings, visibleListings } =
    mapListingContext;
  const lat = parseFloat(searchParams.get("lat"));
  const lng = parseFloat(searchParams.get("lng"));

  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const getLatestListing = useCallback(
    async (pageNumber = 1, append = false) => {
      let query = supabase
        .from("listing")
        .select(`*, listingImages(url, listing_id)`)
        .eq("active", true)
        .order("id", { ascending: false })
        .range((pageNumber - 1) * 10, pageNumber * 10 - 1);

      const filterConditions = Object.keys(filters)
        .filter((key) => filters[key]?.length > 0)
        .map((key) => `${key}.cs.{${filters[key].join(",")}}`)
        .join(",");

      if (filterConditions.length > 0) {
        query = query.or(filterConditions);
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Erreur lors de la recherche des listings");
        console.error("Error fetching listings:", error);
        return [];
      }

      if (data.length === 0) {
        setHasMore(false);
      }

      return append ? [...visibleListings, ...data] : data;
    },
    [filters, visibleListings]
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!isNaN(lat) && !isNaN(lng)) {
        setCoordinates({ lat, lng });
        const data = await getLatestListing(1);
        if (data) {
          setListings(data);
          setVisibleListings(data);
        }
      }
    };
    fetchData();
  }, [
    lat,
    lng,
    getLatestListing,
    setListings,
    setVisibleListings,
    setCoordinates,
  ]);

  const loadMoreListings = async () => {
    const newPage = page + 1;
    setPage(newPage);
    const data = await getLatestListing(newPage, true);
    if (data) {
      setListings(data);
      setVisibleListings(data);
    }
  };

  const toggleMapSize = () => {
    setIsMapExpanded((prev) => !prev);
  };

  return (
    <div className="relative flex flex-col bg-white">
      {/* ✅ FilterSection reste sticky au-dessus */}
      <div className="sticky top-0 z-50 bg-white shadow-md">
        <FilterSection />
      </div>

      {/* ✅ Conteneur principal avec gestion de l'expansion de la carte */}
      <div className="relative flex flex-col md:flex-row gap-4 px-2 transition-all duration-300">
        {/* ✅ Section Listings (visible si la carte n'est pas agrandie) */}
        {!isMapExpanded && (
          <div className="flex-grow w-full h-full md:basis-1/2 overflow-y-auto">
            <Listing onLoadMore={loadMoreListings} hasMore={hasMore} />
          </div>
        )}

        {/* ✅ Section Google Maps en dessous de FilterSection */}
        <div
          className={`relative flex-grow transition-all duration-300 ${
            isMapExpanded
              ? "h-[calc(100vh-60px)] fixed top-[60px] left-0 w-full"
              : "relative h-[80vh]"
          }`}
        >
          <GoogleMapSection isMapExpanded={isMapExpanded} />

          {/* ✅ Bouton pour agrandir et réduire la carte */}
          <button
            onClick={toggleMapSize}
            className="absolute top-6 left-5 bg-green-700 text-white h-10 w-auto px-4 py-2 rounded-md flex items-center justify-center shadow-lg transition-transform transform hover:scale-105 z-10"
          >
            {isMapExpanded ? (
              <>
                <ChevronRight className="w-5 h-5 mr-2" />
                <span>Réduire la carte</span>
              </>
            ) : (
              <>
                <ChevronLeft className="w-5 h-5 mr-2" />
                <span></span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ListingMapView;
