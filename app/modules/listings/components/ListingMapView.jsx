"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import dynamic from "next/dynamic";
import { MapPin, List, Maximize2, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import FilterSection from "@/app/_components/layout/FilterSection";
import Listing from "./Listing";
import GlobalLoadingOverlay from "@/app/_components/ui/GlobalLoadingOverlay";

import {
  useMapState,
  useListingsState,
  useListingsActions,
  useUIState,
  useUIActions,
} from "@/lib/store/migratedStore";

const MobileListingMapView = dynamic(() => import("./MobileListingMapView"), {
  ssr: false,
  loading: () => null,
});

const MapboxSection = dynamic(
  () => import("../../maps/components/MapboxSection"),
  { ssr: false, loading: () => null }
);

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
  const {
    visible: visibleListings,
    isLoading,
    hasMore,
    page,
    totalCount,
  } = useListingsState();
  const { fetchListings, setPage } = useListingsActions();
  const { isMapExpanded } = useUIState();
  const { setMapExpanded } = useUIActions();

  // UI locaux
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const moveTimerRef = useRef(null);

  // Mode de recherche manuel : la FilterSection affichera le CTA “Rechercher…”
  const MANUAL_SEARCH = true;

  const setMovingDebounced = useCallback((val) => {
    if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    if (val) {
      setIsMapMoving(true);
    } else {
      moveTimerRef.current = setTimeout(() => setIsMapMoving(false), 250);
    }
  }, []);

  // écoute mapbox + notifie FilterSection que la zone a changé
  useEffect(() => {
    if (!mapInstance) return;

    const onStart = (e) => {
      if (e && e.originalEvent) {
        setMovingDebounced(true);
        if (MANUAL_SEARCH) {
          window.dispatchEvent(
            new CustomEvent("areaDirtyChange", { detail: true })
          );
        }
      }
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

  // écoute modale globale
  useEffect(() => {
    const handleModalEvent = (e) => setIsModalOpen(e.detail === true);
    window.addEventListener("modalOpen", handleModalEvent);
    return () => window.removeEventListener("modalOpen", handleModalEvent);
  }, []);

  // pagination
  const handleLoadMoreListings = useCallback(() => {
    if (isLoading || !hasMore) return;
    const newPage = page + 1;
    setPage(newPage);
    fetchListings({ page: newPage, append: true });
  }, [page, hasMore, isLoading, fetchListings, setPage]);

  // handler demandé par FilterSection (CTA “Rechercher…”) → on l’expose via event
  useEffect(() => {
    const onSearchInArea = async () => {
      if (!mapInstance) return;
      try {
        const b = mapInstance.getBounds?.();
        if (!b) return;

        const boundsObj = {
          ne: { lat: b.getNorthEast().lat(), lng: b.getNorthEast().lng() },
          sw: { lat: b.getSouthWest().lat(), lng: b.getSouthWest().lng() },
        };

        setPage(1);
        const data = await fetchListings({
          page: 1,
          forceRefresh: true,
          bounds: boundsObj,
        });

        // zone traitée → on informe la FilterSection
        window.dispatchEvent(
          new CustomEvent("areaDirtyChange", { detail: false })
        );

        if (Array.isArray(data) && data.length > 0) {
          toast.success(`${data.length} fermes trouvées`);
        } else {
          toast.info("Aucune ferme trouvée dans cette zone");
        }
      } catch {
        toast.error("Erreur lors de la recherche");
      }
    };

    window.addEventListener("areaSearchRequested", onSearchInArea);
    return () =>
      window.removeEventListener("areaSearchRequested", onSearchInArea);
  }, [fetchListings, mapInstance, setPage]);

  const toggleMapSize = useCallback(
    () => setMapExpanded(!isMapExpanded),
    [isMapExpanded, setMapExpanded]
  );

  const globalBusy = useMemo(
    () => isLoading || (MANUAL_SEARCH ? false : isMapMoving),
    [isLoading, isMapMoving]
  );

  const displayedResultsCount = useMemo(() => {
    return Array.isArray(visibleListings) ? visibleListings.length : 0;
  }, [visibleListings]);

  return (
    <div className="relative flex flex-col bg-white">
      <GlobalLoadingOverlay
        active={globalBusy}
        label={isMapMoving ? "Déplacement de la carte..." : "Mise à jour..."}
      />

      {isModalOpen && (
        <div className="pointer-events-none fixed inset-0 z-20 bg-white/60 backdrop-blur-sm" />
      )}

      {/* ✅ Filtres (intègrent maintenant le switch Liste/Carte + CTA “Rechercher…”) */}
      <div
        className={`sticky top-0 ${isModalOpen ? "z-40" : "z-[10]"} isolate border-b border-gray-200 bg-white shadow-sm`}
      >
        <div className="px-2 lg:px-4">
          <FilterSection />
        </div>
      </div>

      {/* Split Liste / Carte */}
      <div className="relative flex h-[calc(100vh-120px)] flex-col transition-all duration-500 ease-in-out md:flex-row">
        {/* Liste */}
        <div
          className={`relative overflow-y-auto transition-all duration-500 ease-in-out ${
            isMapExpanded ? "hidden md:w-0 md:opacity-0" : "w-full md:basis-1/2"
          } ${isModalOpen ? "pointer-events-none opacity-50" : ""}`}
        >
          {/* Compteur au-dessus de la liste */}
          <div className="mx-auto w-full max-w-6xl px-3 pt-3">
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                {Number(displayedResultsCount).toLocaleString?.() ??
                  displayedResultsCount}
              </span>{" "}
              {displayedResultsCount > 1 ? "fermes trouvées" : "ferme trouvée"}
              {totalCount > displayedResultsCount && (
                <span className="ml-1 text-gray-500">
                  (sur {Number(totalCount).toLocaleString?.() ?? totalCount})
                </span>
              )}
            </span>
          </div>

          <div
            className={`p-4 lg:p-6 transition-opacity duration-300 ${globalBusy ? "opacity-60" : "opacity-100"}`}
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
            isMapExpanded ? "w-full" : "w-full md:basis-1/2"
          } ${isModalOpen ? "pointer-events-none opacity-50" : ""}`}
        >
          <MapboxSection isMapExpanded={isMapExpanded} />

          {/* Agrandir/réduire */}
          <div className="absolute right-4 top-4 z-20 flex flex-col gap-3">
            <button
              onClick={toggleMapSize}
              className="group rounded-xl border border-gray-200 bg-white/95 backdrop-blur-sm p-3 text-gray-700 shadow-lg transition hover:border-gray-300 hover:bg-white hover:text-gray-900 hover:shadow-xl"
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

      {/* Mobile : bouton flottant Liste/Carte */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <button
          onClick={toggleMapSize}
          className="group relative flex items-center justify-center rounded-full border-2 border-gray-700 bg-gray-900 p-4 text-white shadow-2xl transition hover:scale-110 hover:bg-gray-800 hover:shadow-3xl"
        >
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-green-500 shadow-md">
            {isMapExpanded ? (
              <List className="h-3 w-3 text-white" />
            ) : (
              <MapPin className="h-3 w-3 text-white" />
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
  if (!mounted) return null;
  return isMobile ? <MobileListingMapView /> : <DesktopListingMapView />;
}

export default ListingMapView;
