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

export default function Explore() {
  const searchParams = useSearchParams();
  const { filters, toggleFilter } = useFilterState();
  const { listingsWithImages } = useAllListingsWithImages();
  const { fetchAllListings } = useMapData();
  const { setAllListings } = useListingState();

  useEffect(() => {
    if (Array.isArray(listingsWithImages) && listingsWithImages.length > 0) {
      setAllListings(listingsWithImages);
    }
  }, [listingsWithImages, setAllListings]);

  return <ListingMapView />;
}
