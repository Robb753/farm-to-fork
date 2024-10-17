"use client";

import React, { useEffect, useState } from "react";
import Listing from "./Listing";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import GoogleMapSection from "./GoogleMapSection";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCoordinates } from "../contexts/CoordinateContext";
import FilterSection from "./FilterSection";

function ListingMapView({ typeferme }) {
  const [listing, setListing] = useState([]);
  const [visibleListings, setVisibleListings] = useState([]); // Listings visibles
  const [searchAddress, setSearchAddress] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const { coordinates, setCoordinates } = useCoordinates();
  const [filters, setFilters] = useState({
    product_type: [],
    certifications: [],
    purchase_mode: [],
    production_method: [],
    additional_services: [],
    availability: [],
  });

  useEffect(() => {
    if (!coordinates) {
      setCoordinates({ lat: 0, lng: 0 });
    }
  }, [coordinates, setCoordinates]);

  // Recharger les listings lorsque les filtres ou les coordonnées changent
  useEffect(() => {
    if (coordinates && coordinates.lat && coordinates.lng) {
      getLatestListing();
    }
  }, [typeferme, coordinates, searchAddress, filters]);

  const getLatestListing = async () => {
    let query = supabase
      .from("listing")
      .select(`*, listingImages(url, listing_id)`)
      .eq("active", true)
      .eq("typeferme", typeferme);

    Object.keys(filters).forEach((key) => {
      if (filters[key]?.length > 0) {
        const filterQuery = filters[key]
          .map((value) => `${key}.cs.{${value}}`)
          .join(",");
        query = query.or(filterQuery);
      }
    });

    const { data, error } = await query.order("id", { ascending: false });

    if (error) {
      toast.error("Search Error");
    } else {
      setListing(data);
      setVisibleListings(data); // Initialement, tous les listings sont visibles
    }
  };

  const toggleMapSize = () => {
    setIsMapExpanded(!isMapExpanded);
  };

  return (
    <div
      className={`flex gap-4 px-2 ${isMapExpanded ? "flex-col" : "flex-row"}`}
      style={{ height: "80vh" }}
    >
      <div className="flex flex-col md:flex-row w-full h-full">
        <div className="basis-1/5 bg-white order-2 z-30 overflow-y-auto">
          <FilterSection onChangeFilters={setFilters} />
        </div>

        <div className="basis-1/4 bg-white order-3 z-30 overflow-y-auto">
          <Listing
            listing={visibleListings} // Utilise les listings visibles ici
            filters={filters}
            searchAddress={searchAddress}
          />
        </div>

        <div
          className={`${
            isMapExpanded
              ? "fixed inset-0 top-[100px] z-50 p-8 order-3 overflow-hidden"
              : "relative order-3 flex-grow flex flex-col bg-white"
          }`}
          style={{
            top: isMapExpanded ? "100px" : "0px",
            zIndex: isMapExpanded ? 40 : 30,
            height: isMapExpanded ? "calc(100vh - 100px)" : "100%",
          }}
        >
          <GoogleMapSection
            listing={listing} // Envoie tous les listings à GoogleMapSection
            coordinates={coordinates}
            isMapExpanded={isMapExpanded}
            onVisibleListingsChange={setVisibleListings} // Mets à jour les listings visibles
          />

          {/* Supprimé la section de GoogleAddressSearch */}

          <button
            onClick={toggleMapSize}
            className={`absolute z-40 top-4 left-5 bg-primary text-black h-10 w-auto px-4 py-2 rounded-md flex items-center justify-center`}
          >
            {isMapExpanded ? (
              <>
                <ChevronRight className="w-5 h-5 mr-2" />
                <span>Afficher la liste</span>
              </>
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ListingMapView;
