"use client";

import { MapPin, Award, Heart, Star, Leaf } from "lucide-react";
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
import { cn } from "@/lib/utils";

// ✅ IMPORTS CORRECTS : Store avec pagination corrigée
import {
  useInteractionsState,
  useListingsActions,
  useListingsState,
  useMapActions,
  useMapState,
} from "@/lib/store";
import { useUserFavorites, useUserActions } from "@/lib/store/userStore";

import { useListingsWithImages } from "@/app/hooks/useListingsWithImages";
import Link from "next/link";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { COLORS } from "@/lib/config";

/**
 * Interface pour un listing
 */
interface ListingItem {
  id: string | number;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  description?: string;
  product_type?: string[];
  certifications?: string[];
  availability?: string;
  rating?: number;
  reviewCount?: number;
  listingImages?: Array<{ url: string }>;
  image_url?: string;
  images?: string[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface pour les props du composant principal
 */
interface ListingProps {
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

/**
 * Interface pour les props de ListItem
 */
interface ListItemProps {
  item: ListingItem;
  isHovered: boolean;
  isFavorite: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onToggleFavorite: () => void;
  onShowOnMap?: (item: ListingItem) => void;
}

// ✅ TRANSFORMATION SÉCURISÉE
const transformSupabaseToListing = (item: any): any => {
  return {
    ...item,
    lat: typeof item.lat === "number" ? item.lat : parseFloat(item.lat || 0),
    lng: typeof item.lng === "number" ? item.lng : parseFloat(item.lng || 0),
    availability:
      item.availability === "open" || item.availability === "closed"
        ? item.availability
        : undefined,
    product_type: Array.isArray(item.product_type) ? item.product_type : [],
    certifications: Array.isArray(item.certifications)
      ? item.certifications
      : [],
    active: item.active ?? true,
    created_at: item.created_at ?? new Date().toISOString(),
  };
};

/* ------------------------------
   UI Components - Beaux et Fonctionnels
------------------------------ */
const BookingStyleLoader = (): JSX.Element => (
  <div
    className="absolute inset-0 flex items-center justify-center z-30 backdrop-blur-sm"
    style={{ backgroundColor: `${COLORS.BG_WHITE}CC` }}
  >
    <div
      className={cn(
        "rounded-xl shadow-xl p-6 flex flex-col items-center w-72 max-w-[90%] border"
      )}
      style={{
        backgroundColor: COLORS.BG_WHITE,
        borderColor: COLORS.BORDER,
      }}
    >
      <div className="w-10 h-10 mb-4">
        <div className="relative">
          <div
            className="w-10 h-10 border-4 rounded-full animate-pulse"
            style={{ borderColor: `${COLORS.PRIMARY}40` }}
          />
          <div
            className="absolute inset-0 w-10 h-10 border-4 rounded-full animate-spin border-t-transparent"
            style={{
              borderColor: `${COLORS.PRIMARY} ${COLORS.PRIMARY} ${COLORS.PRIMARY} transparent`,
            }}
          />
        </div>
      </div>
      <div className="text-center">
        <p className="font-medium mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
          Chargement des établissements...
        </p>
        <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
          Découvrez les fermes près de chez vous
        </p>
      </div>
    </div>
  </div>
);

const EmptyState = ({ onRetry }: { onRetry: () => void }): JSX.Element => (
  <div
    className={cn(
      "flex flex-col items-center justify-center py-16 px-6",
      "rounded-2xl border shadow-sm"
    )}
    style={{
      background: `linear-gradient(135deg, ${COLORS.PRIMARY_BG} 0%, ${COLORS.BG_GRAY} 100%)`,
      borderColor: COLORS.BORDER,
    }}
  >
    <div className="relative mb-8">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
        <MapPin className="w-12 h-12 text-green-600" />
      </div>
    </div>

    <h3
      className="text-2xl font-bold mb-3"
      style={{ color: COLORS.TEXT_PRIMARY }}
    >
      Aucune ferme trouvée
    </h3>
    <p
      className="text-center mb-8 max-w-md leading-relaxed"
      style={{ color: COLORS.TEXT_SECONDARY }}
    >
      Il semble qu'il n'y ait pas de fermes disponibles pour le moment.
    </p>
    <button
      onClick={onRetry}
      className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
      style={{
        backgroundColor: COLORS.PRIMARY,
        color: COLORS.BG_WHITE,
      }}
    >
      Réessayer
    </button>
  </div>
);

const StatusBadge = ({
  availability,
  className = "",
}: {
  availability?: string;
  className?: string;
}): JSX.Element => {
  const isOpen = availability === "open";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border",
        className
      )}
      style={{
        backgroundColor: isOpen ? `${COLORS.SUCCESS}20` : `${COLORS.WARNING}20`,
        color: isOpen ? COLORS.SUCCESS : COLORS.WARNING,
        borderColor: isOpen ? `${COLORS.SUCCESS}40` : `${COLORS.WARNING}40`,
      }}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: isOpen ? COLORS.SUCCESS : COLORS.WARNING,
        }}
      />
      {isOpen ? "Ouvert maintenant" : "Fermé"}
    </div>
  );
};

const CertificationBadge = ({
  certification,
}: {
  certification: string;
}): JSX.Element => (
  <div
    className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
    )}
    style={{
      backgroundColor: `${COLORS.WARNING}10`,
      color: COLORS.WARNING,
      borderColor: `${COLORS.WARNING}30`,
    }}
  >
    <Award className="w-3 h-3" />
    <span className="truncate max-w-20">{certification}</span>
  </div>
);

/* ListItem Component - Version Complète et Belle */
const ListItem = React.memo<ListItemProps>(
  ({
    item,
    isHovered,
    isFavorite,
    onMouseEnter,
    onMouseLeave,
    onToggleFavorite,
    onShowOnMap,
  }) => {
    const [imageError, setImageError] = useState<boolean>(false);

    const getImageUrl = useCallback((): string => {
      if (Array.isArray(item.listingImages) && item.listingImages.length > 0) {
        return item.listingImages[0]?.url || "/default-farm-image.jpg";
      }
      return "/default-farm-image.jpg";
    }, [item]);

    const handleFavoriteClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFavorite();
      },
      [onToggleFavorite]
    );

    const handleShowOnMapClick = useCallback(
      (e: React.MouseEvent) => {
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
        className={cn(
          "group relative flex border rounded-xl overflow-hidden shadow-sm",
          "transition-all duration-300 hover:shadow-lg mb-4",
          "hover:border-green-200 hover:-translate-y-1",
          isHovered && "ring-2 ring-green-400 shadow-md border-green-300"
        )}
        style={{ backgroundColor: COLORS.BG_WHITE }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Link href={`/view-listing/${item.id}`} className="flex w-full">
          {/* Image Section */}
          <div className="relative w-32 sm:w-40 md:w-48 h-32 sm:h-36 flex-shrink-0">
            {!imageError ? (
              <OptimizedImage
                src={imageUrl}
                alt={`${item.name} - Ferme locale`}
                fill={true}
                width={0}
                height={0}
                sizes="(max-width: 640px) 40vw, 192px"
                className="object-cover transition-all duration-500 group-hover:scale-105"
                onError={() => setImageError(true)}
                onLoad={() => {}}
                showSkeleton={true}
                blurDataURL=""
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: COLORS.BG_GRAY }}
              >
                <div
                  className="text-center"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z"
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
                <div
                  className={cn(
                    "absolute bottom-2 right-2 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                  )}
                  style={{
                    backgroundColor: `${COLORS.TEXT_PRIMARY}B3`,
                    color: COLORS.BG_WHITE,
                  }}
                >
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

          {/* Content Section */}
          <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h2
                  className={cn(
                    "text-lg font-semibold line-clamp-1 transition-colors pr-2",
                    "group-hover:text-green-700"
                  )}
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {item.name}
                </h2>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {item.lat && item.lng && onShowOnMap && (
                    <button
                      onClick={handleShowOnMapClick}
                      className={cn(
                        "p-2 rounded-full shadow-sm hover:shadow-md border",
                        "transition-all duration-200 hover:scale-110"
                      )}
                      style={{
                        backgroundColor: `${COLORS.PRIMARY}10`,
                        borderColor: `${COLORS.PRIMARY}30`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${COLORS.PRIMARY}20`;
                        e.currentTarget.style.borderColor = COLORS.PRIMARY;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${COLORS.PRIMARY}10`;
                        e.currentTarget.style.borderColor = `${COLORS.PRIMARY}30`;
                      }}
                      aria-label="Voir sur la carte"
                      title="Voir sur la carte"
                      type="button"
                    >
                      <MapPin
                        className="h-4 w-4"
                        style={{ color: COLORS.PRIMARY }}
                      />
                    </button>
                  )}

                  <button
                    onClick={handleFavoriteClick}
                    className={cn(
                      "p-2 rounded-full shadow-sm hover:shadow-md border",
                      "transition-all duration-200 hover:scale-110"
                    )}
                    style={{
                      backgroundColor: COLORS.BG_GRAY,
                      borderColor: COLORS.BORDER,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.BG_WHITE;
                      e.currentTarget.style.borderColor = COLORS.ERROR;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.BG_GRAY;
                      e.currentTarget.style.borderColor = COLORS.BORDER;
                    }}
                    aria-label={
                      isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
                    }
                    type="button"
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4 transition-all duration-200",
                        isFavorite ? "fill-current" : ""
                      )}
                      style={{
                        color: isFavorite ? COLORS.ERROR : COLORS.TEXT_MUTED,
                      }}
                    />
                  </button>
                </div>
              </div>

              <div
                className="flex items-start gap-2 text-sm mb-3"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                <MapPin
                  className="h-4 w-4 mt-0.5 flex-shrink-0"
                  style={{ color: COLORS.PRIMARY }}
                />
                <span className="line-clamp-1" title={item.address}>
                  {item.address}
                </span>
              </div>

              {item.product_type?.length && item.product_type.length > 0 && (
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {item.product_type.slice(0, 4).map((product, index) => (
                      <span
                        key={index}
                        className={cn(
                          "inline-flex items-center gap-1 text-xs px-2.5 py-1",
                          "rounded-full border font-medium transition-colors duration-200"
                        )}
                        style={{
                          backgroundColor: `${COLORS.PRIMARY}10`,
                          color: COLORS.PRIMARY,
                          borderColor: `${COLORS.PRIMARY}20`,
                        }}
                      >
                        <Leaf className="w-3 h-3" />
                        {product}
                      </span>
                    ))}
                    {item.product_type.length > 4 && (
                      <span
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full border"
                        )}
                        style={{
                          backgroundColor: COLORS.BG_GRAY,
                          color: COLORS.TEXT_MUTED,
                          borderColor: COLORS.BORDER,
                        }}
                      >
                        +{item.product_type.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {item.description && (
                <p
                  className="text-sm line-clamp-2 mb-3 leading-relaxed"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
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
                  <span
                    className="font-medium"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {item.rating}
                  </span>
                  {item.reviewCount && (
                    <span style={{ color: COLORS.TEXT_MUTED }}>
                      ({item.reviewCount})
                    </span>
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

/* Main Component - Version avec Fetch Simplifié */
export default function Listing({
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: ListingProps): JSX.Element {
  // Store hooks
  const { visible: visibleListings = [] } = useListingsState();
  const { setAllListings } = useListingsActions();
  const { bounds: mapBounds } = useMapState();
  const { setCoordinates, setZoom } = useMapActions();

  // Interactions
  const { hoveredListingId } = useInteractionsState();
  const { setHoveredListingId, setOpenInfoWindowId, clearSelection } =
    useListingsActions();

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

  // IDs visibles pour les images
  const visibleIds = useMemo(
    () => visibleListings?.map((item) => item.id) || [],
    [visibleListings]
  );

  const { listings, isLoading: isLoadingImages } =
    useListingsWithImages(visibleIds);

  // Transformation des coordonnées
  const transformedItems = useMemo(() => {
    return (listings.length > 0 ? listings : visibleListings).map(
      (listing) => ({
        ...listing,
        lat:
          typeof listing.lat === "string"
            ? parseFloat(listing.lat)
            : listing.lat,
        lng:
          typeof listing.lng === "string"
            ? parseFloat(listing.lng)
            : listing.lng,
      })
    );
  }, [listings, visibleListings]);

  // ✅ Fetch supprimé - Les données viennent maintenant d'Explore.tsx
  // Le composant Listing est maintenant purement présentationnel

  // Handlers
  const handleShowOnMap = useCallback(
    (listing: ListingItem) => {
      if (!listing?.lat || !listing?.lng) {
        toast.info("Coordonnées manquantes pour cette ferme");
        return;
      }

      const lat =
        typeof listing.lat === "number"
          ? listing.lat
          : parseFloat(String(listing.lat));
      const lng =
        typeof listing.lng === "number"
          ? listing.lng
          : parseFloat(String(listing.lng));

      if (isNaN(lat) || isNaN(lng)) {
        toast.error("Coordonnées invalides pour cette ferme");
        return;
      }

      const id = listing.id;
      const numericId = typeof id === "number" ? id : parseInt(String(id), 10);

      if (!isNaN(numericId)) {
        setOpenInfoWindowId?.(numericId);
      }

      setCoordinates?.({ lng, lat });
      setZoom?.(14);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.success(`Centrage sur ${listing.name}`);
    },
    [setOpenInfoWindowId, setCoordinates, setZoom]
  );

  const handleToggleFavorite = useCallback(
    (id: string | number) => {
      if (!user) {
        toast("Connectez-vous pour gérer vos favoris", {
          action: {
            label: "Se connecter",
            onClick: () => openSignUp({ redirectUrl: "/sign-up" }),
          },
        });
        return;
      }

      const numericId = typeof id === "number" ? id : parseInt(String(id), 10);
      if (isNaN(numericId)) {
        toast.error("Identifiant de ferme invalide");
        return;
      }

      toggleFavoriteStore(numericId, user.id);
    },
    [user, toggleFavoriteStore, openSignUp]
  );

  const handleMouseEnter = useCallback(
    (id: string | number) => {
      const numericId = typeof id === "number" ? id : parseInt(String(id), 10);
      if (!isNaN(numericId)) {
        setHoveredListingId?.(numericId);
      }
    },
    [setHoveredListingId]
  );

  const handleMouseLeave = useCallback(
    () => setHoveredListingId?.(null),
    [setHoveredListingId]
  );

  const handleRetry = useCallback(() => {
    clearSelection();
    window.location.reload();
  }, [clearSelection]);

  // Load more avec IntersectionObserver
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || !onLoadMore) return;
    const el = loadMoreRef.current;
    if (!el) return;

    let locked = false;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !locked && !isLoading) {
          locked = true;
          onLoadMore();
          setTimeout(() => (locked = false), 800);
        }
      },
      { rootMargin: "200px 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, onLoadMore, isLoading]);

  // État vide
  if (transformedItems.length === 0 && !isLoading && !isLoadingImages) {
    return (
      <div
        className="p-6 min-h-screen"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <EmptyState onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div
      className="p-6 min-h-screen relative"
      style={{ backgroundColor: COLORS.BG_GRAY }}
    >
      {(isLoading || isLoadingImages) && <BookingStyleLoader />}

      <div
        className={cn(
          "flex flex-col gap-4 transition-all duration-300 max-w-4xl mx-auto",
          (isLoading || isLoadingImages) && "opacity-50 pointer-events-none"
        )}
      >
        {transformedItems.map((item) => {
          const itemNumericId =
            typeof item.id === "number"
              ? item.id
              : parseInt(String(item.id), 10);
          const isHovered =
            !isNaN(itemNumericId) && hoveredListingId === itemNumericId;

          return (
            <ListItem
              key={item.id}
              item={item}
              isHovered={isHovered}
              isFavorite={favorites.includes(item.id)}
              onMouseEnter={() => handleMouseEnter(item.id)}
              onMouseLeave={handleMouseLeave}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
              onShowOnMap={handleShowOnMap}
            />
          );
        })}

        {/* Load More */}
        {hasMore && (
          <div className="mt-6 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoading}
              className={cn(
                "inline-flex items-center gap-3 rounded-lg px-6 py-3",
                "text-base font-medium transition-all duration-200",
                "hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              style={{
                backgroundColor: COLORS.PRIMARY,
                color: COLORS.BG_WHITE,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
                }
              }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <span>Charger plus</span>
                  <span>↓</span>
                </>
              )}
            </button>
            <div ref={loadMoreRef} className="h-8 w-8 opacity-0" />
          </div>
        )}
      </div>
    </div>
  );
}
