"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import { MapPin, List, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import FilterSection from "@/app/_components/layout/FilterSection/FilterSection";
import Listing from "./Listing";
import GlobalLoadingOverlay from "@/app/_components/ui/GlobalLoadingOverlay";
import { COLORS } from "@/lib/config";
import {
  useVisibleListings,
  useIsListingsLoading,
  useIsMapExpanded,
  useUIActions,
  useUnifiedStore,
} from "@/lib/store";


/**
 * Composants dynamiques avec loading states
 */
const MobileListingMapView = dynamic(() => import("./MobileListingMapView"), {
  ssr: false,
  loading: () => null,
});

// Both ListingMapView and MapboxLazy.tsx import MapboxSection dynamically.
// Webpack deduplicates them into a single chunk at build time.
const MapboxSection = dynamic(
  () => import("../../maps/components/MapboxSection"),
  { ssr: false, loading: () => null }
);

/**
 * ✅ Hook hydration-safe pour détecter le mobile (sans setState dans useEffect)
 */
function subscribeToResize(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getIsMobileSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

function getIsMobileServerSnapshot(): boolean {
  return false;
}

function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribeToResize,
    getIsMobileSnapshot,
    getIsMobileServerSnapshot
  );
}

/**
 * Composant principal pour la vue desktop (liste + carte)
 *
 * Features:
 * - Split view responsive liste/carte
 * - Pagination infinie (désactivée ici car global)
 * - Contrôles d'expansion de carte
 * - Gestion des états de chargement
 * - Configuration centralisée des couleurs
 */
const DesktopListingMapView = (): JSX.Element => {
  const visibleListings = useVisibleListings();
  const isLoading = useIsListingsLoading();
  const totalCount = useUnifiedStore((s) => s.listings.all.length);
  const isMapExpanded = useIsMapExpanded();
  const { setMapExpanded } = useUIActions();

  // ✅ États locaux
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  /**
   * Toggle taille de carte
   */
  const toggleMapSize = useCallback((): void => {
    setMapExpanded(!isMapExpanded);
  }, [isMapExpanded, setMapExpanded]);

  /**
   * État global busy (chargement réseau uniquement — le mouvement de carte
   * ne doit pas faire clignoter l'overlay)
   */
  const globalBusy = useMemo(() => isLoading, [isLoading]);

  /**
   * Compteur de résultats affichés
   */
  const displayedResultsCount = useMemo(() => {
    return Array.isArray(visibleListings) ? visibleListings.length : 0;
  }, [visibleListings]);

  /**
   * Formatage des nombres
   */
  const formatNumber = useCallback((num: number): string => {
    return num.toLocaleString?.("fr-FR") ?? num.toString();
  }, []);

  return (
    <div
      className="relative flex flex-col"
      style={{ backgroundColor: COLORS.BG_WHITE }}
    >
      <GlobalLoadingOverlay active={globalBusy} label="Mise à jour..." />

      {/* ✅ Overlay pour modale */}
      {isModalOpen && (
        <div
          className="pointer-events-none fixed inset-0 z-20 backdrop-blur-sm"
          style={{ backgroundColor: `${COLORS.BG_WHITE}99` }}
        />
      )}

      {/* ✅ Section filtres sticky */}
      <div
        className={cn("sticky top-0 border-b shadow-sm", isModalOpen && "z-40")}
        style={{
          backgroundColor: COLORS.BG_WHITE,
          borderColor: COLORS.BORDER,
        }}
      >
        <div className="px-2 lg:px-4">
          <FilterSection />
        </div>
      </div>

      {/* ✅ Split view Liste / Carte */}
      <div className="relative flex h-[calc(100vh-120px)] flex-col transition-all duration-500 ease-in-out md:flex-row">
        {/* ✅ Section Liste */}
        <div
          className={cn(
            "relative overflow-y-auto transition-all duration-500 ease-in-out",
            isMapExpanded
              ? "hidden md:w-0 md:opacity-0"
              : "w-full md:basis-1/2",
            isModalOpen && "pointer-events-none opacity-50"
          )}
        >
          {/* ✅ Compteur de résultats */}
          <div className="mx-auto w-full max-w-6xl px-3 pt-3">
            <span className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
              <span
                className="font-semibold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {formatNumber(displayedResultsCount)}
              </span>{" "}
              {displayedResultsCount > 1 ? "fermes trouvées" : "ferme trouvée"}
              {totalCount > displayedResultsCount && (
                <span className="ml-1" style={{ color: COLORS.TEXT_MUTED }}>
                  (sur {formatNumber(totalCount)})
                </span>
              )}
            </span>
          </div>

          {/* ✅ Container listing */}
          <div
            className={cn(
              "p-4 lg:p-6 transition-opacity duration-300",
              globalBusy ? "opacity-60" : "opacity-100"
            )}
          >
            <Listing isLoading={isLoading} />
          </div>
        </div>

        {/* ✅ Section Carte */}
        <div
          className={cn(
            "relative transition-all duration-500 ease-in-out",
            isMapExpanded ? "w-full" : "w-full md:basis-1/2",
            isModalOpen && "pointer-events-none opacity-50"
          )}
        >
          <MapboxSection isMapExpanded={isMapExpanded} />

          {/* ✅ Bouton agrandir/réduire */}
          <div className="absolute right-4 top-4 z-20 flex flex-col gap-3">
            <button
              onClick={toggleMapSize}
              className={cn(
                "group rounded-xl border p-3 shadow-lg transition",
                "hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              )}
              style={{
                backgroundColor: `${COLORS.BG_WHITE}F2`,
                borderColor: COLORS.BORDER,
                color: COLORS.TEXT_SECONDARY,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.BG_WHITE;
                e.currentTarget.style.borderColor = COLORS.TEXT_MUTED;
                e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${COLORS.BG_WHITE}F2`;
                e.currentTarget.style.borderColor = COLORS.BORDER;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
              title={isMapExpanded ? "Réduire la carte" : "Agrandir la carte"}
              type="button"
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

      {/* ✅ Bouton flottant mobile */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <button
          onClick={toggleMapSize}
          className={cn(
            "group relative flex items-center justify-center rounded-full",
            "border-2 p-4 shadow-2xl transition",
            "hover:scale-110 hover:shadow-3xl",
            "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          )}
          style={{
            backgroundColor: COLORS.TEXT_PRIMARY,
            borderColor: COLORS.TEXT_PRIMARY,
            color: COLORS.BG_WHITE,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.TEXT_SECONDARY;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.TEXT_PRIMARY;
          }}
          type="button"
        >
          {/* ✅ Badge indicateur */}
          <div
            className={cn(
              "absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center",
              "rounded-full border-2 shadow-md"
            )}
            style={{
              backgroundColor: COLORS.PRIMARY,
              borderColor: COLORS.BG_WHITE,
            }}
          >
            {isMapExpanded ? (
              <List className="h-3 w-3" style={{ color: COLORS.BG_WHITE }} />
            ) : (
              <MapPin className="h-3 w-3" style={{ color: COLORS.BG_WHITE }} />
            )}
          </div>

          {/* ✅ Icône principale */}
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

/**
 * Wrapper principal (mobile vs desktop)
 * ✅ Sans mounted state / sans setState dans useEffect
 */
function ListingMapView(): JSX.Element {
  const isMobile = useIsMobile();
  return isMobile ? <MobileListingMapView /> : <DesktopListingMapView />;
}

export default ListingMapView;
