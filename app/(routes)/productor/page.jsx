"use client"
import ListingMapView from "@/app/_components/ListingMapView";
import FilterSection from "@/app/_components/FilterSection"; // Import FilterSection
import React, { useState } from "react";
import { MapListingProvider } from "@/app/contexts/MapListingContext";

function Distributor() {
  const [filters, setFilters] = useState({
    product_type: [],
    certifications: [],
    purchase_mode: [],
    production_method: [],
    additional_services: [],
    availability: [],
  });

  return (
    <MapListingProvider>
      <div className="p-1 sm:p-2 md:p-3 lg:p-4">
        {/* FilterSection displayed above ListingMapView */}
        <div className="mb-4">
          <FilterSection onChangeFilters={setFilters} />
        </div>

        {/* ListingMapView with filters */}
        <ListingMapView filters={filters} />
      </div>
    </MapListingProvider>
  );
}

export default Distributor;
