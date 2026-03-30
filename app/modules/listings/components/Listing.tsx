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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
// 🔒 SÉCURITÉ: Import des fonctions de sanitisation
import { escapeHTML } from "@/lib/utils/sanitize";

import {
  useVisibleListings,
  useListingsActions,
  useMapActions,
  useMapBounds,
  useUnifiedStore,
} from "@/lib/store";
import { useUserFavorites, useUserActions } from "@/lib/store/userStore";

import Link from "next/link";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { COLORS } from "@/lib/config";

/**
 * Interface pour un listing
 */
interface ListingItem {
  id: string | number;
  slug?: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  description?: string;
  product_type?: string[];
  certifications?: string[];
  availability?: string;
  rating?: number;
  listingImages?: Array<{ url: string }>;
  image_url?: string;
  images?: string[];
  created_at?: string;
  updated_at?: string;
  active?: boolean;
  clerk_user_id?: string | null;
  distance?: number | null;
}

/**
 * Interface pour les props du composant principal
 */
interface ListingProps {
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

/* ------------------------------
   Helpers
------------------------------ */
function getFarmEmoji(productTypes?: string[]): string {
  if (!productTypes?.length) return "🌿";
  const types = productTypes.map((t) => t.toLowerCase());
  if (types.some((t) => t.includes("vigne") || t.includes("vin"))) return "🍇";
  if (types.some((t) => t.includes("marché") || t.includes("marche"))) return "🛒";
  if (types.some((t) => t.includes("amap"))) return "🤝";
  return "🏡";
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

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
    {/* 🔒 SÉCURITÉ: Certification échappée */}
    <span className="truncate max-w-20">{escapeHTML(certification)}</span>
  </div>
);

/* ListItem Component - Redesign hiérarchie visuelle */
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
    const articleRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (isHovered) {
        articleRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, [isHovered]);

    const getImageUrl = useCallback((): string => {
      if (Array.isArray(item.listingImages) && item.listingImages.length > 0) {
        return item.listingImages[0]?.url || "";
      }
      return "";
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
    const hasImage = !!imageUrl && !imageError;
    const emoji = getFarmEmoji(item.product_type);
    const initials = getInitials(item.name);
    const isUnclaimed = !item.active && !item.clerk_user_id;

    return (
      <article
        ref={articleRef}
        id={`listing-${item.id}`}
        className={cn(
          "group relative flex border rounded-xl overflow-hidden",
          "transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 mb-3",
          isHovered
            ? "ring-2 ring-green-400 shadow-md border-green-300 -translate-y-0.5"
            : "shadow-sm border-gray-200 hover:border-green-200"
        )}
        style={{ backgroundColor: isHovered ? "#f0fdf4" : COLORS.BG_WHITE }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Link href={`/farm/${item.slug ?? item.id}`} className="flex w-full min-h-[100px]">
          {/* === IMAGE SECTION === */}
          <div className="relative w-[120px] sm:w-[140px] flex-shrink-0 self-stretch">
            {hasImage ? (
              <OptimizedImage
                src={imageUrl}
                alt={escapeHTML(`${item.name} - Ferme locale`)}
                fill={true}
                width={0}
                height={0}
                sizes="140px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setImageError(true)}
                onLoad={() => {}}
                showSkeleton={true}
                blurDataURL=""
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center gap-1 select-none"
                style={{ backgroundColor: "#f0fdf4" }}
              >
                <span className="text-3xl leading-none">{emoji}</span>
                <span
                  className="text-sm font-bold tracking-wide"
                  style={{ color: COLORS.PRIMARY }}
                >
                  {initials}
                </span>
              </div>
            )}

            {/* Status badge — top left */}
            {item.availability && (
              <div className="absolute top-2 left-2">
                <StatusBadge availability={item.availability} />
              </div>
            )}

            {/* "Non revendiquée" badge — bottom left */}
            {isUnclaimed && (
              <div className="absolute bottom-2 left-1.5">
                <span
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{
                    backgroundColor: "rgba(254,243,199,0.95)",
                    color: "#92400e",
                  }}
                >
                  ⚠️ Non revendiquée
                </span>
              </div>
            )}

            {/* Multiple images counter — bottom right */}
            {Array.isArray(item.listingImages) && item.listingImages.length > 1 && (
              <div
                className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] flex items-center gap-0.5"
                style={{
                  backgroundColor: "rgba(0,0,0,0.55)",
                  color: "#fff",
                }}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
                {item.listingImages.length}
              </div>
            )}

            {/* Action buttons overlay — top right */}
            <div className="absolute top-2 right-2 flex flex-col gap-1.5">
              {item.lat && item.lng && onShowOnMap && (
                <button
                  onClick={handleShowOnMapClick}
                  className="p-1.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110"
                  style={{ backgroundColor: "rgba(255,255,255,0.92)" }}
                  aria-label="Voir sur la carte"
                  title="Voir sur la carte"
                  type="button"
                >
                  <MapPin className="h-3.5 w-3.5" style={{ color: COLORS.PRIMARY }} />
                </button>
              )}
              <button
                onClick={handleFavoriteClick}
                className="p-1.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110"
                style={{ backgroundColor: "rgba(255,255,255,0.92)" }}
                aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                type="button"
              >
                <Heart
                  className={cn("h-3.5 w-3.5 transition-all duration-200", isFavorite ? "fill-current" : "")}
                  style={{ color: isFavorite ? COLORS.ERROR : COLORS.TEXT_MUTED }}
                />
              </button>
            </div>
          </div>

          {/* === CONTENT SECTION === */}
          <div className="flex-1 p-3 flex flex-col justify-start min-w-0 gap-1.5">
            {/* Name */}
            <h2
              className={cn(
                "text-base font-bold line-clamp-1 leading-snug transition-colors",
                "group-hover:text-green-700"
              )}
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {/* 🔒 SÉCURITÉ: Nom de ferme échappé */}
              {escapeHTML(item.name)}
            </h2>

            {/* Address + Distance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs min-w-0" style={{ color: COLORS.TEXT_MUTED }}>
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: COLORS.PRIMARY }} />
                <span className="line-clamp-1" title={item.address ?? ""}>{item.address}</span>
              </div>
              {item.distance != null && (
                <span
                  className="ml-2 flex-shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${COLORS.PRIMARY}12`,
                    color: COLORS.PRIMARY,
                  }}
                >
                  {item.distance < 1
                    ? `${Math.round(item.distance * 1000)} m`
                    : `${item.distance.toFixed(1)} km`}
                </span>
              )}
            </div>

            {/* Rating */}
            {item.rating != null && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                  {item.rating}
                </span>
              </div>
            )}

            {/* Product tags */}
            {item.product_type?.length && item.product_type.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.product_type.slice(0, 3).map((product, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium"
                    style={{
                      backgroundColor: `${COLORS.PRIMARY}10`,
                      color: COLORS.PRIMARY,
                      borderColor: `${COLORS.PRIMARY}20`,
                    }}
                  >
                    <Leaf className="w-3 h-3" />
                    {/* 🔒 SÉCURITÉ: Type de produit échappé */}
                    {escapeHTML(product)}
                  </span>
                ))}
                {item.product_type.length > 3 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: COLORS.BG_GRAY,
                      color: COLORS.TEXT_MUTED,
                      borderColor: COLORS.BORDER,
                    }}
                  >
                    +{item.product_type.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {item.description && (
              <p className="text-xs line-clamp-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                {escapeHTML(item.description)}
              </p>
            )}

            {/* Certifications (max 2) */}
            {item.certifications && item.certifications.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-auto pt-0.5">
                {item.certifications.slice(0, 2).map((cert, i) => (
                  <CertificationBadge key={i} certification={cert} />
                ))}
                {item.certifications.length > 2 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: COLORS.BG_GRAY,
                      color: COLORS.TEXT_MUTED,
                      borderColor: COLORS.BORDER,
                    }}
                  >
                    +{item.certifications.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </Link>
      </article>
    );
  }
);
ListItem.displayName = "ListItem";

/* Main Component - Version avec Fetch Simplifié */
export default function Listing({
  isLoading = false,
}: ListingProps): JSX.Element {
  // Store hooks
  const visibleListings = useVisibleListings();
  const _mapBounds = useMapBounds();
  const { setCoordinates, setZoom } = useMapActions();

  // Interactions
  const hoveredListingId = useUnifiedStore((s) => s.interactions.hoveredListingId);
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
  const transformedItems = useMemo(() => {
    return (visibleListings || []).map((listing: any) => ({
      ...listing,
      lat:
        typeof listing.lat === "string" ? parseFloat(listing.lat) : listing.lat,
      lng:
        typeof listing.lng === "string" ? parseFloat(listing.lng) : listing.lng,
    }));
  }, [visibleListings]);

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
      // 🔒 SÉCURITÉ: Nom de ferme échappé dans toast
      toast.success(`Centrage sur ${escapeHTML(listing.name)}`);
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

  // État vide
  if (transformedItems.length === 0 && !isLoading) {
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
      className="px-4 pt-4 pb-6 min-h-screen relative"
      style={{ backgroundColor: COLORS.BG_GRAY }}
    >
      {isLoading && <BookingStyleLoader />}

      <div
        className={cn(
          "flex flex-col gap-4 transition-all duration-300 max-w-4xl mx-auto",
          isLoading && "opacity-50 pointer-events-none"
        )}
      >
        {transformedItems.map((item) => {
          const itemNumericId =
            typeof item.id === "number"
              ? item.id
              : parseInt(String(item.id), 10);
          const isHovered =
            !isNaN(itemNumericId) && hoveredListingId === itemNumericId;
          const isFav =
            !isNaN(itemNumericId) && favorites.includes(itemNumericId);

          return (
            <ListItem
              key={item.id}
              item={item}
              isHovered={isHovered}
              isFavorite={isFav}
              onMouseEnter={() => handleMouseEnter(item.id)}
              onMouseLeave={handleMouseLeave}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
              onShowOnMap={handleShowOnMap}
            />
          );
        })}
      </div>
    </div>
  );
}
