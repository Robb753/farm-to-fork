"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  List,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
} from "@/utils/icons";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import FilterSection from "@/app/_components/layout/FilterSection";
import GoogleMapSection from "../../maps/components/GoogleMapSection";
import Listing from "./Listing";
import { useMapData } from "@/app/contexts/MapDataContext/useMapData";
import { useMapState } from "@/app/contexts/MapDataContext/MapStateContext";
import { useListingState } from "@/app/contexts/MapDataContext/ListingStateContext";
import ExploreMapSearch from "../../maps/components/shared/ExploreMapSearch";

// Import dynamique du composant mobile pour éviter les problèmes SSR
const MobileListingMapView = dynamic(() => import("./MobileListingMapView"), {
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
  ssr: false,
});

// Hook pour détecter si on est sur mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Vérification initiale
    checkMobile();

    // Écouter les changements de taille d'écran
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};

// Composant desktop existant
const DesktopListingMapView = () => {
  const { filters, coordinates, isLoading, fetchListings, hasMore } =
    useMapData();
  const { mapBounds, map } = useMapState();
  const { visibleListings } = useListingState();

  const searchParams = useSearchParams();
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // États pour la synchronisation temps réel
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [lastSearchTime, setLastSearchTime] = useState(Date.now());
  const [mapUpdatePending, setMapUpdatePending] = useState(false);

  // Refs pour debouncing
  const mapMoveTimeoutRef = useRef(null);
  const searchButtonTimeoutRef = useRef(null);
  const lastBoundsRef = useRef(null);

  // Gestion des événements de modale
  useEffect(() => {
    const handleModalEvent = (e) => {
      setIsModalOpen(e.detail === true);
    };

    window.addEventListener("modalOpen", handleModalEvent);
    return () => window.removeEventListener("modalOpen", handleModalEvent);
  }, []);

  // Mise à jour du total des résultats avec animation
  useEffect(() => {
    if (visibleListings) {
      const newTotal = visibleListings.length;
      if (newTotal !== totalResults) {
        setTotalResults(newTotal);
        if (newTotal > 0 && !isLoading) {
          setTimeout(() => {
            setLastSearchTime(Date.now());
          }, 500);
        }
      }
    }
  }, [visibleListings, totalResults, isLoading]);

  // Écouteurs d'événements pour la carte (style Airbnb)
  useEffect(() => {
    if (!map) return;

    const handleDragStart = () => {
      setIsMapMoving(true);
      setShowSearchButton(false);
      if (mapMoveTimeoutRef.current) {
        clearTimeout(mapMoveTimeoutRef.current);
      }
    };

    const handleDragEnd = () => {
      setIsMapMoving(false);
      setMapUpdatePending(true);

      if (searchButtonTimeoutRef.current) {
        clearTimeout(searchButtonTimeoutRef.current);
      }

      searchButtonTimeoutRef.current = setTimeout(() => {
        setShowSearchButton(true);
      }, 300);
    };

    const handleZoomChanged = () => {
      setMapUpdatePending(true);
      if (searchButtonTimeoutRef.current) {
        clearTimeout(searchButtonTimeoutRef.current);
      }

      searchButtonTimeoutRef.current = setTimeout(() => {
        setShowSearchButton(true);
      }, 500);
    };

    const handleBoundsChanged = () => {
      const currentBounds = map.getBounds();
      if (currentBounds && lastBoundsRef.current) {
        const hasSignificantChange = !currentBounds.equals(
          lastBoundsRef.current
        );
        if (hasSignificantChange) {
          setMapUpdatePending(true);
        }
      }
      lastBoundsRef.current = currentBounds;
    };

    // Ajouter les écouteurs
    map.addListener("dragstart", handleDragStart);
    map.addListener("dragend", handleDragEnd);
    map.addListener("zoom_changed", handleZoomChanged);
    map.addListener("bounds_changed", handleBoundsChanged);

    return () => {
      if (map) {
        google.maps.event.clearListeners(map, "dragstart");
        google.maps.event.clearListeners(map, "dragend");
        google.maps.event.clearListeners(map, "zoom_changed");
        google.maps.event.clearListeners(map, "bounds_changed");
      }
      if (mapMoveTimeoutRef.current) {
        clearTimeout(mapMoveTimeoutRef.current);
      }
      if (searchButtonTimeoutRef.current) {
        clearTimeout(searchButtonTimeoutRef.current);
      }
    };
  }, [map]);

  // Fonction de recherche dans la zone actuelle (style Airbnb)
  const searchInCurrentArea = useCallback(() => {
    setShowSearchButton(false);
    setMapUpdatePending(false);
    setPage(1);

    fetchListings({
      page: 1,
      forceRefresh: true,
      bounds: map?.getBounds(),
    })
      .then((data) => {
        if (data && data.length > 0) {
          toast.success(`${data.length} fermes trouvées dans cette zone`);
        } else {
          toast.info("Aucune ferme trouvée dans cette zone");
        }
      })
      .catch((error) => {
        toast.error("Erreur lors de la recherche");
        console.error("Search error:", error);
      });
  }, [fetchListings, map]);

  const loadMoreListings = useCallback(() => {
    if (isLoading || !hasMore) return;
    const newPage = page + 1;
    setPage(newPage);
    fetchListings({ page: newPage, append: true });
  }, [page, hasMore, isLoading, fetchListings]);

  const refreshListings = useCallback(() => {
    setPage(1);
    setShowSearchButton(false);
    setMapUpdatePending(false);

    fetchListings({ page: 1, forceRefresh: true }).then((data) => {
      if (data && data.length > 0) {
        toast.success(`${data.length} fermes trouvées`);
      } else {
        toast.info("Aucune ferme trouvée dans cette zone");
      }
    });
  }, [fetchListings]);

  const toggleMapSize = useCallback(() => {
    setIsMapExpanded((prev) => !prev);
  }, []);

  return (
    <div className="relative flex flex-col bg-white">
      {/* Backdrop semi-transparent quand une modale est ouverte */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-20 pointer-events-none" />
      )}

      <div
        className={`sticky top-0 ${isModalOpen ? "z-20" : "z-50"} bg-white shadow-sm border-b border-gray-200`}
      >
        <FilterSection />
      </div>

      {/* Barre de résultats améliorée avec feedback temps réel */}
      <div
        className={`bg-gray-50 py-3 px-4 border-b border-gray-200 flex items-center justify-between transition-all duration-300 ${
          isModalOpen ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-green-600" />
                <span className="text-gray-600 text-sm font-medium">
                  {isMapMoving ? "Recherche en cours..." : "Chargement..."}
                </span>
              </>
            ) : (
              <>
                <span className="text-gray-600 text-sm font-medium">
                  {totalResults} résultat{totalResults !== 1 ? "s" : ""} dans
                  cette zone
                </span>

                {/* Indicateur de mise à jour récente */}
                {Date.now() - lastSearchTime < 3000 && !isLoading && (
                  <div className="flex items-center gap-1 text-xs text-green-600 animate-fade-in">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Mis à jour</span>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            onClick={refreshListings}
            disabled={isLoading}
            className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1 disabled:opacity-50 transition-colors"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Actualiser</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 text-sm">
            <span className="text-gray-600 mr-1">Affichage :</span>
            <button
              className={`px-3 py-1.5 rounded-md flex items-center gap-1 transition-all duration-200 ${
                !isMapExpanded
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => setIsMapExpanded(false)}
            >
              <List className="h-4 w-4" />
              <span>Liste</span>
            </button>
            <button
              className={`px-3 py-1.5 rounded-md flex items-center gap-1 transition-all duration-200 ${
                isMapExpanded
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => setIsMapExpanded(true)}
            >
              <MapPin className="h-4 w-4" />
              <span>Carte</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col md:flex-row transition-all duration-500 ease-in-out h-[calc(100vh-200px)]">
        {/* Liste avec overlay de chargement style Airbnb */}
        <div
          className={`relative overflow-y-auto transition-all duration-500 ease-in-out ${
            isMapExpanded
              ? "hidden md:block md:w-0 opacity-0"
              : "w-full md:w-1/2 opacity-100"
          } ${isModalOpen ? "pointer-events-none opacity-50" : ""}`}
        >
          {/* Overlay de chargement pendant le mouvement de carte */}
          {(isLoading || isMapMoving) && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center transition-opacity duration-300">
              <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center max-w-sm mx-4">
                <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className="text-gray-700 font-medium text-center">
                  {isMapMoving
                    ? "Recherche en cours..."
                    : "Mise à jour des résultats..."}
                </span>
              </div>
            </div>
          )}

          <div
            className={`transition-opacity duration-300 ${
              isLoading || isMapMoving ? "opacity-60" : "opacity-100"
            }`}
          >
            <Listing
              onLoadMore={loadMoreListings}
              hasMore={hasMore}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Carte avec bouton de recherche dans la zone */}
        <div
          className={`relative transition-all duration-500 ease-in-out ${
            isMapExpanded ? "w-full h-full" : "w-full md:w-1/2 h-full"
          } ${isModalOpen ? "pointer-events-none opacity-50" : ""}`}
        >
          {/* Barre de recherche */}
          <div className="absolute top-4 left-4 z-10 w-[300px] max-w-[90vw]">
            <ExploreMapSearch />
          </div>

          {/* Indicateur de mouvement de carte */}
          {isMapMoving && (
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-30 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-green-600" />
                <span className="text-sm text-gray-700">
                  Recherche en cours...
                </span>
              </div>
            </div>
          )}

          {/* Bouton "Rechercher dans cette zone" style Airbnb */}
          {showSearchButton && !isLoading && !isMapMoving && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-30 animate-slide-up">
              <button
                onClick={searchInCurrentArea}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200 hover:scale-105"
              >
                <Search className="w-4 h-4" />
                <span className="font-medium">Rechercher dans cette zone</span>
              </button>
            </div>
          )}

          <GoogleMapSection isMapExpanded={isMapExpanded} />

          {/* Contrôles de carte */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={toggleMapSize}
              className="bg-white text-gray-700 hover:bg-gray-50 p-3 rounded-lg shadow-lg flex items-center gap-2 transition-all border border-gray-200 hover:shadow-xl"
              title={isMapExpanded ? "Réduire la carte" : "Agrandir la carte"}
            >
              {isMapExpanded ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}

            </button>
          </div>
        </div>
      </div>

      {/* Bouton mobile amélioré */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleMapSize}
          className="bg-gray-900 hover:bg-gray-800 text-white rounded-full p-4 shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
        >
          {isMapExpanded ? (
            <List className="w-6 h-6" />
          ) : (
            <MapPin className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Styles CSS pour les animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

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

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Composant principal avec détection mobile/desktop
function ListingMapView() {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  // Éviter les problèmes d'hydratation SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Afficher un loader pendant l'hydratation
  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Rendu conditionnel mobile/desktop
  return isMobile ? <MobileListingMapView /> : <DesktopListingMapView />;
}

export default ListingMapView;
