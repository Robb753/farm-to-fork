"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useFilterState } from "@/app/contexts/MapDataContext/FilterStateContext";
import { useMapData } from "@/app/contexts/MapDataContext/useMapData";
import { useAllListingsWithImages } from "@/app/hooks/useAllListingsWithImages";
import { useListingState } from "@/app/contexts/MapDataContext/ListingStateContext";

const ListingMapView = dynamic(
  () => import("../../modules/listings/components/ListingMapView"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    ),
    ssr: false,
  }
);

function Explore() {
  const searchParams = useSearchParams();
  const { setCoordinates } = useMapData();
  const { setListings } = useListingState();
  const { filters, toggleFilter } = useFilterState();
  const { listings, isLoading, error } = useAllListingsWithImages();

  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");

  const lat = latParam ? parseFloat(latParam) : undefined;
  const lng = lngParam ? parseFloat(lngParam) : undefined;

  useEffect(() => {
    const filterKeys = Object.keys(filters);
    let hasChanges = false;

    filterKeys.forEach((key) => {
      const paramValue = searchParams.get(key);
      if (paramValue) {
        const valuesFromUrl = paramValue.split(",");

        valuesFromUrl.forEach((value) => {
          if (!filters[key].includes(value)) {
            toggleFilter(key, value);
            hasChanges = true;
          }
        });

        filters[key].forEach((value) => {
          if (!valuesFromUrl.includes(value)) {
            toggleFilter(key, value);
            hasChanges = true;
          }
        });
      } else if (filters[key].length > 0) {
        filters[key].forEach((value) => {
          toggleFilter(key, value);
        });
        hasChanges = true;
      }
    });

    if (hasChanges) {
      console.log("🎯 Filtres mis à jour depuis l'URL");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isNaN(lat) && !isNaN(lng)) {
      setCoordinates({ lat, lng });
    }
  }, [lat, lng, setCoordinates]);

  useEffect(() => {
    if (listings && listings.length > 0) {
      setListings(listings);
    }
  }, [listings, setListings]);

  return (
    <div className="relative flex flex-col h-full">
      <ListingMapView
        initialCoordinates={
          !isNaN(lat) && !isNaN(lng) ? { lat, lng } : undefined
        }
      />
    </div>
  );
}

export default Explore;
