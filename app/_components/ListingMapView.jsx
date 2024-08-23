"use client"; // Assurez-vous que ce fichier est bien traité comme un composant client

import React, { useEffect, useState } from "react";
import Listing from "./Listing";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import GoogleMapSection from "./GoogleMapSection";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCoordinates } from "../contexts/CoordinateContext";
import { useSearchParams } from "next/navigation"; // Utilisez useSearchParams pour extraire les paramètres de l'URL
import GoogleAddressSearch from "./GoogleAddressSearch";

function ListingMapView({ typeferme }) {
  const [listing, setListing] = useState([]);
  const [visibleListings, setVisibleListings] = useState([]); // Nouvel état pour les fermes visibles
  const [searchAddress, setSearchAddress] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const { coordinates, setCoordinates } = useCoordinates();
  const searchParams = useSearchParams(); // Obtenez les paramètres de l'URL

  useEffect(() => {
    // Extraire les coordonnées de l'URL
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      setCoordinates({ lat: parsedLat, lng: parsedLng });
    }
  }, [searchParams, setCoordinates]);

  useEffect(() => {
    if (!coordinates) {
      setCoordinates({ lat: 0, lng: 0 }); // Ou une autre valeur par défaut appropriée
    }
  }, [coordinates, setCoordinates]);

  useEffect(() => {
    if (coordinates && coordinates.lat && coordinates.lng) {
      getLatestListing();
    }
  }, [typeferme, coordinates, searchAddress]);

  const getLatestListing = async () => {
    const { lat, lng } = coordinates;

    // Utiliser les coordonnées pour filtrer les fermes
    const { data, error } = await supabase
      .from("listing")
      .select(
        `*,listingImages(
            url,
            listing_id)`
      )
      .eq("active", true)
      .eq("typeferme", typeferme)
      .ilike(
        "address",
        `%${searchAddress?.value?.structured_formatting?.main_text || ""}%`
      )
      .order("id", { ascending: false });

    if (data) {
      setListing(data);
      setVisibleListings(data); // Initialement, toutes les fermes sont visibles
    }
    if (error) {
      toast.error("Search Error");
    }
  };

  const toggleMapSize = () => {
    setIsMapExpanded(!isMapExpanded);
  };

  return (
    <div
      className={`grid gap-6 ${
        isMapExpanded ? "md:grid-cols-1" : "md:grid-cols-2"
      }`}
    >
      {!isMapExpanded && (
        <div className="relative z-0">
          <GoogleAddressSearch
            selectedAddress={(v) => {
              setSearchAddress(v);
              setCoordinates({
                lat: v?.value?.geometry?.location?.lat() || 0,
                lng: v?.value?.geometry?.location?.lng() || 0,
              });
            }}
            setCoordinates={setCoordinates}
          />
          {searchAddress && (
            <div className="px-3 my-5">
              <h2 className="font-xl">
                Found{" "}
                <span className="font-bold">{visibleListings?.length}</span>{" "}
                Results in{" "}
                <span className="text-primary font-bold">
                  {searchAddress?.label}
                </span>
              </h2>
            </div>
          )}
          <Listing
            listing={visibleListings} // Passe uniquement les fermes visibles
            setCoordinates={setCoordinates}
          />
        </div>
      )}

      <div
        className={`${
          isMapExpanded
            ? "fixed inset-0 z-5 top-[60px] p-50"
            : "fixed right-10 top-[120px] h-[calc(100vh-90vh)] md:w-[350px] lg:w-[450px] xl:w-[650px] z-5"
        }`}
      >
        <GoogleMapSection
          listing={listing}
          coordinates={coordinates}
          isMapExpanded={isMapExpanded}
          setVisibleListings={setVisibleListings} // Passe la fonction de filtrage
        />

        <button
          onClick={toggleMapSize}
          className={`absolute z-10 bottom-5 left-5 bg-primary text-white px-4 py-2 rounded-md ${
            isMapExpanded ? "top-[80vm] bottom-[80vh]" : ""
          }`}
        >
          {isMapExpanded ? (
            <div className="flex items-center">
              <ChevronRight className="w-5 h-5 mr-2" />
              <span>Afficher la liste</span>
            </div>
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}

export default ListingMapView;
