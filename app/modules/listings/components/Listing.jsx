"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, ChevronDown, Clock, Award, Heart } from "lucide-react";
import React, { useState, useEffect, useCallback, useRef } from "react";
// Ajout des importations manquantes
import { useUser, useClerk } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

const ListItem = React.memo(
  ({
    item,
    isHovered,
    isFavorite,
    onMouseEnter,
    onMouseLeave,
    onToggleFavorite,
  }) => {
    const imageUrl = item?.listingImages?.[0]?.url || "/default-image.jpg";
    const name = item?.name || "Sans nom";
    const address = item?.address || "Adresse non disponible";
    const description = item?.description;
    const certifications = item?.certifications || [];
    const products = item?.products || [];
    const openingHours = item?.openingHours;
    const availability = item?.availability;

    const containerClasses = `relative transition-all duration-200 ${
      isHovered ? "scale-[1.01]" : ""
    }`;
    const cardClasses = `flex flex-row bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 ${
      isHovered ? "border-green-500 shadow-md" : "border-gray-200"
    }`;
    const heartClasses = `h-5 w-5 ${
      isFavorite ? "text-red-500 fill-red-500" : "text-gray-400"
    }`;

    return (
      <div
        id={`listing-${item.id}`}
        className={containerClasses}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Link href={`/view-listing/${item.id}`} className="block">
          <div className={cardClasses}>
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 flex-shrink-0">
              <Image
                src={imageUrl}
                alt={`Image de ${name}`}
                width={160}
                height={160}
                sizes="(max-width: 640px) 128px, 160px"
                priority={isHovered}
                className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
              />
              <button
                onClick={(e) => {
                  e.preventDefault(); // Empêche d'ouvrir ViewListing en cliquant sur le cœur uniquement
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className="absolute top-2 right-2 z-20 bg-white/90 p-1.5 rounded-full shadow-sm hover:bg-white transition-colors"
                aria-label={
                  isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
                }
              >
                <Heart className={heartClasses} />
              </button>
            </div>

            <div className="flex flex-col flex-grow p-4 w-full min-w-0">
              <h2 className="text-lg font-medium text-gray-900 mb-1">{name}</h2>
              <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
                <MapPin className="h-4 w-4 flex-shrink-0 text-green-600" />
                <span className="truncate">{address}</span>
              </div>

              {description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {description}
                </p>
              )}

              {certifications.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
                  <Award className="h-4 w-4 text-green-600" />
                  <span>
                    {certifications[0]}
                    {certifications.length > 1 && (
                      <span className="text-gray-500">
                        {" "}
                        +{certifications.length - 1}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {products.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {products.slice(0, 3).map((product, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
                    >
                      {product}
                    </span>
                  ))}
                  {products.length > 3 && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      +{products.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-auto pt-1">
                {openingHours && (
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="truncate max-w-[200px]">
                      {openingHours}
                    </span>
                  </div>
                )}
                {availability && (
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full ${
                      availability === "open"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {availability === "open" ? "Ouvert" : "Fermé"}
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

function Listing({ onLoadMore, hasMore, isLoading }) {
  // Utilisation sécurisée du contexte
  let visibleListings = [];
  let hoveredListingId = null;
  let setHoveredListingId = () => {};

  // Essayez d'importer et d'utiliser le contexte si disponible
  try {
    const {
      useListingState,
    } = require("@/app/contexts/MapDataContext/ListingStateContext");
    const listingState = useListingState();
    visibleListings = listingState?.visibleListings || [];
    hoveredListingId = listingState?.hoveredListingId;
    setHoveredListingId = listingState?.setHoveredListingId || (() => {});
  } catch (error) {
    // Si le contexte n'est pas disponible, utilisez les props directement
    console.log("Contexte ListingState non disponible:", error);
    visibleListings = [];
  }

  const { user } = useUser();
  const { openSignUp } = useClerk();
  const [favorites, setFavorites] = useState([]);
  const lastHoveredIdRef = useRef(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("favorites")
          .eq("user_id", user.id)
          .single();
        if (!error && profile) {
          setFavorites(profile.favorites || []);
        }
      } else {
        const stored = localStorage.getItem("farmToForkFavorites");
        if (stored) setFavorites(JSON.parse(stored));
      }
    };
    fetchFavorites();
  }, [user]);

  const toggleFavorite = useCallback(
    async (id) => {
      if (!user) {
        toast("Connectez-vous pour gérer vos favoris");
        openSignUp({ redirectUrl: "/signup" });
        return;
      }

      const updatedFavorites = favorites.includes(id)
        ? favorites.filter((fid) => fid !== id)
        : [...favorites, id];

      setFavorites(updatedFavorites);

      try {
        const { error } = await supabase
          .from("profiles")
          .update({ favorites: updatedFavorites })
          .eq("user_id", user.id);

        if (error) throw error;

        toast.success(
          updatedFavorites.includes(id)
            ? "Ajouté aux favoris"
            : "Retiré des favoris"
        );
      } catch (err) {
        toast.error("Erreur lors de la mise à jour des favoris");
      }
    },
    [favorites, user, openSignUp]
  );

  const handleMouseEnter = useCallback(
    (id) => {
      if (lastHoveredIdRef.current !== id) {
        lastHoveredIdRef.current = id;
        setHoveredListingId(id);
      }
    },
    [setHoveredListingId]
  );

  const handleMouseLeave = useCallback(() => {
    lastHoveredIdRef.current = null;
    setHoveredListingId(null);
  }, [setHoveredListingId]);

  return (
    <div className="p-4 min-h-screen">
      <div className="flex flex-col gap-4">
        {visibleListings.length > 0 ? (
          <>
            {visibleListings.map((item) => (
              <ListItem
                key={item.id}
                item={item}
                isHovered={hoveredListingId === item.id}
                isFavorite={favorites.includes(item.id)}
                onMouseEnter={() => handleMouseEnter(item.id)}
                onMouseLeave={handleMouseLeave}
                onToggleFavorite={() => toggleFavorite(item.id)}
              />
            ))}
            {hasMore && (
              <button
                onClick={onLoadMore}
                disabled={isLoading}
                className="mt-4 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md flex items-center justify-center gap-2 disabled:bg-green-400 transition-colors shadow-sm"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Chargement...
                  </>
                ) : (
                  <>
                    Charger plus <ChevronDown className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-gray-500 text-center mb-4">
              Aucun résultat trouvé.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Listing;
