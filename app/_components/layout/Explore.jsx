"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useFilterState } from "@/app/contexts/MapDataContext/FilterStateContext";
import { useMapData } from "@/app/contexts/MapDataContext/useMapData";

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
  const { filters, toggleFilter } = useFilterState();

  const lat = parseFloat(searchParams.get("lat") || "46.6033");
  const lng = parseFloat(searchParams.get("lng") || "1.8883");

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
    try {
      const coords = {
        lat: !isNaN(lat) ? lat : 46.6033,
        lng: !isNaN(lng) ? lng : 1.8883,
      };
      setCoordinates(coords);
    } catch (error) {
      console.error("Erreur lors de la mise à jour des coordonnées:", error);
    }
  }, [lat, lng, setCoordinates]);

  return (
    <div className="relative flex flex-col h-full">
      <ListingMapView
        initialCoordinates={{
          lat: !isNaN(lat) ? lat : 46.6033,
          lng: !isNaN(lng) ? lng : 1.8883,
        }}
      />
    </div>
  );
}

export default Explore;
