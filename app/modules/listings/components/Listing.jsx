"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, Award, Heart } from "lucide-react";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useListingState } from "@/app/contexts/MapDataContext/ListingStateContext";
import { useMapState } from "@/app/contexts/MapDataContext/MapStateContext";
import { useListingsWithImages } from "@/app/hooks/useListingsWithImages";

const BookingStyleLoader = () => (
  <div className="absolute inset-0 flex items-center justify-center z-30">
    <div className="bg-white rounded-md shadow-lg p-4 flex flex-col items-center w-64 max-w-[85%]">
      <div className="w-8 h-8 mb-3">
        <svg
          className="animate-spin"
          viewBox="0 0 50 50"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="#0071c2"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="90, 150"
            strokeDashoffset="0"
          />
        </svg>
      </div>
      <p className="text-center text-gray-700 font-medium">
        Chargement des établissements...
      </p>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-lg border border-gray-200 shadow-sm">
    <Image
      src="/empty-state.svg"
      alt="Aucun résultat"
      width={120}
      height={120}
      className="mb-6 opacity-70"
    />
    <h3 className="text-xl font-semibold text-gray-700 mb-2">
      Aucune ferme trouvée dans cette zone
    </h3>
    <p className="text-gray-500 text-center mb-6">
      Essayez de déplacer la carte ou de modifier vos filtres pour voir plus de
      résultats.
    </p>
    <div className="flex flex-wrap gap-3 justify-center text-sm text-gray-600">
      <div className="flex items-center gap-1">
        <MapPin className="h-4 w-4 text-green-600" />
        <span>Déplacez la carte</span>
      </div>
      <div className="flex items-center gap-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-green-600"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <span>Zoomez pour voir plus de détails</span>
      </div>
    </div>
  </div>
);

const ListItem = React.memo(
  ({
    item,
    isHovered,
    isFavorite,
    onMouseEnter,
    onMouseLeave,
    onToggleFavorite,
  }) => {
    const [imageError, setImageError] = useState(false);
    const DEFAULT_IMAGE = "/default-image.jpg";

    const getImageUrl = () => {
      if (imageError) return DEFAULT_IMAGE;
      if (!item.listingImages) return DEFAULT_IMAGE;
      if (Array.isArray(item.listingImages) && item.listingImages.length > 0) {
        return item.listingImages[0].url || DEFAULT_IMAGE;
      }
      if (typeof item.listingImages === "object" && item.listingImages.url) {
        return item.listingImages.url;
      }
      return DEFAULT_IMAGE;
    };

    return (
      <div
        id={`listing-${item.id}`}
        className={`relative transition-all duration-300 ease-in-out transform ${
          isHovered ? "scale-105 shadow-lg border-green-500" : "scale-100"
        }`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Link href={`/view-listing/${item.id}`} className="block">
          <div
            className={`flex bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
              isHovered ? "border-green-500 shadow-md" : "border-gray-200"
            }`}
          >
            <div className="relative w-36 h-36 flex-shrink-0">
              <Image
                src={getImageUrl()}
                alt={`Image de ${item.name}`}
                width={160}
                height={160}
                className="object-cover w-full h-full"
                onError={() => setImageError(true)}
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow hover:bg-white"
              >
                <Heart
                  className={`h-5 w-5 ${
                    isFavorite ? "text-red-500 fill-red-500" : "text-gray-400"
                  }`}
                />
              </button>
            </div>
            <div className="flex flex-col p-4 w-full">
              <h2 className="text-lg font-medium text-gray-900">{item.name}</h2>
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <MapPin className="h-4 w-4 text-green-600 mr-1" />
                {item.address}
              </div>
              {item.certifications?.length > 0 && (
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Award className="h-4 w-4 text-green-600 mr-1" />
                  {item.certifications[0]}
                </div>
              )}
              {item.product_type?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {item.product_type.slice(0, 3).map((p, i) => (
                    <span
                      key={i}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-end mt-auto">
                {item.openingHours && (
                  <div className="flex items-center text-xs text-gray-600">
                    <Clock className="h-4 w-4 text-green-600 mr-1" />
                    {item.openingHours}
                  </div>
                )}
                {item.availability && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      item.availability === "open"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.availability === "open" ? "Ouvert" : "Fermé"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }
);

ListItem.displayName = "ListItem";

export default function Listing() {
  const {
    visibleListings = [],
    hoveredListingId,
    setHoveredListingId,
    setListings,
  } = useListingState() || {};
  const { mapBounds } = useMapState() || {};
  const { user } = useUser();
  const { openSignUp } = useClerk();
  const [favorites, setFavorites] = useState([]);

  const visibleIds = visibleListings?.map((item) => item.id) || [];
  const { listings, isLoading } = useListingsWithImages(visibleIds);

  const [delayedLoading, setDelayedLoading] = useState(true);
  const loadingTimerRef = useRef(null);

  useEffect(() => {
    if (isLoading) {
      setDelayedLoading(true);
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    } else {
      loadingTimerRef.current = setTimeout(() => {
        setDelayedLoading(false);
      }, 1000);
    }
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, [isLoading]);

  useEffect(() => {
    if (listings.length > 0 && setListings) {
      setListings(listings);
    }
  }, [listings, setListings]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("favorites")
          .eq("user_id", user.id)
          .single();
        if (data) setFavorites(data.favorites || []);
      } else {
        const stored = localStorage.getItem("farmToForkFavorites");
        if (stored) setFavorites(JSON.parse(stored));
      }
    };
    fetchFavorites();
  }, [user]);

  const toggleFavorite = async (id) => {
    if (!user) {
      toast("Connectez-vous pour gérer vos favoris");
      openSignUp({ redirectUrl: "/signup" });
      return;
    }
    const updatedFavorites = favorites.includes(id)
      ? favorites.filter((fid) => fid !== id)
      : [...favorites, id];
    setFavorites(updatedFavorites);
    const { error } = await supabase
      .from("profiles")
      .update({ favorites: updatedFavorites })
      .eq("user_id", user.id);
    if (error) toast.error("Erreur favoris");
    else
      toast.success(
        updatedFavorites.includes(id)
          ? "Ajouté aux favoris"
          : "Retiré des favoris"
      );
  };

  const handleMouseEnter = (id) => setHoveredListingId?.(id);
  const handleMouseLeave = () => setHoveredListingId?.(null);

  if (visibleIds.length === 0) {
    return (
      <div className="p-4 min-h-screen relative">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="p-4 min-h-screen relative">
      {delayedLoading && <BookingStyleLoader />}
      <div
        className={`flex flex-col gap-4 ${
          delayedLoading ? "opacity-70 pointer-events-none" : ""
        }`}
      >
        {listings.length ? (
          listings.map((item) => (
            <ListItem
              key={item.id}
              item={item}
              isHovered={hoveredListingId === item.id}
              isFavorite={favorites.includes(item.id)}
              onMouseEnter={() => handleMouseEnter(item.id)}
              onMouseLeave={handleMouseLeave}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
