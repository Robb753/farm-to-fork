"use client";

import React, { useCallback } from "react";
import Image from "next/image";
import { Heart } from "@/utils/icons";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";

/**
 * Interface pour les images de listing
 */
interface ListingImage {
  url: string;
  alt?: string;
}

/**
 * Interface pour un item de listing
 */
interface ListingItem {
  id: string | number;
  name?: string;
  address?: string;
  price?: number | string;
  rating?: number | string;
  availability?: string;
  listingImages?: ListingImage[];
  certifications?: string[];
}

/**
 * Interface pour les props du composant
 */
interface MarkerListingItemProps {
  item: ListingItem;
  onNavigate?: (id: string | number) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string | number) => void;
}

/**
 * Composant de carte pour afficher un listing dans une liste ou carte
 * 
 * Features:
 * - Affichage optimisé des informations ferme
 * - Gestion des favoris avec état visuel
 * - Navigation accessible au clavier
 * - Formatage intelligent du prix
 * - Badges de statut et certifications
 * - Configuration centralisée des couleurs
 */
function MarkerListingItem({ 
  item, 
  onNavigate, 
  isFavorite = false, 
  onToggleFavorite 
}: MarkerListingItemProps): JSX.Element {
  const id = item?.id;
  const title = item?.name || "Sans nom";
  const address = item?.address || "Adresse non disponible";
  const imageUrl = item?.listingImages?.[0]?.url || "/default-farm-image.jpg";

  /**
   * Formatage intelligent du prix
   */
  const formattedPrice = (() => {
    const p = item?.price;
    if (p == null || p === "") return null;
    
    const num = typeof p === "number" ? p : Number(p);
    if (Number.isNaN(num)) return `${p} €`;
    
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(num);
    } catch {
      return `${num} €`;
    }
  })();

  /**
   * Détermine le statut d'ouverture
   */
  const statusRaw = String(item?.availability || "").toLowerCase();
  const isOpen = statusRaw === "open";

  /**
   * Navigation avec callback ou fallback
   */
  const handleNavigation = useCallback(() => {
    if (!id) return;
    
    if (onNavigate) {
      onNavigate(id);
    } else if (typeof window !== "undefined") {
      window.location.href = `/farm/${id}`;
    }
  }, [id, onNavigate]);

  /**
   * Gestion des événements clavier pour l'accessibilité
   */
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNavigation();
    }
  };

  /**
   * Gestion du toggle favori avec propagation stoppée
   */
  const handleToggleFavorite = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (id && onToggleFavorite) {
      onToggleFavorite(id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleNavigation}
      onKeyDown={handleKeyDown}
      className={cn(
        "group rounded-xl overflow-hidden shadow-lg transition-all duration-300",
        "max-w-[280px] cursor-pointer outline-none",
        "hover:shadow-xl hover:scale-[1.02]",
        "focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      )}
      style={{ backgroundColor: COLORS.BG_WHITE }}
      aria-label={`Ouvrir la fiche ${title}`}
    >
      {/* ✅ Section image avec overlays */}
      <div className="relative w-full h-[160px] overflow-hidden">
        <Image
          src={imageUrl}
          alt={`Photo de ${title}`}
          fill
          sizes="(max-width: 640px) 60vw, 280px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          priority={false}
        />

        {/* ✅ Bouton favoris */}
        <button
          type="button"
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded-full shadow-sm z-10",
            "transition-all duration-200 hover:scale-110",
            "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
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
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={!!isFavorite}
          onClick={handleToggleFavorite}
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-colors duration-200",
              isFavorite ? "text-red-500 fill-current" : "text-gray-400"
            )}
          />
        </button>

        {/* ✅ Badge de statut */}
        <div
          className={cn(
            "absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm"
          )}
          style={{
            backgroundColor: isOpen ? `${COLORS.SUCCESS}20` : `${COLORS.ERROR}20`,
            color: isOpen ? COLORS.SUCCESS : COLORS.ERROR,
            border: `1px solid ${isOpen ? `${COLORS.SUCCESS}40` : `${COLORS.ERROR}40`}`,
          }}
        >
          {isOpen ? "🟢 Ouvert" : "🔴 Fermé"}
        </div>
      </div>

      {/* ✅ Section contenu */}
      <div className="p-3">
        <div className="flex justify-between items-start">
          <h3 
            className="font-medium text-base mb-1 truncate flex-1"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            {title}
          </h3>

          {/* ✅ Note avec étoile */}
          {item?.rating != null && !Number.isNaN(Number(item.rating)) && (
            <div className="flex items-center gap-1 ml-2">
              <span 
                className={cn(
                  "text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5"
                )}
                style={{
                  backgroundColor: COLORS.PRIMARY,
                  color: COLORS.BG_WHITE,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-3 h-3"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                    clipRule="evenodd"
                  />
                </svg>
                {Number(item.rating).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* ✅ Adresse */}
        <p 
          className="text-sm mb-2 truncate"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          📍 {address}
        </p>

        {/* ✅ Prix */}
        {formattedPrice && (
          <div className="mt-1 flex items-baseline gap-1">
            <span 
              className="font-semibold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {formattedPrice}
            </span>
            <span 
              className="text-sm"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              / jour
            </span>
          </div>
        )}

        {/* ✅ Certifications */}
        {Array.isArray(item?.certifications) && item.certifications.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.certifications.slice(0, 2).map((cert, index) => (
              <span
                key={index}
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full border"
                )}
                style={{
                  backgroundColor: `${COLORS.PRIMARY}10`,
                  color: COLORS.PRIMARY,
                  borderColor: `${COLORS.PRIMARY}30`,
                }}
              >
                {cert}
              </span>
            ))}
            {item.certifications.length > 2 && (
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full border"
                )}
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

        {/* ✅ Indicateur d'action hover */}
        <div 
          className={cn(
            "mt-3 pt-2 border-t opacity-0 group-hover:opacity-100",
            "transition-opacity duration-200"
          )}
          style={{ borderColor: COLORS.BORDER }}
        >
          <div 
            className="flex items-center justify-center gap-1 text-sm font-medium"
            style={{ color: COLORS.PRIMARY }}
          >
            Voir la ferme
            <span className="transform group-hover:translate-x-1 transition-transform duration-200">
              →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarkerListingItem;