"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
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
  const { setCoordinates, filters, dispatchFilters } = useMapData();

  const lat = parseFloat(searchParams.get("lat") || "46.6033");
  const lng = parseFloat(searchParams.get("lng") || "1.8883");
  const zoom = parseInt(searchParams.get("zoom") || "6");

  useEffect(() => {
    const filterKeys = Object.keys(filters);
    let hasChanges = false;

    filterKeys.forEach((key) => {
      const paramValue = searchParams.get(key);
      if (paramValue) {
        const values = paramValue.split(",");

        values.forEach((value) => {
          if (!filters[key].includes(value)) {
            dispatchFilters({ type: "TOGGLE_FILTER", filterKey: key, value });
            hasChanges = true;
          }
        });

        filters[key].forEach((value) => {
          if (!values.includes(value)) {
            dispatchFilters({ type: "TOGGLE_FILTER", filterKey: key, value });
            hasChanges = true;
          }
        });
      } else if (filters[key].length > 0) {
        filters[key].forEach((value) => {
          dispatchFilters({ type: "TOGGLE_FILTER", filterKey: key, value });
        });
        hasChanges = true;
      }
    });

    if (hasChanges) {
      console.log("Filtres mis à jour depuis l'URL");
    }
  }, [searchParams, filters, dispatchFilters]);

  useEffect(() => {
    try {
      const coords = {
        lat: !isNaN(lat) ? lat : 46.6033,
        lng: !isNaN(lng) ? lng : 1.8883,
      };
      if (!isNaN(zoom) && zoom >= 3 && zoom <= 20) {
        coords.zoom = zoom;
      }
      setCoordinates(coords);
    } catch (error) {
      console.error("Erreur lors de la mise à jour des coordonnées:", error);
    }
  }, [lat, lng, zoom, setCoordinates]);

  return (
    <div className="relative flex flex-col h-full">
      <ListingMapView
        initialCoordinates={{
          lat: !isNaN(lat) ? lat : 46.6033,
          lng: !isNaN(lng) ? lng : 1.8883,
          zoom: !isNaN(zoom) ? zoom : 6,
        }}
      />
    </div>
  );
}

export default Explore;
