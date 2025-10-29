"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import dynamic from "next/dynamic";
import { MapPin, List, Maximize2, Minimize2, RefreshCw } from "lucide-react"; // ✅ Import corrigé
import { toast } from "sonner";
import FilterSection from "@/app/_components/layout/FilterSection";
import Listing from "./Listing";
import GlobalLoadingOverlay from "@/app/_components/ui/GlobalLoadingOverlay";
import {
  useMapState,
  useListingsState,
  useMapActions,
  useListingsActions, // ✅ Import ajouté
} from "@/lib/store/mapListingsStore";

// --- Version mobile (lazy) : pas de loader → évite un spinner en plus
const MobileListingMapView = dynamic(() => import("./MobileListingMapView"), {
  ssr: false,
  loading: () => null,
});

// --- Carte (lazy) : pas de loader (spinner global suffit)
const MapboxSection = dynamic(
  () => import("../../maps/components/MapboxSection"),
  { ssr: false, loading: () => null }
);

// --- Hook simple pour détecter le mobile ---
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
};

const DesktopListingMapView = () => {
  const { mapInstance } = useMapState();
  const { visible: visibleListings, isLoading, hasMore } = useListingsState();
  const { fetchListings } = useListingsActions(); // ✅ Hook ajouté

  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // État "mouvement carte" uniquement pour interactions utilisateur
  const [isMapMoving, setIsMapMoving] = useState(false);
  const moveTimerRef = useRef(null);
  const setMovingDebounced = useCallback((val) => {
    if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    if (val) {
      setIsMapMoving(true);
    } else {
      moveTimerRef.current = setTimeout(() => setIsMapMoving(false), 300);
    }
  }, []);

  // --- Écoute Mapbox (on n'active que si l'événement vient d'un user)
  useEffect(() => {
    if (!mapInstance) return;

    const onStart = (e) => {
      // e.originalEvent est présent pour les interactions utilisateur
      if (e && e.originalEvent) setMovingDebounced(true);
    };
    const onEnd = () => setMovingDebounced(false);

    mapInstance.on("movestart", onStart);
    mapInstance.on("moveend", onEnd);
    mapInstance.on("dragstart", onStart);
    mapInstance.on("dragend", onEnd);
    mapInstance.on("zoomstart", onStart);
    mapInstance.on("zoomend", onEnd);

    return () => {
      mapInstance.off("movestart", onStart);
      mapInstance.off("moveend", onEnd);
      mapInstance.off("dragstart", onStart);
      mapInstance.off("dragend", onEnd);
      mapInstance.off("zoomstart", onStart);
      mapInstance.off("zoomend", onEnd);
    };
  }, [mapInstance, setMovingDebounced]);

  // Écoute ouverture/fermeture d'une modale globale si tu en as
  useEffect(() => {
    const handleModalEvent = (e) => setIsModalOpen(e.detail === true);
    window.addEventListener("modalOpen", handleModalEvent);
    return () => window.removeEventListener("modalOpen", handleModalEvent);
  }, []);

  // Maj compteur résultats
  useEffect(() => {
    const n = Array.isArray(visibleListings) ? visibleListings.length : 0;
    setTotalResults(n);
  }, [visibleListings]);

  const handleLoadMoreListings = useCallback(() => {
    if (isLoading || !hasMore) return;
    const newPage = page + 1;
    setPage(newPage);
    fetchListings({ page: newPage, append: true });
  }, [page, hasMore, isLoading, fetchListings]);

  const handleRefreshListings = useCallback(() => {
    setPage(1);
    fetchListings({ page: 1, forceRefresh: true })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          toast.success(`${data.length} fermes trouvées`);
        } else {
          toast.info("Aucune ferme trouvée dans cette zone");
        }
      })
      .catch(() => toast.error("Erreur lors de la recherche"));
  }, [fetchListings]);

  const toggleMapSize = useCallback(() => setIsMapExpanded((p) => !p), []);

  // Unifie les états de chargement
  const globalBusy = useMemo(
    () => isLoading || isMapMoving,
    [isLoading, isMapMoving]
  );

  return (
    <div className="relative flex flex-col bg-white">
      {/* Spinner unique global */}
      <GlobalLoadingOverlay
        active={globalBusy}
        label={
          isMapMoving ? "Recherche en cours..." : "Mise à jour des résultats..."
        }
      />

      {/* Backdrop si modale ouverte */}
      {isModalOpen && (
        <div className="pointer-events-none fixed inset-0 z-20 bg-white/60 backdrop-blur-sm" />
      )}

      {/* Filtres */}
      <div
        className={`sticky top-0 ${
          isModalOpen ? "z-40" : "z-[10]"
        } isolate border-b border-gray-200 bg-white shadow-sm`}
      >
        <div className="[&_.max-w-6xl]:max-w-none [&_.px-3]:px-4">
          <FilterSection />
        </div>
      </div>

      {/* Barre résultats + actions */}
      <div
        className={`flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 shadow-sm transition-all duration-300 ${
          isModalOpen ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">
              {Number(totalResults).toLocaleString?.() ?? totalResults}
            </span>{" "}
            {totalResults > 1 ? "fermes trouvées" : "ferme trouvée"}
          </span>

          <button
            onClick={handleRefreshListings}
            disabled={isLoading}
            className="group inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm font-medium text-gray-700 transition hover:border-green-500 hover:bg-green-50 hover:text-green-700 disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-white"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isLoading
                  ? "animate-spin"
                  : "transition-transform duration-300 group-hover:rotate-180"
              }`}
            />
            <span>Actualiser</span>
          </button>
        </div>

        {/* Contrôles vue Liste / Carte */}
        <div className="hidden items-center gap-2 md:flex">
          <div className="flex items-center rounded-md bg-gray-100 p-0.5">
            <button
              className={`flex items-center gap-1 rounded-sm px-3 py-1.5 text-sm font-medium transition ${
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
              className={`flex items-center gap-1 rounded-sm px-3 py-1.5 text-sm font-medium transition ${
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

      {/* Split Liste/Carte */}
      <div className="relative flex h-[calc(100dvh-160px)] flex-col transition-all duration-500 ease-in-out md:flex-row">
        {/* Liste */}
        <div
          className={`relative overflow-y-auto transition-all duration-500 ease-in-out ${
            isMapExpanded ? "hidden md:hidden" : "w-full md:basis-1/2"
          } ${isModalOpen ? "pointer-events-none opacity-50" : ""}`}
        >
          <div
            className={`transition-opacity duration-300 ${
              globalBusy ? "opacity-60" : "opacity-100"
            }`}
          >
            <Listing
              onLoadMore={handleLoadMoreListings}
              hasMore={hasMore}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Carte */}
        <div
          className={`relative transition-all duration-500 ease-in-out ${
            isMapExpanded ? "w-full md:flex-1" : "w-full md:basis-1/2"
          } ${isModalOpen ? "pointer-events-none opacity-50" : ""}`}
        >
          <MapboxSection isMapExpanded={isMapExpanded} />

          {/* Contrôle d'agrandissement */}
          <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
            <button
              onClick={toggleMapSize}
              className="group rounded-xl border border-gray-200 bg-white p-2.5 text-gray-700 shadow-lg transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 hover:shadow-xl"
              title={isMapExpanded ? "Réduire la carte" : "Agrandir la carte"}
            >
              {isMapExpanded ? (
                <Minimize2 className="h-5 w-5 transition-transform group-hover:scale-90" />
              ) : (
                <Maximize2 className="h-5 w-5 transition-transform group-hover:scale-110" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bouton mobile flottant Liste/Carte */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <button
          onClick={toggleMapSize}
          className="group relative flex items-center justify-center rounded-full border-2 border-gray-700 bg-gray-900 p-4 text-white shadow-2xl transition hover:scale-110 hover:bg-gray-800 hover:shadow-3xl"
        >
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-green-500 shadow-md">
            {isMapExpanded ? (
              <MapPin className="h-3 w-3 text-white" />
            ) : (
              <List className="h-3 w-3 text-white" />
            )}
          </div>
          {isMapExpanded ? (
            <List className="h-6 w-6 transition-transform group-hover:scale-110" />
          ) : (
            <MapPin className="h-6 w-6 transition-transform group-hover:scale-110" />
          )}
        </button>
      </div>
    </div>
  );
};

function ListingMapView() {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null; // pas de spinner ici → évite un doublon
  return isMobile ? <MobileListingMapView /> : <DesktopListingMapView />;
}

export default ListingMapView;
