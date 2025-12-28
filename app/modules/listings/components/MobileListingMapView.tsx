"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  memo,
  Suspense,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  MapPin,
  Heart as LucideHeart,
  Star,
  ChevronLeft,
  RefreshCw,
  Filter as LucideFilter,
  Map as LucideMap,
  Clock,
  Share2,
  Navigation,
  Phone,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// ✅ Import du nouveau store unifié

import { useUser } from "@clerk/nextjs";
import { useUserFavorites, useUserActions } from "@/lib/store/userStore";
import { ListingImage } from "@/components/ui/OptimizedImage";
import { openMobileFilters } from "@/app/_components/layout/FilterSection/FilterSection";
import { COLORS } from "@/lib/config";
import { useInteractionsActions, useListingsActions, useListingsState, useMapActions, useMapState } from "@/lib/store";
import { useFiltersState } from "@/lib/store/filtersStore";
import { escapeHTML } from "@/lib/utils/sanitize";

/**
 * Interfaces TypeScript
 */
interface ListingItem {
  id: string | number;
  name?: string;
  address?: string | { label?: string; street?: string };
  city?: string;
  distance_km?: number;
  distance?: string;
  certifications?: string[];
  purchase_mode?: string[];
  delivery_options?: string[];
  is_new?: boolean;
  is_open?: boolean;
  rating?: number;
  reviewCount?: number;
  product_type?: string[];
  hours?: string;
  listingImages?: Array<{ url: string }> | { url: string };
  lat?: number | string; // ✅ Peut être string ou number
  lng?: number | string; // ✅ Peut être string ou number
}

interface CitySearchResult {
  center?: [number, number];
  location?: { lng: number; lat: number };
  place_name?: string;
  text?: string;
  bbox?: [number, number, number, number];
  zoom?: number;
}

interface FetchListingsOptions {
  page: number;
  forceRefresh?: boolean;
  bbox?: number[];
  append?: boolean;
}

interface FarmCardProps {
  item: ListingItem;
  isFavorite: boolean;
  onToggleFavorite?: () => void;
}

interface UrlUpdateParams {
  lat?: number;
  lng?: number;
  zoom?: number;
}

// --- Config ---
const PAGE_SIZE = 20; // garder en phase avec l'API

// lazy (évite SSR/hydration issues)
const MapboxCitySearch = dynamic(
  () => import("../../maps/components/shared/MapboxCitySearch"),
  { ssr: false }
);
const MapboxSection = dynamic(
  () => import("../../maps/components/MapboxSection"),
  { ssr: false }
);

/* ----------------------- Helpers ----------------------- */

/**
 * Formatage de la distance
 */
const formatDistance = (item: ListingItem): string | null => {
  if (typeof item?.distance_km === "number") {
    return `${item.distance_km.toFixed(1)} km`;
  }
  if (typeof item?.distance === "string") {
    // 🔒 SÉCURITÉ: Distance échappée
    return escapeHTML(item.distance);
  }
  return null;
};

/**
 * Extraction de l'adresse selon différents formats
 */
const pickAddress = (item: ListingItem): string | null => {
  if (typeof item?.address === "string") {
    return item.address;
  }
  if (typeof item?.address === "object" && item.address?.label) {
    return item.address.label;
  }
  if (typeof item?.address === "object" && (item.address?.street || item?.city)) {
    return [item.address.street, item.city].filter(Boolean).join(", ");
  }
  return null;
};

/**
 * Calcul des badges à afficher
 */
const computeBadges = (item: ListingItem): string[] => {
  const badges: string[] = [];
  const certs = Array.isArray(item?.certifications) ? item.certifications : [];
  
  if (certs.some((c) => /bio|ab|organic/i.test(String(c)))) {
    badges.push("Bio");
  }
  
  if (
    Array.isArray(item?.purchase_mode) &&
    item.purchase_mode.includes("vente_directe")
  ) {
    badges.push("Vente directe");
  }
  
  if (Array.isArray(item?.delivery_options) && item.delivery_options.length) {
    badges.push("Livraison");
  }
  
  if (item?.is_new) {
    badges.push("Nouveau");
  }
  
  return badges.slice(0, 3);
};

/**
 * Calcul de l'état d'ouverture
 */
const computeOpenState = (item: ListingItem): { isOpen: boolean; label: string } | null => {
  if (typeof item?.is_open === "boolean") {
    return {
      isOpen: item.is_open,
      label: item.is_open ? "Ouvert" : "Fermé"
    };
  }
  return null;
};

/* ----------------------- Card (design) ----------------------- */

/**
 * Composant carte ferme optimisé avec memo
 */
const FarmCard = memo<FarmCardProps>(function FarmCard({
  item,
  isFavorite,
  onToggleFavorite,
}) {
  const cover =
    (Array.isArray(item.listingImages) && item.listingImages[0]?.url) ||
    (typeof item.listingImages === 'object' && 'url' in item.listingImages && item.listingImages.url) ||
    "/default-farm-image.jpg";

  const address = pickAddress(item);
  const distance = formatDistance(item);
  const badges = computeBadges(item);
  const openState = computeOpenState(item);
  const rating = typeof item?.rating === "number" ? item.rating : null;
  const reviewCount = typeof item?.reviewCount === "number" ? item.reviewCount : null;
  const products = Array.isArray(item?.product_type)
    ? item.product_type.slice(0, 6)
    : [];

  return (
    <Card
      className={cn(
        "overflow-hidden border transition-all duration-300",
        "hover:shadow-lg hover:scale-[1.02]"
      )}
      style={{
        borderColor: `${COLORS.PRIMARY}30`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${COLORS.PRIMARY}60`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${COLORS.PRIMARY}30`;
      }}
    >
      <Link href={`/farm/${item.id}`} prefetch={false} className="block">
        <div
          className="relative h-40"
          style={{ backgroundColor: `${COLORS.PRIMARY}10` }}
        >
          <ListingImage
            src={cover}
            alt={escapeHTML(item.name || "Ferme")} // ✅ Échappé
            fallbackSrc="/default-farm-image.jpg"
            className="h-full w-full object-cover"
          />

          {/* ✅ Bouton Favoris */}
          <Button
            size="icon"
            variant="secondary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite?.();
            }}
            className={cn(
              "absolute top-3 right-3 h-9 w-9 rounded-full shadow-md",
              "transition-all duration-200 hover:scale-110"
            )}
            style={{
              backgroundColor: `${COLORS.BG_WHITE}E6`, // 90% opacity
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.BG_WHITE;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${COLORS.BG_WHITE}E6`;
            }}
            aria-label={
              isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
            }
            type="button"
          >
            <LucideHeart
              className={cn(
                "h-4 w-4 transition-colors duration-200",
                isFavorite ? "fill-current" : ""
              )}
              style={{
                color: isFavorite ? COLORS.ERROR : COLORS.TEXT_SECONDARY,
              }}
            />
          </Button>

          {/* ✅ Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Badge
                key={badge}
                className={cn(
                  "shadow-md transition-colors bg-green-600 text-white hover:bg-green-700"
                )}
              >
                {/* 🔒 SÉCURITÉ: Badge échappé */}
                {escapeHTML(badge)}
              </Badge>
            ))}
          </div>

          {/* ✅ Distance */}
          {distance && (
            <div className="absolute bottom-3 left-3">
              <Badge
                className={cn(
                  "shadow-md bg-white/90 text-green-700 hover:bg-white"
                )}
              >
                {/* 🔒 SÉCURITÉ: Distance échappée (déjà fait dans formatDistance si corrigé) */}
                <MapPin className="mr-1 h-3 w-3" /> {distance}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3
              className="font-bold text-lg leading-tight line-clamp-1"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {/* 🔒 SÉCURITÉ: Nom de ferme échappé */}
              {escapeHTML(item.name || "Ferme")}
            </h3>
            {openState && (
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: openState.isOpen
                      ? COLORS.SUCCESS
                      : COLORS.ERROR,
                  }}
                />
                <span
                  className="font-medium"
                  style={{
                    color: openState.isOpen ? COLORS.SUCCESS : COLORS.ERROR,
                  }}
                >
                  {openState.label}
                </span>
              </div>
            )}
          </div>

          {/* ✅ Rating + Hours */}
          <div className="flex items-center justify-between text-sm">
            {rating !== null ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span
                    className="font-semibold"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {rating.toFixed(1)}
                  </span>
                </div>
                {typeof reviewCount === "number" && (
                  <span style={{ color: COLORS.TEXT_MUTED }}>
                    ({reviewCount} avis)
                  </span>
                )}
              </div>
            ) : (
              <div />
            )}

            {item.hours && (
              <div
                className="flex items-center gap-1"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                <Clock className="h-3.5 w-3.5" />
                {/* 🔒 SÉCURITÉ: Heures échappées */}
                <span className="text-xs">{escapeHTML(item.hours)}</span>
              </div>
            )}
          </div>

          {/* ✅ Address */}
          {address && (
            <div
              className="flex items-start gap-2 text-sm"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              <MapPin
                className="h-4 w-4 mt-0.5 flex-shrink-0"
                style={{ color: COLORS.PRIMARY }}
              />
              {/* 🔒 SÉCURITÉ: Adresse échappée */}
              <span className="leading-relaxed line-clamp-2">
                {escapeHTML(address)}
              </span>
            </div>
          )}

          {/* ✅ Products */}
          {products.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {products.map((product) => (
                <Badge
                  key={product}
                  variant="secondary"
                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                >
                  {/* 🔒 SÉCURITÉ: Type de produit échappé */}
                  {escapeHTML(product)}
                </Badge>
              ))}
              {Array.isArray(item?.product_type) &&
                item.product_type.length > products.length && (
                  <Badge
                    variant="outline"
                    className="border-green-200 text-green-700"
                  >
                    +{item.product_type.length - products.length}
                  </Badge>
                )}
            </div>
          )}

          {/* ✅ Quick actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex-1 gap-2 bg-transparent transition-colors duration-200"
              )}
              style={{
                borderColor: `${COLORS.PRIMARY}30`,
                color: COLORS.PRIMARY,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${COLORS.PRIMARY}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              type="button"
            >
              <Phone className="h-4 w-4" /> Appeler
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex-1 gap-2 bg-transparent transition-colors duration-200"
              )}
              style={{
                borderColor: `${COLORS.PRIMARY}30`,
                color: COLORS.PRIMARY,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${COLORS.PRIMARY}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              type="button"
            >
              <Navigation className="h-4 w-4" /> Itinéraire
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn("bg-transparent transition-colors duration-200")}
              style={{
                borderColor: `${COLORS.PRIMARY}30`,
                color: COLORS.PRIMARY,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${COLORS.PRIMARY}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              type="button"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          <Button
            className={cn(
              "w-full font-medium h-10 transition-colors duration-200"
            )}
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
            }}
            type="button"
          >
            Voir la ferme
          </Button>
        </div>
      </Link>
    </Card>
  );
});

/* ----------------------- Main component ----------------------- */

/**
 * Composant principal pour la vue mobile (liste + carte)
 * 
 * Features:
 * - Vue liste avec cartes optimisées
 * - Vue carte full-screen
 * - Recherche par ville avec autocomplete
 * - Pagination infinie
 * - Filtrage et tri local
 * - Gestion des favoris
 */
export default function MobileListingMapView(): JSX.Element {
  // ✅ stores avec nouveau store unifié
  const { mapInstance } = useMapState();
  const { setCoordinates, setZoom } = useMapActions();
  const filters = useFiltersState();
  const { visible, isLoading, hasMore, page } = useListingsState();
  const { fetchListings, resetListings } = useListingsActions();
  const { setHoveredListingId } = useInteractionsActions();

  // user + favoris
  const { user } = useUser();
  const favs = useUserFavorites() || [];
  const { loadFavorites, toggleFavorite } = useUserActions();

  // router (pour mise à jour d'URL sans clignotement)
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ✅ local UI state avec types appropriés
  const [showMap, setShowMap] = useState<boolean>(false);
  const [quickSearch, setQuickSearch] = useState<string>("");
  const [searchCity, setSearchCity] = useState<string>("");
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "name">("distance");
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Charger favoris à la connexion
  useEffect(() => {
    if (user?.id) loadFavorites(user.id);
  }, [user?.id, loadFavorites]);

  // Reset pagination quand les filtres changent fortement
  useEffect(() => {
    resetListings?.();
    fetchListings({ page: 1, forceRefresh: true } as FetchListingsOptions);
  }, [filters, resetListings, fetchListings]);

  // filtre rapide (client-side)
  const filtered = useMemo(() => {
    if (!visible) return [];
    let arr = [...visible];

    // quick search (nom/adresse/produit)
    const q = quickSearch.trim().toLowerCase();
    if (q) {
      arr = arr.filter(
        (l) =>
          l.name?.toLowerCase().includes(q) ||
          pickAddress(l)?.toLowerCase().includes(q) ||
          (Array.isArray(l.product_type) &&
            l.product_type.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // tri local
    if (sortBy === "distance") {
      arr.sort((a, b) => {
        const aDistance = (a as any).distance_km ?? 1e9;
        const bDistance = (b as any).distance_km ?? 1e9;
        return aDistance - bDistance;
      });
    } else if (sortBy === "rating") {
      arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === "name") {
      arr.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );
    }

    return arr;
  }, [visible, quickSearch, sortBy]);

  // infinite scroll (list mode)
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoading) return;

    const el = loadMoreRef.current;
    let ticking = false; // micro-throttle

    const io = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting;
        if (isVisible && !isLoadingMore && !ticking) {
          ticking = true;
          setIsLoadingMore(true);
          const nextPage =
            (page || Math.floor((visible?.length || 0) / PAGE_SIZE)) + 1;
          fetchListings({ page: nextPage, append: true } as FetchListingsOptions)
            .catch(() => {})
            .finally(() => {
              setIsLoadingMore(false);
              ticking = false;
            });
        }
      },
      {
        root: scrollContainerRef.current ?? null,
        rootMargin: "200px 0px 0px 0px",
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, isLoading, isLoadingMore, visible?.length, fetchListings, page]);

  /* ----------------------- HANDLERS ----------------------- */

  const handleToggleFavorite = useCallback(
    (id: string | number) => {
      if (!user) {
        toast("Connectez-vous pour gérer vos favoris");
        return;
      }

      // ✅ Conversion sécurisée de l'ID
      const numericId = typeof id === "number" ? id : parseInt(String(id), 10);

      if (isNaN(numericId)) {
        toast.error("Identifiant de ferme invalide");
        return;
      }

      // ✅ Appel du store avec un number garanti
      toggleFavorite(numericId, user.id);
    },
    [user, toggleFavorite]
  );


  const handleSearchInArea = useCallback(() => {
    fetchListings({ page: 1, forceRefresh: true } as FetchListingsOptions).then((data) => {
      if (Array.isArray(data) && data.length) {
        toast.success(`${data.length} fermes trouvées dans cette zone`);
      } else {
        toast.info("Aucune ferme trouvée dans cette zone");
      }
    });
  }, [fetchListings]);

  const handleShowMap = useCallback(() => {
    setShowMap(true);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  /* ----------------------- Utilitaires Map + onCitySelect ----------------------- */

  const easeToCenter = useCallback(
    (map: any, center: [number, number], zoom = 12): Promise<boolean> =>
      new Promise((resolve) => {
        if (!map) return resolve(false);
        const done = () => {
          map.off("moveend", done);
          resolve(true);
        };
        map.on("moveend", done);
        map.easeTo({ center, zoom, duration: 600, essential: true });
      }),
    []
  );

  const getCurrentBBox = useCallback((map: any): number[] | null => {
    if (!map) return null;
    const b = map.getBounds();
    return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
  }, []);

  const updateUrl = useCallback(
    ({ lat, lng, zoom }: UrlUpdateParams) => {
      try {
        const params = new URLSearchParams(searchParams?.toString() || "");
        if (typeof lat === "number") params.set("lat", lat.toFixed(6));
        if (typeof lng === "number") params.set("lng", lng.toFixed(6));
        if (typeof zoom === "number") params.set("zoom", String(zoom));
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      } catch (_) {}
    },
    [router, pathname, searchParams]
  );

  const handleCitySelect = useCallback(
    async (city: CitySearchResult | [number, number]) => {
      let lng: number, lat: number;
      let zoom = 12;
      let bbox: number[] | null = null;

      if (Array.isArray(city)) {
        [lng, lat] = city;
      } else if (city && typeof city === 'object') {
        if (city.center && Array.isArray(city.center)) {
          [lng, lat] = city.center;
        } else if (city.location) {
          lng = Number(city.location.lng);
          lat = Number(city.location.lat);
        } else {
          return;
        }

        if (Array.isArray(city.bbox) && city.bbox.length === 4) {
          bbox = city.bbox;
        }
        if (typeof city.zoom === "number") {
          zoom = city.zoom;
        }
        setSearchCity(String(city.place_name || city.text || ""));
      } else {
        return;
      }

      if (typeof lat === "number" && typeof lng === "number") {
        updateUrl({ lat, lng, zoom });
      }

      // ✅ Utilisation du nouveau store unifié
      try {
        if (setCoordinates && typeof lat === "number" && typeof lng === "number") {
          setCoordinates({ lat, lng });
        }
      } catch {}
      
      try {
        if (setZoom && typeof zoom === "number") {
          setZoom(zoom);
        }
      } catch {}

      if (mapInstance && typeof lat === "number" && typeof lng === "number") {
        await easeToCenter(mapInstance, [lng, lat], zoom);
        const current = getCurrentBBox(mapInstance);
        await fetchListings({
          page: 1,
          forceRefresh: true,
          bbox: current || bbox || undefined,
        } as FetchListingsOptions);
      } else {
        await fetchListings({
          page: 1,
          forceRefresh: true,
          bbox: bbox || undefined,
        } as FetchListingsOptions);
      }
    },
    [
      mapInstance,
      easeToCenter,
      getCurrentBBox,
      fetchListings,
      setCoordinates,
      setZoom,
      updateUrl,
    ]
  );

  /* ----------------------- LIST VIEW ----------------------- */

  const ListView = (
    <div
      className="relative min-h-[100dvh] w-full pb-32"
      style={{
        background: `linear-gradient(to bottom, ${COLORS.PRIMARY_BG}, ${COLORS.BG_WHITE})`,
      }}
    >
      {/* ✅ Header avec recherche */}
      <header
        className={cn("sticky top-0 z-50 border-b shadow-sm")}
        style={{
          backgroundColor: COLORS.BG_WHITE,
          borderColor: `${COLORS.PRIMARY}20`,
        }}
      >
        <div className="px-4 py-2">
          <div className="hidden md:block">
            <div className="relative">
              <Suspense
                fallback={
                  <div
                    className="h-10 w-full rounded-full"
                    style={{ backgroundColor: `${COLORS.PRIMARY}10` }}
                  />
                }
              >
                <MapboxCitySearch
                  placeholder="Rechercher une ville..."
                  onCitySelect={handleCitySelect}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </header>

      {/* ✅ Fil d'Ariane */}
      <div
        className="border-b"
        style={{
          backgroundColor: COLORS.BG_WHITE,
          borderColor: `${COLORS.PRIMARY}20`,
        }}
      >
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium" style={{ color: COLORS.PRIMARY }}>
              France
            </span>
            <ChevronRight
              className="h-4 w-4"
              style={{ color: COLORS.TEXT_MUTED }}
            />
            <span
              className="font-semibold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {/* 🔒 SÉCURITÉ: Ville échappée */}
              {escapeHTML(searchCity || "Sélectionnez une ville")}
            </span>
          </div>
        </div>
      </div>

      {/* ✅ Résultats */}
      <div
        ref={scrollContainerRef}
        className="no-scrollbar h-[calc(100dvh-190px)] overflow-y-auto px-4 py-4 pb-[120px]"
      >
        {isLoading && (!filtered || filtered.length === 0) ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn("flex gap-3 rounded-2xl border p-3 shadow-sm")}
                style={{
                  backgroundColor: COLORS.BG_WHITE,
                  borderColor: COLORS.BORDER,
                }}
              >
                <div
                  className="h-20 w-20 animate-pulse rounded-xl"
                  style={{ backgroundColor: COLORS.BG_GRAY }}
                />
                <div className="flex-1">
                  <div
                    className="mb-2 h-4 w-2/3 animate-pulse rounded"
                    style={{ backgroundColor: COLORS.BG_GRAY }}
                  />
                  <div
                    className="mb-2 h-3 w-5/6 animate-pulse rounded"
                    style={{ backgroundColor: COLORS.BG_GRAY }}
                  />
                  <div className="flex gap-2">
                    <div
                      className="h-5 w-16 animate-pulse rounded-full"
                      style={{ backgroundColor: COLORS.BG_GRAY }}
                    />
                    <div
                      className="h-5 w-20 animate-pulse rounded-full"
                      style={{ backgroundColor: COLORS.BG_GRAY }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: COLORS.BG_GRAY }}
            >
              <svg
                className="h-8 w-8"
                style={{ color: COLORS.TEXT_MUTED }}
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3
              className="mb-1 text-base font-semibold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Aucune ferme
            </h3>
            <p
              className="max-w-xs text-sm"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Essayez d'élargir la zone ou d'ajuster vos filtres.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => (
              <FarmCard
                key={item.id}
                item={item as ListingItem}
                isFavorite={Array.isArray(favs) && favs.includes(item.id)}
                onToggleFavorite={() => handleToggleFavorite(item.id)}
              />
            ))}

            {hasMore && (
              <div ref={loadMoreRef} className="py-6 text-center">
                {isLoadingMore ? (
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                    style={{
                      backgroundColor: COLORS.BG_GRAY,
                      color: COLORS.TEXT_SECONDARY,
                    }}
                  >
                    <RefreshCw
                      className="h-4 w-4 animate-spin"
                      style={{ color: COLORS.PRIMARY }}
                    />{" "}
                    Chargement…
                  </div>
                ) : (
                  <span
                    className="text-xs"
                    style={{ color: COLORS.TEXT_MUTED }}
                  >
                    Faites défiler pour charger plus
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ✅ CTA bas "Voir sur la carte" */}
      <div
        className={cn("fixed bottom-0 left-0 right-0 border-t shadow-lg z-40")}
        style={{
          backgroundColor: COLORS.BG_WHITE,
          borderColor: `${COLORS.PRIMARY}20`,
        }}
      >
        <div className="px-4 py-4">
          <Button
            size="lg"
            onClick={handleShowMap}
            className={cn(
              "w-full gap-2 font-medium h-12 rounded-full",
              "transition-colors duration-200"
            )}
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
            }}
            type="button"
          >
            <LucideMap className="h-5 w-5" /> Voir sur la carte
          </Button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );

  /* ----------------------- MAP VIEW ----------------------- */

  const MapView = (
    <div 
      className={cn(
        "relative h-[70dvh] w-full overflow-hidden rounded-t-2xl",
        "border-t shadow-inner"
      )}
      style={{ borderColor: COLORS.BORDER }}
    >
      {/* ✅ Barre supérieure */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex items-start justify-between p-3">
        <Button
          onClick={() => setShowMap(false)}
          variant="outline"
          className={cn(
            "pointer-events-auto inline-flex items-center gap-2 rounded-full",
            "border px-3 py-2 text-sm font-medium shadow-sm backdrop-blur",
            "transition-colors duration-200"
          )}
          style={{
            backgroundColor: `${COLORS.BG_WHITE}F2`,
            borderColor: COLORS.BORDER,
            color: COLORS.TEXT_PRIMARY,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.BG_WHITE;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `${COLORS.BG_WHITE}F2`;
          }}
          aria-label="Revenir à la liste"
          type="button"
        >
          <ChevronLeft className="h-4 w-4" /> Liste
        </Button>

        <Button
          onClick={openMobileFilters}
          variant="outline"
          size="icon"
          className={cn(
            "pointer-events-auto inline-flex h-10 w-10 items-center justify-center",
            "rounded-full border shadow-sm transition-colors duration-200"
          )}
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.BORDER,
            color: COLORS.TEXT_SECONDARY,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.BG_GRAY;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.BG_WHITE;
          }}
          aria-label="Ouvrir les filtres"
          type="button"
        >
          <LucideFilter className="h-5 w-5" />
        </Button>
      </div>

      <Suspense 
        fallback={
          <div 
            className="h-full w-full"
            style={{ backgroundColor: COLORS.BG_GRAY }}
          />
        }
      >
        <MapboxSection isMapExpanded={true} />
      </Suspense>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );

  return showMap ? MapView : ListView;
}