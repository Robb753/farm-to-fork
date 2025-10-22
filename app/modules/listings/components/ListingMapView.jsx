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
import Listing from "./Listing";
// ✅ Nouveaux imports Zustand depuis mapboxListingsStore
import {
  useMapboxState,
  useListingsState,
  useListingsActions,
  useFiltersState,
} from "@/lib/store/mapboxListingsStore";
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

const MapboxSection = dynamic(
  () => import("../../maps/components/MapboxSection"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    ),
  }
);

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
  // ✅ Hooks Zustand remplacent les anciens contextes
  const { coordinates, bounds: mapBounds, mapInstance } = useMapboxState();
  const { visible: visibleListings, isLoading, hasMore } = useListingsState();
  const { fetchListings, searchInArea } = useListingsActions();
  const { filters } = useFiltersState();

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

  // Écouter les changements de bounds pour afficher le bouton de recherche
  useEffect(() => {
    if (!mapBounds) return;

    // Quand les bounds changent, afficher le bouton après un délai
    if (searchButtonTimeoutRef.current) {
      clearTimeout(searchButtonTimeoutRef.current);
    }

    setMapUpdatePending(true);
    searchButtonTimeoutRef.current = setTimeout(() => {
      setShowSearchButton(true);
      setIsMapMoving(false);
    }, 500);

    return () => {
      if (searchButtonTimeoutRef.current) {
        clearTimeout(searchButtonTimeoutRef.current);
      }
    };
  }, [mapBounds]);

  // ✅ Fonction de recherche dans la zone actuelle mise à jour
  const handleSearchInCurrentArea = useCallback(() => {
    setShowSearchButton(false);
    setMapUpdatePending(false);
    setPage(1);

    searchInArea(mapInstance)
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
  }, [searchInArea, mapInstance]);

  // ✅ Fonction pour charger plus de listings mise à jour
  const handleLoadMoreListings = useCallback(() => {
    if (isLoading || !hasMore) return;
    const newPage = page + 1;
    setPage(newPage);
    fetchListings({ page: newPage, append: true });
  }, [page, hasMore, isLoading, fetchListings]);

  // ✅ Fonction pour rafraîchir les listings mise à jour
  const handleRefreshListings = useCallback(() => {
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

      {/* Barre de résultats moderne style Properstar */}
      <div
        className={`bg-white py-4 px-6 border-b border-gray-200 flex items-center justify-between shadow-sm transition-all duration-300 ${
          isModalOpen ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            {isLoading ? (
              <>
                <div className="relative w-5 h-5">
                  <RefreshCw className="h-5 w-5 animate-spin text-green-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-900 text-sm font-semibold">
                    {isMapMoving ? "Recherche..." : "Chargement..."}
                  </span>
                  <span className="text-xs text-gray-500">
                    Actualisation des résultats
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 text-base font-bold">
                      {totalResults.toLocaleString()}
                    </span>
                    <span className="text-gray-600 text-sm">
                      {totalResults !== 1 ? "fermes trouvées" : "ferme trouvée"}
                    </span>

                    {/* Badge de mise à jour récente */}
                    {Date.now() - lastSearchTime < 3000 && !isLoading && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 animate-fade-in">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        Actualisé
                      </span>
                    )}
                  </div>
                  {totalResults > 0 && (
                    <span className="text-xs text-gray-500">
                      dans la zone visible
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleRefreshListings}
            disabled={isLoading}
            className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 text-sm font-medium text-gray-700 hover:text-green-700 disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-gray-200 transition-all duration-200"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-300"}`}
            />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>

        {/* Contrôles d'affichage améliorés */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1">
            <button
              className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                !isMapExpanded
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setIsMapExpanded(false)}
            >
              <List className="h-4 w-4" />
              <span>Liste</span>
            </button>
            <button
              className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                isMapExpanded
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
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
              onLoadMore={handleLoadMoreListings}
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

          {/* Bouton "Rechercher dans cette zone" style moderne */}
          {showSearchButton && !isLoading && !isMapMoving && (
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-30 animate-slide-up">
              <button
                onClick={handleSearchInCurrentArea}
                className="group bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-full shadow-xl hover:shadow-2xl flex items-center gap-3 transition-all duration-300 hover:scale-105 border border-gray-700"
              >
                <div className="relative">
                  <Search className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity duration-300"></div>
                </div>
                <span className="font-semibold text-sm">
                  Rechercher dans cette zone
                </span>
              </button>
            </div>
          )}

          <MapboxSection isMapExpanded={isMapExpanded} />

          {/* Contrôles de carte améliorés */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={toggleMapSize}
              className="group bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 p-3 rounded-xl shadow-lg hover:shadow-xl flex items-center gap-2 transition-all duration-200 border border-gray-200 hover:border-gray-300"
              title={isMapExpanded ? "Réduire la carte" : "Agrandir la carte"}
            >
              <div className="relative">
                {isMapExpanded ? (
                  <Minimize2 className="w-5 h-5 transition-transform group-hover:scale-90" />
                ) : (
                  <Maximize2 className="w-5 h-5 transition-transform group-hover:scale-110" />
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bouton mobile moderne avec indicateur */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleMapSize}
          className="group relative bg-gray-900 hover:bg-gray-800 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl flex items-center justify-center transition-all duration-300 hover:scale-110 border-2 border-gray-700"
        >
          {/* Indicateur de mode */}
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
            {isMapExpanded ? (
              <MapPin className="w-3 h-3 text-white" />
            ) : (
              <List className="w-3 h-3 text-white" />
            )}
          </div>

          {isMapExpanded ? (
            <List className="w-6 h-6 transition-transform group-hover:scale-110" />
          ) : (
            <MapPin className="w-6 h-6 transition-transform group-hover:scale-110" />
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
