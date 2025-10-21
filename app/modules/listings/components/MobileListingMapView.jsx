"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
  ChevronUp,
  ChevronDown,
  Filter,
} from "@/utils/icons";
import { toast } from "sonner";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase/client";
// ✅ Imports Zustand
import {
  useListingsState,
  useListingsActions,
  useFiltersState,
  useInteractionsState,
  useInteractionsActions,
} from "@/lib/store/mapListingsStore";
import { useMapboxState } from "@/lib/store/mapboxListingsStore";
import {
  useUserFavorites,
  useUserActions,
} from "@/lib/store/userStore";
import { useRouter } from "next/navigation";
import { ListingImage } from "@/components/ui/OptimizedImage";
import MapboxSection from "../../maps/components/MapboxSection";
import { openMobileFilters } from "@/app/_components/layout/FilterSection";
import MapboxCitySearch from "../../maps/components/shared/MapboxCitySearch";

// Hook pour gérer le bottom sheet
const useBottomSheet = (initialHeight = 400) => {
  const [height, setHeight] = useState(initialHeight);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const containerRef = useRef(null);

  const minHeight = 190;
  const maxHeight =
    typeof window !== "undefined" ? window.innerHeight * 0.85 : 600; // 85% de l'écran

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setStartHeight(height);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    const deltaY = startY - currentY;
    const newHeight = Math.max(
      minHeight,
      Math.min(maxHeight, startHeight + deltaY)
    );
    setHeight(newHeight);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Snap à des positions fixes
    if (height < 250) {
      setHeight(minHeight); // Position fermée
    } else if (height < maxHeight * 0.6) {
      setHeight(maxHeight * 0.55); // Position demi-ouverte
    } else {
      setHeight(maxHeight); // Position pleine
    }
  };

  return {
    height,
    setHeight,
    isDragging,
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    minHeight,
    maxHeight,
  };
};

// Hook pour la virtualisation du scroll
const useVirtualizedList = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // Buffer
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount);

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    startIndex,
    endIndex,
  };
};

// Skeleton loader pour les cards
const SkeletonCard = ({ isCompact }) => {
  if (isCompact) {
    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-sm mb-3 flex animate-pulse">
        <div className="w-20 h-20 bg-gray-200 flex-shrink-0"></div>
        <div className="flex-1 p-3">
          <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded mb-2 w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-6 animate-pulse">
      <div className="w-full h-64 bg-gray-200"></div>
      <div className="p-5">
        <div className="h-6 bg-gray-200 rounded mb-3 w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
        <div className="flex gap-2 mb-3">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  );
};

// Composant de listing mobile avec vue compacte/étendue optimisée
const MobileListingCard = ({
  item,
  onHover,
  onLeave,
  isFavorite,
  onToggleFavorite,
  isCompact = false,
  style = {},
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

  if (isCompact) {
    return (
      <div style={style}>
        <Link href={`/view-listing/${item.id}`}>
          <div
            className="bg-white rounded-xl overflow-hidden shadow-sm mb-3 flex transition-transform duration-200 active:scale-95"
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
          >
            <div className="w-20 h-20 flex-shrink-0 relative">
              <ListingImage
                src={getImageUrl()}
                alt={`Image de ${item.name}`}
                fallbackSrc="/default-farm-image.jpg"
                priority={false}
                className="w-full h-full object-cover"
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className="absolute top-1 right-1 w-5 h-5 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <Heart
                  className={`w-3 h-3 ${isFavorite ? "text-red-500 fill-red-500" : "text-white"}`}
                />
              </button>
            </div>
            <div className="flex-1 p-3 min-w-0">
              <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                {item.name}
              </h3>
              <div className="flex items-center text-gray-600 mb-1">
                <MapPin className="h-3 w-3 text-green-600 mr-1 flex-shrink-0" />
                <span className="text-xs truncate">{item.address}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {item.product_type?.length > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      {item.product_type[0]}
                    </span>
                  )}
                  {item.product_type?.length > 1 && (
                    <span className="text-xs text-gray-500">
                      +{item.product_type.length - 1}
                    </span>
                  )}
                </div>
                {item.rating && (
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-1" />
                    <span className="text-xs text-gray-600">{item.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div style={style}>
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
              <h3 className="font-semibold text-lg text-gray-900 flex-1 leading-tight pr-2">
                {item.name}
              </h3>
              {item.rating && (
                <div className="flex items-center gap-1 flex-shrink-0">
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
                {item.product_type.slice(0, 3).map((type, i) => (
                  <span
                    key={i}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium"
                  >
                    {type}
                  </span>
                ))}
                {item.product_type.length > 3 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                    +{item.product_type.length - 3}
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
    </div>
  );
};

// Composant principal avec bottom sheet optimisé
const MobileListingMapView = () => {
  // ✅ Hooks Zustand
  const filters = useFiltersState();
  const { mapInstance } = useMapboxState();
  const { visible: visibleListings, isLoading, hasMore } = useListingsState();
  const { fetchListings } = useListingsActions();
  const { hoveredListingId } = useInteractionsState();
  const { setHoveredListingId } = useInteractionsActions();

  // ✅ Hooks favoris depuis userStore
  const favorites = useUserFavorites();
  const { loadFavorites, toggleFavorite: toggleFavoriteStore } = useUserActions();

  const { user } = useUser();
  const { openSignUp } = useClerk();

  const [isMapMoving, setIsMapMoving] = useState(false);
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [showLoader, setShowLoader] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Hook du bottom sheet
  const {
    height,
    setHeight,
    isDragging,
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    minHeight,
    maxHeight,
  } = useBottomSheet(200);

  // Calculer l'état d'expansion
  const isExpanded = height > maxHeight * 0.3;
  const isFullyExpanded = height > maxHeight * 0.7;

  // Filtrage rapide des résultats
  const filteredListings = useMemo(() => {
    if (!visibleListings) return [];
    if (!quickSearch.trim()) return visibleListings;

    return visibleListings.filter(
      (item) =>
        item.name.toLowerCase().includes(quickSearch.toLowerCase()) ||
        item.address.toLowerCase().includes(quickSearch.toLowerCase()) ||
        item.product_type?.some((type) =>
          type.toLowerCase().includes(quickSearch.toLowerCase())
        )
    );
  }, [visibleListings, quickSearch]);

  // Ref pour le scroll
  const scrollContainerRef = useRef(null);

  // Intersection Observer pour le scroll infini
  const loadMoreRef = useRef(null);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore]);

  // Mise à jour du total des résultats
  useEffect(() => {
    if (filteredListings) {
      setTotalResults(filteredListings.length);
    }
  }, [filteredListings]);

  // ✅ Chargement des favoris depuis le store
  useEffect(() => {
    if (user?.id) {
      loadFavorites(user.id);
    }
  }, [user?.id, loadFavorites]);

  // Loader state
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowLoader(true), 200);
      return () => clearTimeout(timer);
    } else {
      setShowLoader(false);
    }
  }, [isLoading]);

  // Écouteurs d'événements pour la carte Mapbox
  useEffect(() => {
    if (!mapInstance) return;

    const handleDragStart = () => {
      setIsMapMoving(true);
      setShowSearchButton(false);
    };

    const handleDragEnd = () => {
      setIsMapMoving(false);
      setTimeout(() => setShowSearchButton(true), 300);
    };

    const handleZoomEnd = () => {
      setTimeout(() => setShowSearchButton(true), 500);
    };

    // Mapbox événements
    mapInstance.on("dragstart", handleDragStart);
    mapInstance.on("dragend", handleDragEnd);
    mapInstance.on("zoomend", handleZoomEnd);

    return () => {
      if (mapInstance) {
        mapInstance.off("dragstart", handleDragStart);
        mapInstance.off("dragend", handleDragEnd);
        mapInstance.off("zoomend", handleZoomEnd);
      }
    };
  }, [mapInstance]);

  const handleFiltersClick = () => {
    openMobileFilters();
  };

  const handleSearchInArea = useCallback(() => {
    setShowSearchButton(false);
    setPage(1);

    // ✅ Le store Zustand utilise automatiquement mapBounds du state
    fetchListings({
      page: 1,
      forceRefresh: true,
    }).then((data) => {
      if (data && data.length > 0) {
        toast.success(`${data.length} fermes trouvées dans cette zone`);
      } else {
        toast.info("Aucune ferme trouvée dans cette zone");
      }
    });
  }, [fetchListings]);

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    const newPage = page + 1;
    setPage(newPage);

    try {
      await fetchListings({ page: newPage, append: true });
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoading, isLoadingMore, fetchListings]);

  // ✅ Wrapper pour toggleFavorite qui gère le cas non-connecté
  const handleToggleFavorite = useCallback(
    (id) => {
      if (!user) {
        toast("Connectez-vous pour gérer vos favoris");
        openSignUp({ redirectUrl: "/signup" });
        return;
      }
      toggleFavoriteStore(id, user.id);
    },
    [user, toggleFavoriteStore, openSignUp]
  );

  const handleHover = (id) => {
    setHoveredListingId?.(id);
  };

  const handleLeave = () => {
    setHoveredListingId?.(null);
  };

  // Générer des skeletons pour le loading
  const renderSkeletons = (count = 6) => {
    return Array.from({ length: count }, (_, i) => (
      <SkeletonCard key={`skeleton-${i}`} isCompact={!isExpanded} />
    ));
  };

  return (
    <div className="h-screen bg-white overflow-hidden relative">
      {/* Barre de recherche et filtres entre header et carte */}
      <div className="top-24 left-0 right-0 z-30 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <MapboxCitySearch
              placeholder="Rechercher une ville..."
              onCitySelect={(cityData) => {
                console.log("Ville sélectionnée:", cityData);
              }}
            />
          </div>
          <button
            onClick={handleFiltersClick}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Carte en arrière-plan avec marge pour le header */}
      <div className="absolute top-20 left-0 right-0 bottom-0">
        <MapboxSection isMapExpanded={true} isMobile={true} />

        {/* Indicateur de mouvement */}
        {isMapMoving && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-full shadow-lg border border-gray-200">
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
          <div
            className="absolute left-1/2 transform -translate-x-1/2 z-20 animate-slide-up"
            style={{ bottom: `${height + 20}px` }}
          >
            <button
              onClick={handleSearchInArea}
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-full shadow-xl flex items-center gap-3 text-base font-medium"
            >
              <Search className="w-5 h-5" />
              Rechercher dans cette zone
            </button>
          </div>
        )}
      </div>

      {/* Bottom Sheet collé au bas */}
      <div
        ref={containerRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-40 transition-all duration-300 ease-out"
        style={{
          height: `${height}px`,
          marginBottom: "0px",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle pour le drag */}
        <div className="w-full flex justify-center pt-3 pb-2 cursor-pointer">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header du bottom sheet */}
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-lg text-gray-900">
                {totalResults > 0
                  ? `${totalResults.toLocaleString()} ferme${totalResults > 1 ? "s" : ""}`
                  : "Aucune ferme"}
              </h2>
              <p className="text-sm text-gray-600">
                {quickSearch
                  ? "correspondant à votre recherche"
                  : "dans la zone de la carte"}
              </p>
            </div>
            <button
              onClick={() => setHeight(isFullyExpanded ? 200 : maxHeight)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {isFullyExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Recherche rapide quand étendu */}
          {isExpanded && (
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher dans les résultats..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>

        {/* Contenu scrollable avec optimisations */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{
            height: `${height - (isExpanded ? 160 : 120)}px`, // Ajustement dynamique
          }}
        >
          {showLoader &&
          (!filteredListings || filteredListings.length === 0) ? (
            <div className="space-y-4">{renderSkeletons()}</div>
          ) : filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Aucune ferme trouvée
              </h3>
              <p className="text-gray-600 text-center text-sm">
                {quickSearch
                  ? "Essayez avec d'autres mots-clés"
                  : "Essayez de déplacer la carte ou d'ajuster vos filtres"}
              </p>
            </div>
          ) : (
            <>
              {filteredListings.map((item) => (
                <MobileListingCard
                  key={item.id}
                  item={item}
                  onHover={() => handleHover(item.id)}
                  onLeave={handleLeave}
                  isFavorite={favorites.includes(item.id)}
                  onToggleFavorite={() => handleToggleFavorite(item.id)}
                  isCompact={!isExpanded}
                />
              ))}

              {/* Zone de chargement infini */}
              {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-8">
                  {isLoadingMore ? (
                    <div className="flex flex-col items-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-green-600 mb-2" />
                      <span className="text-sm text-gray-600">
                        Chargement...
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={handleLoadMore}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-medium transition-colors"
                    >
                      Charger plus
                    </button>
                  )}
                </div>
              )}

              {/* Indicateur fin de liste */}
              {!hasMore && filteredListings.length > 10 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Vous avez vu toutes les fermes disponibles
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Styles CSS */}
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

        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Suppression des marges et espacements indésirables */
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        /* Container principal sans espacement */
        .h-screen {
          height: 100vh;
          height: 100dvh; /* Dynamic viewport height pour mobile */
        }
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 2px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default MobileListingMapView;
