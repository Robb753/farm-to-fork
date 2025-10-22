"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useAllListingsWithImages } from "@/app/hooks/useAllListingsWithImages";
// ✅ Nouveaux imports Zustand depuis mapboxListingsStore
import { useListingsActions } from "@/lib/store/mapboxListingsStore";

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
  const { listingsWithImages } = useAllListingsWithImages();
  // ✅ Hook Zustand remplace l'ancien contexte
  const { setAllListings } = useListingsActions();

  useEffect(() => {
    if (Array.isArray(listingsWithImages) && listingsWithImages.length > 0) {
      setAllListings(listingsWithImages);
    }
  }, [listingsWithImages, setAllListings]);

  return <ListingMapView />;
}
