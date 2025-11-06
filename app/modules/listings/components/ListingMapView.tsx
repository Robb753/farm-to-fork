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
import { cn } from "@/lib/utils";
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
import { COLORS } from "@/lib/config";

/**
 * Interface pour les bounds de la carte
 */
interface MapBounds {
  ne: { lat: number; lng: number };
  sw: { lat: number; lng: number };
}

/**
 * Interface pour les événements custom
 */
interface CustomAreaEvent extends CustomEvent {
  detail: boolean;
}

/**
 * Interface pour les options de fetchListings
 */
interface FetchListingsOptions {
  page: number;
  forceRefresh?: boolean;
  bounds?: MapBounds;
  append?: boolean;
}

/**
 * Composants dynamiques avec loading states
 */
const MobileListingMapView = dynamic(() => import("./MobileListingMapView"), {
  ssr: false,
  loading: () => null,
});

const MapboxSection = dynamic(
  () => import("../../maps/components/MapboxSection"),
  { ssr: false, loading: () => null }
);

/**
 * Hook pour détecter si on est sur mobile
 */
const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    const checkMobile = (): void => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  return isMobile;
};

/**
 * Composant principal pour la vue desktop (liste + carte)
 * 
 * Features:
 * - Split view responsive liste/carte
 * - Mode recherche manuel avec CTA
 * - Pagination infinie avec load more
 * - Contrôles d'expansion de carte
 * - Gestion des états de chargement
 * - Configuration centralisée des couleurs
 */
const DesktopListingMapView = (): JSX.Element => {
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

  // ✅ États locaux avec types appropriés
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isMapMoving, setIsMapMoving] = useState<boolean>(false);
  const moveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mode de recherche manuel : la FilterSection affichera le CTA "Rechercher…"
  const MANUAL_SEARCH = true;

  /**
   * Debounced setter pour l'état de mouvement de carte
   */
  const setMovingDebounced = useCallback((val: boolean): void => {
    if (moveTimerRef.current) {
      clearTimeout(moveTimerRef.current);
      moveTimerRef.current = null;
    }
    
    if (val) {
      setIsMapMoving(true);
    } else {
      moveTimerRef.current = setTimeout(() => {
        setIsMapMoving(false);
      }, 250);
    }
  }, []);

  /**
   * Écoute des événements de déplacement de carte Mapbox
   */
  useEffect(() => {
    if (!mapInstance) return;

    const handleMapMoveStart = (e: any): void => {
      if (e?.originalEvent) {
        setMovingDebounced(true);
        if (MANUAL_SEARCH) {
          window.dispatchEvent(
            new CustomEvent("areaDirtyChange", { detail: true })
          );
        }
      }
    };

    const handleMapMoveEnd = (): void => {
      setMovingDebounced(false);
    };

    // ✅ Événements de mouvement de carte
    const events = [
      { name: "movestart", handler: handleMapMoveStart },
      { name: "moveend", handler: handleMapMoveEnd },
      { name: "dragstart", handler: handleMapMoveStart },
      { name: "dragend", handler: handleMapMoveEnd },
      { name: "zoomstart", handler: handleMapMoveStart },
      { name: "zoomend", handler: handleMapMoveEnd },
    ] as const;

    events.forEach(({ name, handler }) => {
      mapInstance.on(name, handler);
    });

    return () => {
      events.forEach(({ name, handler }) => {
        mapInstance.off(name, handler);
      });
    };
  }, [mapInstance, setMovingDebounced]);

  /**
   * Écoute des événements de modale globale
   */
  useEffect(() => {
    const handleModalEvent = (e: CustomEvent): void => {
      setIsModalOpen(e.detail === true);
    };

    window.addEventListener("modalOpen", handleModalEvent as EventListener);
    
    return () => {
      window.removeEventListener("modalOpen", handleModalEvent as EventListener);
    };
  }, []);

  /**
   * Handler pour la pagination (load more)
   */
  const handleLoadMoreListings = useCallback((): void => {
    if (isLoading || !hasMore) return;
    
    const newPage = page + 1;
    setPage(newPage);
    fetchListings({ page: newPage, append: true } as FetchListingsOptions);
  }, [page, hasMore, isLoading, fetchListings, setPage]);

  /**
   * Handler pour la recherche dans la zone (exposé via événement)
   */
  useEffect(() => {
    const handleAreaSearch = async (): Promise<void> => {
      if (!mapInstance) return;

      try {
        const bounds = mapInstance.getBounds?.();
        if (!bounds) return;

        const boundsObj: MapBounds = {
          ne: { 
            lat: bounds.getNorthEast().lat(), 
            lng: bounds.getNorthEast().lng() 
          },
          sw: { 
            lat: bounds.getSouthWest().lat(), 
            lng: bounds.getSouthWest().lng() 
          },
        };

        setPage(1);
        const data = await fetchListings({
          page: 1,
          forceRefresh: true,
          bounds: boundsObj,
        } as FetchListingsOptions);

        // ✅ Zone traitée → informer FilterSection
        window.dispatchEvent(
          new CustomEvent("areaDirtyChange", { detail: false })
        );

        if (Array.isArray(data) && data.length > 0) {
          toast.success(`${data.length} fermes trouvées`);
        } else {
          toast.info("Aucune ferme trouvée dans cette zone");
        }
      } catch (error) {
        console.error("Erreur lors de la recherche:", error);
        toast.error("Erreur lors de la recherche");
      }
    };

    window.addEventListener("areaSearchRequested", handleAreaSearch);
    
    return () => {
      window.removeEventListener("areaSearchRequested", handleAreaSearch);
    };
  }, [fetchListings, mapInstance, setPage]);

  /**
   * Toggle de la taille de carte
   */
  const toggleMapSize = useCallback((): void => {
    setMapExpanded(!isMapExpanded);
  }, [isMapExpanded, setMapExpanded]);

  /**
   * État global de busy (chargement + mouvement de carte)
   */
  const globalBusy = useMemo(() => {
    return isLoading || (MANUAL_SEARCH ? false : isMapMoving);
  }, [isLoading, isMapMoving]);

  /**
   * Compteur de résultats affichés
   */
  const displayedResultsCount = useMemo(() => {
    return Array.isArray(visibleListings) ? visibleListings.length : 0;
  }, [visibleListings]);

  /**
   * Formatage des nombres avec locale
   */
  const formatNumber = useCallback((num: number): string => {
    return num.toLocaleString?.("fr-FR") ?? num.toString();
  }, []);

  return (
    <div 
      className="relative flex flex-col"
      style={{ backgroundColor: COLORS.BG_WHITE }}
    >
      <GlobalLoadingOverlay
        active={globalBusy}
        label={isMapMoving ? "Déplacement de la carte..." : "Mise à jour..."}
      />

      {/* ✅ Overlay pour modale */}
      {isModalOpen && (
        <div 
          className="pointer-events-none fixed inset-0 z-20 backdrop-blur-sm"
          style={{ backgroundColor: `${COLORS.BG_WHITE}99` }} // 60% opacity
        />
      )}

      {/* ✅ Section filtres avec sticky positioning */}
      <div
        className={cn(
          "sticky top-0 isolate border-b shadow-sm",
          isModalOpen ? "z-40" : "z-[10]"
        )}
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
            <span 
              className="text-sm"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              <span 
                className="font-semibold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {formatNumber(displayedResultsCount)}
              </span>{" "}
              {displayedResultsCount > 1 ? "fermes trouvées" : "ferme trouvée"}
              {totalCount > displayedResultsCount && (
                <span 
                  className="ml-1"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  (sur {formatNumber(totalCount)})
                </span>
              )}
            </span>
          </div>

          {/* ✅ Container de listing avec opacity conditionnelle */}
          <div
            className={cn(
              "p-4 lg:p-6 transition-opacity duration-300",
              globalBusy ? "opacity-60" : "opacity-100"
            )}
          >
            <Listing
              onLoadMore={handleLoadMoreListings}
              hasMore={hasMore}
              isLoading={isLoading}
            />
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

          {/* ✅ Bouton d'agrandissement/réduction */}
          <div className="absolute right-4 top-4 z-20 flex flex-col gap-3">
            <button
              onClick={toggleMapSize}
              className={cn(
                "group rounded-xl border p-3 shadow-lg transition",
                "hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              )}
              style={{
                backgroundColor: `${COLORS.BG_WHITE}F2`, // 95% opacity
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
              <List 
                className="h-3 w-3" 
                style={{ color: COLORS.BG_WHITE }}
              />
            ) : (
              <MapPin 
                className="h-3 w-3" 
                style={{ color: COLORS.BG_WHITE }}
              />
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
 * Composant wrapper principal avec détection mobile
 * 
 * Features:
 * - Détection automatique mobile/desktop
 * - Hydration sécurisée
 * - Lazy loading des composants appropriés
 */
function ListingMapView(): JSX.Element | null {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Attendre l'hydration pour éviter les mismatches SSR
  if (!mounted) return null;

  return isMobile ? <MobileListingMapView /> : <DesktopListingMapView />;
}

export default ListingMapView;