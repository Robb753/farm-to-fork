"use client";

import React, { useEffect, useState } from "react";
import { MapListingProvider } from "@/app/contexts/MapListingContext";
import { useSearchParams } from "next/navigation";
import { useCoordinates } from "@/app/contexts/CoordinateContext";
import ListingMapView from "../../modules/listings/components/ListingMapView";

function Explore() {
  const searchParams = useSearchParams();
  const { setCoordinates } = useCoordinates();

  const lat = parseFloat(searchParams.get("lat"));
  const lng = parseFloat(searchParams.get("lng"));

  const [filters, setFilters] = useState({
    product_type: [],
    certifications: [],
    purchase_mode: [],
    production_method: [],
    additional_services: [],
    availability: [],
  });

  useEffect(() => {
    if (!isNaN(lat) && !isNaN(lng)) {
      setCoordinates({ lat, lng });
    }
  }, [lat, lng, setCoordinates]);

  return (
    <MapListingProvider>
      <div className="relative flex flex-col">
        {/* ✅ Barre des filtres sticky */}
        <div className="sticky top-0 z-50 bg-white shadow-md"></div>

        {/* ✅ Liste et carte */}
        <ListingMapView filters={filters} />
      </div>
    </MapListingProvider>
  );
}

export default Explore;
