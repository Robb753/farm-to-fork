"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  MapPin,
  List,
  ArrowLeft,
  SlidersHorizontal,
  Heart,
  Star,
  RefreshCw,
  Award,
  Clock,
} from "@/utils/icons";
import { toast } from "sonner";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase/client";
import { useMapData } from "@/app/contexts/MapDataContext/useMapData";
import { useMapState } from "@/app/contexts/MapDataContext/MapStateContext";
import { useListingState } from "@/app/contexts/MapDataContext/ListingStateContext";
import { useRouter } from "next/navigation";
import { ListingImage } from "@/components/ui/OptimizedImage";
import GoogleMapSection from "../../maps/components/GoogleMapSection";
import { openMobileFilters } from "@/app/_components/layout/FilterSection";
import CitySearch from "../../maps/components/shared/CitySearch";

// Composant de carte mobile qui utilise GoogleMapSection
const MobileMapView = ({
  isMapExpanded,
  onMapMove,
  isMoving,
  showSearchButton,
  onSearchInArea,
  onToggleView,
  totalResults,
}) => {
  const handleFiltersClick = () => {
    openMobileFilters();
  };

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden">
      {/* Header mobile avec CitySearch */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* CitySearch remplace la zone géographique */}
          <div className="flex-1">
            <CitySearch
              placeholder="Rechercher une ville..."
              onCitySelect={(cityData) => {
                // La navigation est gérée automatiquement par CitySearch
                console.log("Ville sélectionnée:", cityData);
              }}
            />
          </div>

          <button
            onClick={handleFiltersClick} // ✅ Connecté aux filtres
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Carte qui prend toute la hauteur disponible */}
      <div className="absolute top-0 left-0 right-0 bottom-0 w-full h-full">
        <GoogleMapSection isMapExpanded={true} isMobile={true} />
      </div>

      {/* Indicateur de mouvement */}
      {isMoving && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 animate-spin text-green-600" />
            <span className="text-sm font-medium text-gray-700">
              Recherche en cours...
            </span>
          </div>
        </div>
      )}

      {/* Bouton rechercher dans cette zone */}
      {showSearchButton && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-30 animate-slide-up">
          <button
            onClick={onSearchInArea}
            className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-full shadow-xl flex items-center gap-3 text-base font-medium"
          >
            <Search className="w-5 h-5" />
            Rechercher dans cette zone
          </button>
        </div>
      )}

      {/* Toggle liste/carte - positionné au bottom de la map */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 p-4">
        <div className="flex justify-center">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-8">
            <button
              onClick={() => onToggleView("list")}
              className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
            >
              <List className="w-5 h-5" />
              <span className="text-sm font-medium">Liste</span>
            </button>
            <div className="w-px h-5 bg-gray-600"></div>
            <button className="flex items-center gap-2 opacity-100">
              <MapPin className="w-5 h-5" />
              <span className="text-sm font-medium">Carte</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant de listing mobile individuel
const MobileListingCard = ({
  item,
  onHover,
  onLeave,
  isFavorite,
  onToggleFavorite,
}) => {
  const getImageUrl = () => {
    if (!item.listingImages) return "/default-farm-image.jpg";
    if (Array.isArray(item.listingImages) && item.listingImages.length > 0) {
      return item.listingImages[0].url || "/default-farm-image.jpg";
    }
    if (typeof item.listingImages === "object" && item.listingImages.url) {
      return item.listingImages.url;
    }
    return "/default-farm-image.jpg";
  };

  return (
    <Link href={`/view-listing/${item.id}`}>
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-sm mb-6 transition-transform duration-200 active:scale-95"
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      >
        <div className="relative">
          <div className="w-full h-64 relative">
            <ListingImage
              src={getImageUrl()}
              alt={`Image de ${item.name}`}
              fallbackSrc="/default-farm-image.jpg"
              priority={false}
            />

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="absolute top-3 right-3 w-10 h-10 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <Heart
                className={`w-5 h-5 ${isFavorite ? "text-red-500 fill-red-500" : "text-white"}`}
              />
            </button>

            {item.certifications?.length > 0 && (
              <div className="absolute top-3 left-3 bg-white px-3 py-1 rounded-lg shadow-sm">
                <span className="text-xs font-semibold text-green-700">
                  {item.certifications[0]}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-lg text-gray-900 flex-1 leading-tight">
              {item.name}
            </h3>
            {item.rating && (
              <div className="flex items-center gap-1 ml-3">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-semibold text-gray-900">
                  {item.rating}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
            <span className="text-sm truncate">{item.address}</span>
          </div>

          {item.product_type?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {item.product_type.slice(0, 2).map((type, i) => (
                <span
                  key={i}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium"
                >
                  {type}
                </span>
              ))}
              {item.product_type.length > 2 && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                  +{item.product_type.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {item.openingHours && (
                <div className="flex items-center text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-xs">{item.openingHours}</span>
                </div>
              )}
            </div>

            {item.availability && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
  );
};

// Composant de vue liste mobile
const MobileListView = ({
  listings,
  totalResults,
  isLoading,
  onToggleView,
  onLoadMore,
  hasMore,
  favorites,
  onToggleFavorite,
  onHover,
  onLeave,
  hoveredListingId,
}) => {
  const [showLoader, setShowLoader] = useState(false);

  const handleFiltersClick = () => {
    openMobileFilters(); // ✅ Ouvre la modal de filtres
  };

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowLoader(true), 200);
      return () => clearTimeout(timer);
    } else {
      setShowLoader(false);
    }
  }, [isLoading]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header liste mobile */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-bold text-xl text-gray-900">
            {totalResults.toLocaleString()} fermes
          </h1>
          <button
            onClick={handleFiltersClick} // ✅ Connecté aux filtres
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5 text-gray-700" />
          </button>
        </div>
        <div className="text-sm text-gray-600 text-center">
          Découvrez les producteurs près de vous
        </div>
      </div>

      {/* Liste des résultats avec scroll infini - padding bottom pour le footer */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
        {" "}
        {/* pb-32 pour le footer */}
        {showLoader && listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <span className="text-gray-600 font-medium">
              Chargement des fermes...
            </span>
          </div>
        ) : (
          <>
            {listings.map((item) => (
              <MobileListingCard
                key={item.id}
                item={item}
                onHover={() => onHover(item.id)}
                onLeave={onLeave}
                isFavorite={favorites.includes(item.id)}
                onToggleFavorite={() => onToggleFavorite(item.id)}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center py-8">
                <button
                  onClick={onLoadMore}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-medium disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    "Charger plus"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Toggle vue repositionné plus haut pour éviter le footer */}
      <div className="w-full flex justify-center py-4 bg-white shadow-inner">
        <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-8">
          <button
            className="flex items-center gap-2 opacity-100"
            onClick={() => onToggleView("list")}
          >
            <List className="w-5 h-5" />
            <span className="text-sm font-medium">Liste</span>
          </button>
          <div className="w-px h-5 bg-gray-600"></div>
          <button className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
            <MapPin className="w-5 h-5" />
            <span className="text-sm font-medium">Carte</span>
          </button>
        </div>
      </div>
      {/* Footer fixe en bas - même que la vue carte */}
    </div>
  );
};

// Composant principal mobile
const MobileListingMapView = () => {
  const { filters, coordinates, isLoading, fetchListings, hasMore } =
    useMapData();
  const { map } = useMapState();
  const { visibleListings, hoveredListingId, setHoveredListingId } =
    useListingState();
  const { user } = useUser();
  const { openSignUp } = useClerk();

  const [currentView, setCurrentView] = useState("map");
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState([]);

  // Mise à jour du total des résultats
  useEffect(() => {
    if (visibleListings) {
      setTotalResults(visibleListings.length);
    }
  }, [visibleListings]);

  // Chargement des favoris
  useEffect(() => {
    const fetchFavorites = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("favorites")
          .eq("user_id", user.id)
          .single();
        if (data) setFavorites(data.favorites || []);
      }
    };
    fetchFavorites();
  }, [user]);

  // Écouteurs d'événements pour la carte mobile
  useEffect(() => {
    if (!map) return;

    const handleDragStart = () => {
      setIsMapMoving(true);
      setShowSearchButton(false);
    };

    const handleDragEnd = () => {
      setIsMapMoving(false);
      setTimeout(() => setShowSearchButton(true), 300);
    };

    const handleZoomChanged = () => {
      setTimeout(() => setShowSearchButton(true), 500);
    };

    // Ajouter les écouteurs
    map.addListener("dragstart", handleDragStart);
    map.addListener("dragend", handleDragEnd);
    map.addListener("zoom_changed", handleZoomChanged);

    return () => {
      if (map) {
        google.maps.event.clearListeners(map, "dragstart");
        google.maps.event.clearListeners(map, "dragend");
        google.maps.event.clearListeners(map, "zoom_changed");
      }
    };
  }, [map]);

  const handleSearchInArea = useCallback(() => {
    setShowSearchButton(false);
    setPage(1);

    fetchListings({
      page: 1,
      forceRefresh: true,
      bounds: map?.getBounds(),
    }).then((data) => {
      if (data && data.length > 0) {
        toast.success(`${data.length} fermes trouvées dans cette zone`);
      } else {
        toast.info("Aucune ferme trouvée dans cette zone");
      }
    });
  }, [fetchListings, map]);

  const handleLoadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    const newPage = page + 1;
    setPage(newPage);
    fetchListings({ page: newPage, append: true });
  }, [page, hasMore, isLoading, fetchListings]);

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

    if (error) {
      toast.error("Erreur favoris");
    } else {
      toast.success(
        updatedFavorites.includes(id)
          ? "Ajouté aux favoris"
          : "Retiré des favoris"
      );
    }
  };

  const toggleView = (view) => {
    setCurrentView(view);
  };

  const handleHover = (id) => {
    setHoveredListingId?.(id);
  };

  const handleLeave = () => {
    setHoveredListingId?.(null);
  };

  return (
    <div className="relative w-full h-screen bg-white overflow-hidden flex flex-col">
      {currentView === "map" ? (
        <div className="flex-1 relative">
          <MobileMapView
            isMapExpanded={true}
            onMapMove={(moving) => setIsMapMoving(moving)}
            isMoving={isMapMoving}
            showSearchButton={showSearchButton}
            onSearchInArea={handleSearchInArea}
            onToggleView={toggleView}
            totalResults={totalResults}
          />
        </div>
      ) : (
        <MobileListView
          listings={visibleListings || []}
          totalResults={totalResults}
          isLoading={isLoading}
          onToggleView={toggleView}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onHover={handleHover}
          onLeave={handleLeave}
          hoveredListingId={hoveredListingId}
        />
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }

        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
};

export default MobileListingMapView;
