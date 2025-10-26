"use client";

import { MapPin, Clock, Award, Heart, Star, Users, Leaf } from "lucide-react";
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

// Zustand stores
import {
  useListingsState,
  useListingsActions,
  useMapboxState,
  useMapboxActions,
  useInteractionsState,
  useInteractionsActions,
} from "@/lib/store/mapboxListingsStore";
import { useUserFavorites, useUserActions } from "@/lib/store/userStore";

import { useListingsWithImages } from "@/app/hooks/useListingsWithImages";
import Link from "next/link";
import OptimizedImage from "@/components/ui/OptimizedImage";

/* ------------------------------
   UI: Loader & Empty state
------------------------------ */
const BookingStyleLoader = () => (
  <div className="absolute inset-0 flex items-center justify-center z-30 bg-white/80 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-xl p-6 flex flex-col items-center w-72 max-w-[90%] border border-gray-100">
      <div className="w-10 h-10 mb-4">
        <div className="relative">
          <div className="w-10 h-10 border-4 border-green-200 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-10 h-10 border-4 border-green-500 rounded-full animate-spin border-t-transparent" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-700 font-medium mb-1">
          Chargement des établissements...
        </p>
        <p className="text-sm text-gray-500">
          Découvrez les fermes près de chez vous
        </p>
      </div>
    </div>
  </div>
);

const EmptyState = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border border-gray-200 shadow-sm">
    <div className="relative mb-8">
      <OptimizedImage
        src="/empty-state.svg"
        alt="Aucun résultat"
        width={140}
        height={140}
        className="opacity-60"
        sizes="140px"
        quality={90}
      />
      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
        <MapPin className="w-3 h-3 text-white" />
      </div>
    </div>

    <h3 className="text-2xl font-bold text-gray-800 mb-3">
      Aucune ferme trouvée dans cette zone
    </h3>
    <p className="text-gray-600 text-center mb-8 max-w-md leading-relaxed">
      Élargissez votre recherche ou explorez d'autres zones pour découvrir des
      fermes locales exceptionnelles.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 w-full max-w-md">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <MapPin className="h-4 w-4 text-green-600" />
          </div>
          <span className="font-medium text-gray-800">Déplacez la carte</span>
        </div>
        <p className="text-sm text-gray-600">Explorez différentes zones</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="h-4 w-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <span className="font-medium text-gray-800">Zoom arrière</span>
        </div>
        <p className="text-sm text-gray-600">Voir une zone plus large</p>
      </div>
    </div>
  </div>
);

const StatusBadge = ({ availability, className = "" }) => {
  const isOpen = availability === "open";
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
        isOpen
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-orange-100 text-orange-800 border border-orange-200"
      } ${className}`}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          isOpen ? "bg-green-500" : "bg-orange-500"
        }`}
      />
      {isOpen ? "Ouvert maintenant" : "Fermé"}
    </div>
  );
};

const CertificationBadge = ({ certification }) => (
  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-medium">
    <Award className="w-3 h-3" />
    <span className="truncate max-w-20">{certification}</span>
  </div>
);

/* ------------------------------
   List item
------------------------------ */
const ListItem = React.memo(
  ({
    item,
    isHovered,
    isFavorite,
    onMouseEnter,
    onMouseLeave,
    onToggleFavorite,
    onShowOnMap,
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const getImageUrl = useCallback(() => {
      // priorité: relations Supabase listingImages
      if (Array.isArray(item.listingImages) && item.listingImages.length > 0) {
        return item.listingImages[0]?.url || "/default-farm-image.jpg";
      }
      if (item.listingImages?.url) return item.listingImages.url;

      // fallback éventuels
      if (item.image_url) return item.image_url;
      if (Array.isArray(item.images) && item.images.length > 0)
        return item.images[0];

      return "/default-farm-image.jpg";
    }, [item]);

    const handleFavoriteClick = useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFavorite();
      },
      [onToggleFavorite]
    );

    const handleShowOnMapClick = useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        onShowOnMap?.(item);
      },
      [onShowOnMap, item]
    );

    const imageUrl = getImageUrl();

    return (
      <article
        id={`listing-${item.id}`}
        className={`group relative bg-white flex border rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg mb-4 ${
          isHovered ? "ring-2 ring-green-400 shadow-md" : ""
        }`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Link href={`/view-listing/${item.id}`} className="flex w-full">
          {/* Image */}
          <div className="relative w-32 sm:w-40 md:w-48 h-32 sm:h-36 flex-shrink-0">
            {!imageError ? (
              <img
                src={imageUrl}
                alt={`${item.name} - Ferme locale`}
                className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg
                    className="w-8 h-8 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs">Image non disponible</span>
                </div>
              </div>
            )}

            {item.availability && (
              <div className="absolute top-2 left-2">
                <StatusBadge availability={item.availability} />
              </div>
            )}

            {Array.isArray(item.listingImages) &&
              item.listingImages.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {item.listingImages.length}
                </div>
              )}
          </div>

          {/* Contenu */}
          <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-green-700 transition-colors pr-2">
                  {item.name}
                </h2>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {item.lat && item.lng && onShowOnMap && (
                    <button
                      onClick={handleShowOnMapClick}
                      className="bg-green-50 hover:bg-green-100 p-1.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200 border border-green-200"
                      aria-label="Voir sur la carte"
                      title="Voir sur la carte"
                    >
                      <MapPin className="h-4 w-4 text-green-600" />
                    </button>
                  )}

                  <button
                    onClick={handleFavoriteClick}
                    className="bg-gray-50 hover:bg-white p-1.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200"
                    aria-label={
                      isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
                    }
                  >
                    <Heart
                      className={`h-4 w-4 transition-all duration-200 ${
                        isFavorite
                          ? "text-red-500 fill-red-500"
                          : "text-gray-400 hover:text-red-400"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                <MapPin className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span className="line-clamp-1" title={item.address}>
                  {item.address}
                </span>
              </div>

              {item.product_type?.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {item.product_type.slice(0, 4).map((product, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100 font-medium"
                      >
                        <Leaf className="w-3 h-3" />
                        {product}
                      </span>
                    ))}
                    {item.product_type.length > 4 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border border-gray-200">
                        +{item.product_type.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {item.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mt-auto pt-2">
              <div className="flex items-center gap-2">
                {item.certifications?.[0] && (
                  <CertificationBadge certification={item.certifications[0]} />
                )}
              </div>

              {item.rating && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-medium text-gray-900">
                    {item.rating}
                  </span>
                  {item.reviewCount && (
                    <span className="text-gray-500">({item.reviewCount})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>
      </article>
    );
  }
);

ListItem.displayName = "ListItem";

/* ------------------------------
   Main component
------------------------------ */
export default function Listing() {
  // Zustand state
  const { visible: visibleListings = [] } = useListingsState();
  const { setAllListings } = useListingsActions();
  const { bounds: mapBounds } = useMapboxState();
  const { setCoordinates, setMapZoom } = useMapboxActions();

  const { hoveredListingId } = useInteractionsState();
  const { setHoveredListingId, setOpenInfoWindowId } = useInteractionsActions();

  // Favoris
  const favorites = useUserFavorites();
  const { loadFavorites, toggleFavorite: toggleFavoriteStore } =
    useUserActions();

  const { user } = useUser();
  const { openSignUp } = useClerk();

  // Charger les favoris au montage si connecté
  useEffect(() => {
    if (user?.id) loadFavorites(user.id);
  }, [user?.id, loadFavorites]);

  // IDs visibles (pilotés par la carte + filtres via store)
  const visibleIds = useMemo(
    () => visibleListings?.map((item) => item.id) || [],
    [visibleListings]
  );

  // Enrichissement images des listings visibles
  const { listings, isLoading: isLoadingImages } =
    useListingsWithImages(visibleIds);

  // ---------------------------
  // FETCH SUPABASE PAR BOUNDS
  // ---------------------------
  const [isFetching, setIsFetching] = useState(false);

  // Requête initiale (France) si aucun bounds encore émis
  useEffect(() => {
    if (mapBounds) return;
    let cancelled = false;

    (async () => {
      try {
        setIsFetching(true);
        // France approximative
        const south = 41.0,
          north = 51.5,
          west = -5.5,
          east = 9.8;

        const { data, error } = await supabase
          .from("listing")
          .select(
            `
    id, name, address, lat, lng,
    description, product_type, certifications,
    availability, created_at, updated_at
  `
          )
          .gte("lat", south)
          .lte("lat", north)
          .gte("lng", west)
          .lte("lng", east)
          .limit(500);

        if (error) throw error;
        if (!cancelled) setAllListings(data ?? []);
      } catch (e) {
        console.error(e);
        toast.error("Impossible de charger les fermes (zone France).");
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mapBounds, setAllListings]);

  // Requête à chaque changement de bounds de la carte
  useEffect(() => {
    if (!mapBounds || !Array.isArray(mapBounds) || mapBounds.length !== 2)
      return;

    const [[west, south], [east, north]] = mapBounds;
    let cancelled = false;

    (async () => {
      try {
        setIsFetching(true);

        const { data, error } = await supabase
          .from("listing")
          .select(
            `
    id, name, address, lat, lng,
    description, product_type, certifications,
    availability, created_at, updated_at
  `
          )
          .gte("lat", south)
          .lte("lat", north)
          .gte("lng", west)
          .lte("lng", east)
          .limit(500);

        if (error) throw error;
        if (!cancelled) setAllListings(data ?? []);
      } catch (e) {
        console.error(e);
        toast.error("Erreur lors du chargement des fermes.");
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mapBounds, setAllListings]);

  // ⚠️ Supprime la boucle précédente: on ne pousse plus "listings" (images) dans allListings
  // useEffect(() => {
  //   if (listings.length > 0 && setAllListings) {
  //     setAllListings(listings);
  //   }
  // }, [listings, setAllListings]);

  // Loader combiné (fetch + images) avec petit délai pour éviter le clignotement
  const [delayedLoading, setDelayedLoading] = useState(true);
  const loadingTimerRef = useRef(null);

  const effectiveLoading = isFetching || isLoadingImages;

  useEffect(() => {
    if (effectiveLoading) {
      setDelayedLoading(true);
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    } else {
      loadingTimerRef.current = setTimeout(() => setDelayedLoading(false), 600);
    }
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, [effectiveLoading]);

  // Handlers
  const handleToggleFavorite = useCallback(
    (id) => {
      if (!user) {
        toast("Connectez-vous pour gérer vos favoris", {
          action: {
            label: "Se connecter",
            onClick: () => openSignUp({ redirectUrl: "/signup" }),
          },
        });
        return;
      }
      toggleFavoriteStore(id, user.id);
    },
    [user, toggleFavoriteStore, openSignUp]
  );

  const handleMouseEnter = useCallback(
    (id) => setHoveredListingId?.(id),
    [setHoveredListingId]
  );

  const handleMouseLeave = useCallback(
    () => setHoveredListingId?.(null),
    [setHoveredListingId]
  );

  const handleShowOnMap = useCallback(
    (listing) => {
      if (!listing?.lat || !listing?.lng) return;
      setOpenInfoWindowId?.(listing.id);
      setCoordinates?.([listing.lng, listing.lat]);
      setMapZoom?.(14);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success(`Centrage sur ${listing.name}`);
    },
    [setOpenInfoWindowId, setCoordinates, setMapZoom]
  );

  const handleRetry = useCallback(() => {
    // simple retry: on relance la requête en redemandant la même zone
    if (!mapBounds) {
      // forcera l'effet "France"
      window.location.reload();
    } else {
      const [[west, south], [east, north]] = mapBounds;
      toast.info(
        `Nouvel essai (${south.toFixed(2)}–${north.toFixed(2)} ; ${west.toFixed(
          2
        )}–${east.toFixed(2)})`
      );
      // L'effet bounds se relancera dès que la carte bouge ; ici on peut faire un léger pan/zoom si besoin.
    }
  }, [mapBounds]);

  // Etat vide (pas d’IDs visibles ET pas en cours de chargement)
  if (visibleIds.length === 0 && !effectiveLoading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50">
        <EmptyState onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50 relative">
      {delayedLoading && <BookingStyleLoader />}

      <div
        className={`flex flex-col gap-4 transition-all duration-300 max-w-4xl mx-auto ${
          delayedLoading ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        {listings.length > 0
          ? listings.map((item) => (
              <ListItem
                key={item.id}
                item={item}
                isHovered={hoveredListingId === item.id}
                isFavorite={favorites.includes(item.id)}
                onMouseEnter={() => handleMouseEnter(item.id)}
                onMouseLeave={handleMouseLeave}
                onToggleFavorite={() => handleToggleFavorite(item.id)}
                onShowOnMap={handleShowOnMap}
              />
            ))
          : !delayedLoading && <EmptyState onRetry={handleRetry} />}
      </div>
    </div>
  );
}
