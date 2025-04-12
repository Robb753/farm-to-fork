"use client";

import Image from "next/image";
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import Link from "next/link";
import { MapPin, ChevronDown, Clock, Star, Award, Heart } from "lucide-react";
import { useListingState } from "@/app/contexts/MapDataContext/ListingStateContext";
import { useUser, useClerk } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

const ListItem = React.memo(
  ({
    item,
    isHovered,
    isSelected,
    isFavorite,
    onMouseEnter,
    onMouseLeave,
    onClick,
    onToggleFavorite,
  }) => {
    const containerClasses = useMemo(
      () =>
        `relative transition-all duration-200 ${
          isHovered || isSelected ? "scale-[1.01]" : ""
        }`,
      [isHovered, isSelected]
    );

    const cardClasses = useMemo(
      () =>
        `flex flex-row bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 ${
          isHovered || isSelected
            ? "border-green-500 shadow-md"
            : "border-gray-200"
        }`,
      [isHovered, isSelected]
    );

    const heartClasses = useMemo(
      () =>
        `h-5 w-5 ${isFavorite ? "text-red-500 fill-red-500" : "text-gray-400"}`,
      [isFavorite]
    );

    const imageUrl = item?.listingImages?.[0]?.url || "/default-image.jpg";
    const name = item?.name || "Sans nom";
    const address = item?.address || "Adresse non disponible";
    const description = item?.description;
    const certifications = item?.certifications || [];
    const products = item?.products || [];
    const openingHours = item?.openingHours;
    const availability = item?.availability;

    return (
      <div
        id={`listing-${item.id}`}
        className={containerClasses}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      >
        <Link href={`/view-listing/${item.id}`} className="block">
          <div className={cardClasses}>
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 flex-shrink-0">
              <Image
                src={imageUrl}
                width={160}
                height={160}
                className={`object-cover w-full h-full transition-all duration-300 ${
                  isHovered || isSelected ? "scale-105" : ""
                }`}
                alt={`Image de ${name}`}
                sizes="(max-width: 640px) 128px, 160px"
                priority={isSelected}
              />
              <button
                onClick={(e) => onToggleFavorite(e)}
                className="absolute top-2 right-2 z-20 bg-white/90 p-1.5 rounded-full shadow-sm hover:bg-white transition-colors"
                aria-label={
                  isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
                }
              >
                <Heart className={heartClasses} />
              </button>
            </div>

            <div className="flex flex-col flex-grow p-4 w-full min-w-0">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-1">
                  {name}
                </h2>
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
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Award className="h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>
                        {certifications.slice(0, 1).join(", ")}
                        {certifications.length > 1 && (
                          <span className="text-gray-500">
                            {" "}
                            +{certifications.length - 1}
                          </span>
                        )}
                      </span>
                    </div>
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
              </div>
              <div className="flex items-center justify-between mt-auto pt-1">
                {openingHours && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Clock className="h-4 w-4 flex-shrink-0 text-green-600" />
                    <span className="truncate max-w-[200px] text-xs sm:text-sm">
                      {openingHours || "Horaires non disponibles"}
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
  const {
    visibleListings = [],
    hoveredListingId,
    setHoveredListingId,
    selectedListingId,
    selectListing,
    clearSelection,
  } = useListingState();

  const { user } = useUser();
  const { openSignUp } = useClerk();
  const lastHoveredIdRef = useRef(null);
  const [favorites, setFavorites] = useState([]);

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
    async (id, e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) {
        toast("Connectez-vous pour gérer vos favoris");
        openSignUp({ redirectUrl: "/signup" });
        return;
      }

      const alreadyFavorite = favorites.includes(id);
      const updated = alreadyFavorite
        ? favorites.filter((fid) => fid !== id)
        : [...favorites, id];

      setFavorites(updated);

      try {
        const { error } = await supabase
          .from("profiles")
          .update({ favorites: updated })
          .eq("user_id", user.id);

        if (error) throw error;

        toast.success(
          alreadyFavorite ? "Retiré des favoris" : "Ajouté aux favoris"
        );
      } catch (err) {
        console.error("Erreur favoris", err.message);
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
        requestAnimationFrame(() => {
          const markerElement = document.querySelector(
            `[data-listing-id="${id}"]`
          );
          if (markerElement) {
            markerElement.classList.add("marker-hover-effect");
          }
        });
      }
    },
    [setHoveredListingId]
  );

  const handleMouseLeave = useCallback(() => {
    const previousHoveredId = lastHoveredIdRef.current;

    if (previousHoveredId) {
      requestAnimationFrame(() => {
        const markerElement = document.querySelector(
          `[data-listing-id="${previousHoveredId}"]`
        );
        if (markerElement) {
          markerElement.classList.remove("marker-hover-effect");
        }
      });
    }

    lastHoveredIdRef.current = null;
    setHoveredListingId(null);
  }, [setHoveredListingId]);

  const handleListingClick = useCallback(
    (e, id) => {
      if (
        e.target.tagName.toLowerCase() === "a" ||
        e.target.closest("a") ||
        e.target.tagName.toLowerCase() === "button" ||
        e.target.closest("button")
      ) {
        return;
      }

      e.preventDefault();

      if (id === selectedListingId) {
        clearSelection();
        return;
      }

      selectListing(id);

      requestAnimationFrame(() => {
        const marker = document.querySelector(`[data-listing-id="${id}"]`);
        if (marker) {
          const clickEvent = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window,
          });
          marker.dispatchEvent(clickEvent);
        }
      });
    },
    [selectedListingId, clearSelection, selectListing]
  );

  return (
    <div className="p-4 min-h-screen">
      <div className="flex flex-col gap-4">
        {visibleListings.length > 0 ? (
          <>
            {visibleListings.map((item) => {
              const isHovered = hoveredListingId === item.id;
              const isSelected = selectedListingId === item.id;
              const isFavorite = favorites.includes(item.id);

              return (
                <ListItem
                  key={item.id}
                  item={item}
                  isHovered={isHovered}
                  isSelected={isSelected}
                  isFavorite={isFavorite}
                  onMouseEnter={() => handleMouseEnter(item.id)}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => handleListingClick(e, item.id)}
                  onToggleFavorite={(e) => toggleFavorite(item.id, e)}
                />
              );
            })}

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
