"use client";

import React, { useEffect, useState, useCallback } from "react";
import Listing from "./Listing";
import GoogleMapSection from "./GoogleMapSection";
import { ChevronLeft, ChevronRight } from "lucide-react"; // Import des icônes
import { useCoordinates } from "../contexts/CoordinateContext";
import { useMapListing } from "../contexts/MapListingContext";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

function ListingMapView({ typeferme, filters }) {
  const mapListingContext = useMapListing();

  // Check if mapListingContext is available
  if (!mapListingContext) {
    console.error("MapListingProvider not set properly.");
    return null; // Prevent the component from rendering if the context is not provided
  }

  const { setListings, setVisibleListings } = mapListingContext;

  const [searchAddress, setSearchAddress] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const { coordinates } = useCoordinates();

  // Fonction pour récupérer les listings sans causer de boucle infinie
  const getLatestListing = useCallback(async () => {
    console.log("Fetching latest listings...");
    let query = supabase
      .from("listing")
      .select(`*, listingImages(url, listing_id)`)
      .eq("active", true)

    // Appliquer les filtres dans la requête
    Object.keys(filters).forEach((key) => {
      if (filters[key]?.length > 0) {
        query = query.or(
          filters[key].map((value) => `${key}.cs.{${value}}`).join(",")
        );
      }
    });

    const { data, error } = await query.order("id", { ascending: false });
    console.log("Données récupérées :", data);

    if (error) {
      toast.error("Erreur lors de la recherche des listings");
      console.error("Error fetching listings:", error);
      return [];
    }

    console.log("Fetched data:", data);
    return data;
  }, [typeferme, filters]);

  // useEffect pour récupérer les listings, limité à la dépendance coordinates
  useEffect(() => {
    const fetchData = async () => {
      if (coordinates && coordinates.lat && coordinates.lng) {
        const data = await getLatestListing();
        if (data) {
          setListings(data); // Mettre à jour toutes les fermes dans le contexte
          setVisibleListings(data); // Afficher les fermes visibles initialement
        }
      }
    };
    fetchData();
  }, [
    coordinates,
    typeferme,
    getLatestListing,
    setListings,
    setVisibleListings,
    filters,
  ]);

  const toggleMapSize = () => {
    setIsMapExpanded((prev) => !prev);
  };

  return (
    <div
      className="flex flex-col md:flex-row gap-4 px-2 bg-white"
      style={{ height: "80vh" }}
    >
      {/* Section des Listings */}
      <div className="flex-grow w-full h-full md:basis-1/2 overflow-y-auto">
        <Listing searchAddress={searchAddress} />
      </div>

      {/* Section de la carte */}
      <div
        className={`${
          isMapExpanded
            ? "hidden md:inline-flex fixed inset-0 top-[100px] z-50 p-8 overflow-hidden"
            : "relative flex-grow flex flex-col bg-white"
        } ${isMapExpanded ? "" : "hidden xl:inline-flex xl:min-w-[600px]"}`}
        style={{
          top: isMapExpanded ? "100px" : "0px",
          zIndex: isMapExpanded ? 40 : 30,
          height: isMapExpanded ? "calc(100vh - 100px)" : "100%",
        }}
      >
        <GoogleMapSection
          coordinates={coordinates}
          isMapExpanded={isMapExpanded}
        />

        <button
          onClick={toggleMapSize}
          className="absolute z-40 top-4 left-5 bg-primary text-black h-10 w-auto px-4 py-2 rounded-md flex items-center justify-center"
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
  );
}

export default ListingMapView;
