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

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// Project stores
import {
  useMapboxState,
  useMapboxActions,
  useListingsState,
  useListingsActions,
  useInteractionsActions,
  useFiltersState,
} from "@/lib/store/mapboxListingsStore";

import { useUser } from "@clerk/nextjs";
import { useUserFavorites, useUserActions } from "@/lib/store/userStore";
import { ListingImage } from "@/components/ui/OptimizedImage";
import { openMobileFilters } from "@/app/_components/layout/FilterSection";

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

const formatDistance = (item) => {
  if (typeof item?.distance_km === "number")
    return `${item.distance_km.toFixed(1)} km`;
  if (typeof item?.distance === "string") return item.distance;
  return null;
};

const pickAddress = (item) => {
  if (typeof item?.address === "string") return item.address;
  if (item?.address?.label) return item.address.label;
  if (item?.address?.street || item?.city)
    return [item?.address?.street, item?.city].filter(Boolean).join(", ");
  return null;
};

const computeBadges = (item) => {
  const out = [];
  const certs = Array.isArray(item?.certifications) ? item.certifications : [];
  if (certs.some((c) => /bio|ab|organic/i.test(String(c)))) out.push("Bio");
  if (
    Array.isArray(item?.purchase_mode) &&
    item.purchase_mode.includes("vente_directe")
  )
    out.push("Vente directe");
  if (Array.isArray(item?.delivery_options) && item.delivery_options.length)
    out.push("Livraison");
  if (item?.is_new) out.push("Nouveau");
  return out.slice(0, 3);
};

const computeOpenState = (item) => {
  if (typeof item?.is_open === "boolean")
    return { isOpen: item.is_open, label: item.is_open ? "Ouvert" : "Fermé" };
  return null;
};

/* ----------------------- Card (design) ----------------------- */

const FarmCard = memo(function FarmCard({
  item,
  isFavorite,
  onToggleFavorite,
}) {
  const cover =
    (Array.isArray(item.listingImages) && item.listingImages[0]?.url) ||
    item.listingImages?.url ||
    "/default-farm-image.jpg";

  const address = pickAddress(item);
  const distance = formatDistance(item);
  const badges = computeBadges(item);
  const openState = computeOpenState(item);
  const rating = typeof item?.rating === "number" ? item.rating : null;
  const reviewCount =
    typeof item?.reviewCount === "number" ? item.reviewCount : null;
  const products = Array.isArray(item?.product_type)
    ? item.product_type.slice(0, 6)
    : [];

  return (
    <Card className="overflow-hidden border-emerald-100 hover:shadow-lg transition-all duration-300 hover:border-emerald-300">
      <Link
        href={`/view-listing/${item.id}`}
        prefetch={false}
        className="block"
      >
        <div className="relative h-40 bg-emerald-50">
          <ListingImage
            src={cover}
            alt={item.name || "Ferme"}
            fallbackSrc="/default-farm-image.jpg"
            className="h-full w-full object-cover"
          />

          {/* Favorite */}
          <Button
            size="icon"
            variant="secondary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite?.();
            }}
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 hover:bg-white shadow-md"
            aria-label={
              isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
            }
          >
            <LucideHeart
              className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-700"}`}
            />
          </Button>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {badges.map((b) => (
              <Badge
                key={b}
                className="bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
              >
                {b}
              </Badge>
            ))}
          </div>

          {/* Distance */}
          {distance && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-white/90 text-emerald-700 hover:bg-white shadow-md">
                <MapPin className="mr-1 h-3 w-3" /> {distance}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-1">
              {item.name || "Ferme"}
            </h3>
            {openState && (
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${openState.isOpen ? "bg-green-500" : "bg-red-500"}`}
                />
                <span
                  className={
                    openState.isOpen
                      ? "text-green-700 font-medium"
                      : "text-red-700 font-medium"
                  }
                >
                  {openState.label}
                </span>
              </div>
            )}
          </div>

          {/* Rating + Hours */}
          <div className="flex items-center justify-between text-sm">
            {rating !== null ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-gray-900">
                    {rating.toFixed(1)}
                  </span>
                </div>
                {typeof reviewCount === "number" && (
                  <span className="text-gray-500">({reviewCount} avis)</span>
                )}
              </div>
            ) : (
              <div />
            )}

            {item.hours && (
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs">{item.hours}</span>
              </div>
            )}
          </div>

          {/* Address */}
          {address && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed line-clamp-2">{address}</span>
            </div>
          )}

          {/* Products */}
          {products.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {products.map((p) => (
                <Badge
                  key={p}
                  variant="secondary"
                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                >
                  {p}
                </Badge>
              ))}
              {Array.isArray(item?.product_type) &&
                item.product_type.length > products.length && (
                  <Badge
                    variant="outline"
                    className="border-emerald-200 text-emerald-700"
                  >
                    +{item.product_type.length - products.length}
                  </Badge>
                )}
            </div>
          )}

          {/* Quick actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
            >
              <Phone className="h-4 w-4" /> Appeler
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
            >
              <Navigation className="h-4 w-4" /> Itinéraire
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-10">
            Voir la ferme
          </Button>
        </div>
      </Link>
    </Card>
  );
});

/* ----------------------- Main component ----------------------- */

export default function MobileListingMapView() {
  // stores
  const { mapInstance } = useMapboxState();
  const { setCenter: setMapCenter, setZoom: setMapZoom } =
    (useMapboxActions && useMapboxActions()) || {};
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

  // local UI state
  const [showMap, setShowMap] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [sortBy, setSortBy] = useState("distance"); // "distance" | "rating" | "name"
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Charger favoris à la connexion
  useEffect(() => {
    if (user?.id) loadFavorites(user.id);
  }, [user?.id, loadFavorites]);

  // Reset pagination quand les filtres changent fortement
  useEffect(() => {
    resetListings?.();
    fetchListings({ page: 1, forceRefresh: true });
  }, [filters, resetListings, fetchListings]);

  // filtre rapide (client-side)
  const filtered = useMemo(() => {
    if (!visible) return [];
    let arr = [...visible];

    // quick search (nom/adresse/produit)
    const q = quickSearch.trim().toLowerCase();
    if (q)
      arr = arr.filter(
        (l) =>
          l.name?.toLowerCase().includes(q) ||
          pickAddress(l)?.toLowerCase().includes(q) ||
          (Array.isArray(l.product_type) &&
            l.product_type.some((t) => t.toLowerCase().includes(q)))
      );

    // tri local
    if (sortBy === "distance") {
      arr.sort((a, b) => (a.distance_km ?? 1e9) - (b.distance_km ?? 1e9));
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
          fetchListings({ page: nextPage, append: true })
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
    (id) => {
      if (!user) {
        toast("Connectez-vous pour gérer vos favoris");
        return;
      }
      toggleFavorite(id, user.id);
    },
    [user, toggleFavorite]
  );

  const handleSearchInArea = useCallback(() => {
    fetchListings({ page: 1, forceRefresh: true }).then((data) => {
      if (Array.isArray(data) && data.length)
        toast.success(`${data.length} fermes trouvées dans cette zone`);
      else toast.info("Aucune ferme trouvée dans cette zone");
    });
  }, [fetchListings]);

  const handleShowMap = useCallback(() => {
    setShowMap(true);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, []);

  /* ----------------------- Utilitaires Map + onCitySelect ----------------------- */

  const easeToCenter = useCallback(
    (map, center, zoom = 12) =>
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

  const getCurrentBBox = useCallback((map) => {
    if (!map) return null;
    const b = map.getBounds();
    return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
  }, []);

  const updateUrl = useCallback(
    ({ lat, lng, zoom }) => {
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
    async (city) => {
      let lng, lat;
      let zoom = 12;
      let bbox = null;
      if (city?.center && Array.isArray(city.center)) {
        [lng, lat] = city.center;
      } else if (Array.isArray(city)) {
        [lng, lat] = city;
      } else if (city?.location) {
        lng = Number(city.location.lng);
        lat = Number(city.location.lat);
      }
      if (Array.isArray(city?.bbox) && city.bbox.length === 4) bbox = city.bbox;
      if (typeof city?.zoom === "number") zoom = city.zoom;

      setSearchCity(String(city?.place_name || city?.text || ""));
      if (typeof lat === "number" && typeof lng === "number")
        updateUrl({ lat, lng, zoom });

      try {
        if (setMapCenter && typeof lat === "number" && typeof lng === "number")
          setMapCenter({ lat, lng });
      } catch {}
      try {
        if (setMapZoom && typeof zoom === "number") setMapZoom(zoom);
      } catch {}

      if (mapInstance && typeof lat === "number" && typeof lng === "number") {
        await easeToCenter(mapInstance, [lng, lat], zoom);
        const current = getCurrentBBox(mapInstance);
        await fetchListings({
          page: 1,
          forceRefresh: true,
          bbox: current || bbox || undefined,
        });
      } else {
        await fetchListings({
          page: 1,
          forceRefresh: true,
          bbox: bbox || undefined,
        });
      }
    },
    [
      mapInstance,
      easeToCenter,
      getCurrentBBox,
      fetchListings,
      setMapCenter,
      setMapZoom,
      updateUrl,
    ]
  );

  /* ----------------------- LIST VIEW ----------------------- */

  const ListView = (
    <div className="relative min-h-[100dvh] w-full bg-gradient-to-b from-emerald-50 to-white pb-32">
      {/* Header (recherche affichée uniquement en desktop) */}
      <header className="sticky top-0 z-50 bg-white border-b border-emerald-100 shadow-sm">
        <div className="px-4 py-2">
          <div className="hidden md:block">
            <div className="relative">
              <Suspense
                fallback={
                  <div className="h-10 w-full rounded-full bg-emerald-50" />
                }
              >
                <MapboxCitySearch
                  placeholder="Rechercher une ville..."
                  onCitySelect={handleCitySelect}
                  className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 px-4 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </Suspense>
            </div>
          </div>
        </div>
      </header>

      {/* Fil d'Ariane simple */}
      <div className="bg-white border-b border-emerald-100">
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-emerald-700 font-medium">France</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900 font-semibold">
              {searchCity || "Sélectionnez une ville"}
            </span>
          </div>
        </div>
      </div>

      {/* Résultats */}
      <div
        ref={scrollContainerRef}
        className="no-scrollbar h-[calc(100dvh-190px)] overflow-y-auto px-4 py-4 pb-[120px]"
      >
        {isLoading && (!filtered || filtered.length === 0) ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="h-20 w-20 animate-pulse rounded-xl bg-gray-200" />
                <div className="flex-1">
                  <div className="mb-2 h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="mb-2 h-3 w-5/6 animate-pulse rounded bg-gray-200" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
                    <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              {/* icône de recherche */}
              <svg
                className="h-8 w-8 text-gray-400"
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
            <h3 className="mb-1 text-base font-semibold text-gray-900">
              Aucune ferme
            </h3>
            <p className="max-w-xs text-sm text-gray-600">
              Essayez d’élargir la zone ou d’ajuster vos filtres.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => (
              <FarmCard
                key={item.id}
                item={item}
                isFavorite={Array.isArray(favs) && favs.includes(item.id)}
                onToggleFavorite={() => handleToggleFavorite(item.id)}
              />
            ))}

            {hasMore && (
              <div ref={loadMoreRef} className="py-6 text-center">
                {isLoadingMore ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-sm text-gray-600">
                    <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />{" "}
                    Chargement…
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">
                    Faites défiler pour charger plus
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA bas "Voir sur la carte" */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-emerald-100 shadow-lg z-40">
        <div className="px-4 py-4">
          <Button
            size="lg"
            onClick={handleShowMap}
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-12 rounded-full"
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
    <div className="relative h-[70dvh] w-full overflow-hidden rounded-t-2xl border-t border-gray-200 shadow-inner">
      {/* top bar */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex items-start justify-between p-3">
        <Button
          onClick={() => setShowMap(false)}
          variant="outline"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-3 py-2 text-sm font-medium text-gray-800 shadow-sm backdrop-blur hover:bg-white"
          aria-label="Revenir à la liste"
        >
          <ChevronLeft className="h-4 w-4" /> Liste
        </Button>

        <Button
          onClick={openMobileFilters}
          variant="outline"
          size="icon"
          className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
          aria-label="Ouvrir les filtres"
        >
          <LucideFilter className="h-5 w-5" />
        </Button>
      </div>

      <Suspense fallback={<div className="h-full w-full bg-gray-100" />}>
        <MapboxSection isMapExpanded={true} isMobile />
      </Suspense>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );

  return showMap ? MapView : ListView;
}
