import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";

/**
 * Types pour les statuts de ferme
 */
type FarmStatus = "open" | "closed" | string;

/**
 * Interface pour le badge de statut
 */
interface StatusBadge {
  label: string;
  cls: string;
}

/**
 * Interface pour les props des LargeCards
 */
interface LargeCardsProps {
  img?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  status?: FarmStatus;
}

/**
 * Détermine le badge de statut selon l'état de la ferme
 */
function statusBadge(statusRaw?: FarmStatus): StatusBadge | null {
  const s = String(statusRaw || "").toLowerCase();
  
  if (s === "open") {
    return { 
      label: "Ouvert", 
      cls: cn(
        "px-3 py-1.5 rounded-full text-sm font-medium",
        "bg-green-100 text-green-800 border border-green-200"
      )
    };
  }
  
  if (s === "closed") {
    return { 
      label: "Fermé", 
      cls: cn(
        "px-3 py-1.5 rounded-full text-sm font-medium",
        "bg-red-100 text-red-800 border border-red-200"
      )
    };
  }
  
  if (!s) return null;
  
  return { 
    label: statusRaw as string, 
    cls: cn(
      "px-3 py-1.5 rounded-full text-sm font-medium",
      "bg-yellow-100 text-yellow-800 border border-yellow-200"
    )
  };
}

/**
 * Composant LargeCards avec overlay de contenu
 * 
 * Features:
 * - Image de fond avec effet hover
 * - Overlay avec gradient pour la lisibilité
 * - Badge de statut conditionnel
 * - Bouton d'action avec focus states
 * - Configuration centralisée des couleurs
 */
function LargeCards({
  img,
  title = "Titre non renseigné",
  description = "",
  buttonText = "Découvrir",
  buttonLink = "#",
  status,
}: LargeCardsProps): JSX.Element {
  const badge = statusBadge(status);

  return (
    <section className="relative py-6">
      {/* ✅ Container d'image avec indicateur de statut */}
      <div className="relative h-96 min-w-[300px] overflow-hidden rounded-lg shadow-md">
        <Image
          src={img || "/placeholder-farm.jpg"}
          alt={title || "Illustration de ferme"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
          style={{ objectFit: "cover" }}
          className="transition-transform duration-500 hover:scale-105"
          priority
        />

        {/* ✅ Indicateur de statut optionnel */}
        {badge && (
          <div className={cn("absolute top-4 right-4", badge.cls)}>
            {badge.label}
          </div>
        )}

        {/* ✅ Overlay sombre pour améliorer la lisibilité */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `linear-gradient(135deg, ${COLORS.TEXT_PRIMARY} 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* ✅ Overlay de contenu */}
      <div className="pointer-events-none absolute left-6 top-24 max-w-sm sm:left-10 sm:top-32">
        {/* Gradient pour lisibilité sur photos claires */}
        <div 
          className="pointer-events-none absolute -inset-6 rounded-lg"
          style={{
            background: `linear-gradient(to right, ${COLORS.TEXT_PRIMARY}66, transparent)`,
          }}
        />
        
        <h3 
          className="relative text-3xl font-semibold mb-3 drop-shadow-lg"
          style={{ color: COLORS.BG_WHITE }}
        >
          {title}
        </h3>
        
        {description && (
          <p 
            className="relative text-lg drop-shadow-md mb-5"
            style={{ color: COLORS.BG_WHITE }}
          >
            {description}
          </p>
        )}

        {/* ✅ Bouton d'action stylé */}
        <Link
          href={buttonLink}
          className={cn(
            "relative pointer-events-auto inline-flex items-center gap-2",
            "px-5 py-2.5 font-medium rounded-md transition-all duration-200",
            "shadow-sm hover:shadow-md transform hover:scale-105",
            "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
          aria-label={`${buttonText} - ${title}`}
        >
          {buttonText}
          <span className="ml-1">→</span>
        </Link>
      </div>
    </section>
  );
}

/**
 * Variante : Card style plutôt que overlay
 * 
 * Features:
 * - Layout en carte avec image et contenu séparés
 * - Design plus traditionnel et accessible
 * - Bouton pleine largeur
 * - Hover effects sur l'image
 */
function LargeCardAlternate({
  img,
  title = "Titre non renseigné",
  description = "",
  buttonText = "Découvrir",
  buttonLink = "#",
  status,
}: LargeCardsProps): JSX.Element {
  const badge = statusBadge(status);

  return (
    <section className="relative my-6">
      <div 
        className={cn(
          "overflow-hidden rounded-lg shadow-md border",
          "transition-shadow duration-200 hover:shadow-lg"
        )}
        style={{
          backgroundColor: COLORS.BG_WHITE,
          borderColor: COLORS.BORDER,
        }}
      >
        {/* ✅ Container d'image */}
        <div className="relative h-64 w-full overflow-hidden">
          <Image
            src={img || "/placeholder-farm.jpg"}
            alt={title || "Illustration de ferme"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
            style={{ objectFit: "cover" }}
            className="transition-transform duration-500 hover:scale-105"
          />

          {/* ✅ Indicateur de statut optionnel */}
          {badge && (
            <div className={cn("absolute top-4 right-4", badge.cls)}>
              {badge.label}
            </div>
          )}
        </div>

        {/* ✅ Contenu de la carte */}
        <div className="p-5">
          <h3 
            className="text-2xl font-semibold mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            {title}
          </h3>
          
          {description && (
            <p 
              className="mb-5 leading-relaxed"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              {description}
            </p>
          )}

          <Link
            href={buttonLink}
            className={cn(
              "w-full inline-flex items-center justify-center gap-2",
              "px-5 py-2.5 font-medium rounded-md transition-all duration-200",
              "shadow-sm hover:shadow-md",
              "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
            aria-label={`${buttonText} - ${title}`}
          >
            {buttonText}
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Variante compacte pour les listes
 */
function LargeCardCompact({
  img,
  title = "Titre non renseigné",
  description = "",
  buttonText = "Voir",
  buttonLink = "#",
  status,
}: LargeCardsProps): JSX.Element {
  const badge = statusBadge(status);

  return (
    <div 
      className={cn(
        "flex gap-4 p-4 rounded-lg border transition-all duration-200",
        "hover:shadow-md hover:border-green-200"
      )}
      style={{
        backgroundColor: COLORS.BG_WHITE,
        borderColor: COLORS.BORDER,
      }}
    >
      {/* ✅ Image compacte */}
      <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg">
        <Image
          src={img || "/placeholder-farm.jpg"}
          alt={title}
          fill
          sizes="96px"
          style={{ objectFit: "cover" }}
          className="transition-transform duration-300 hover:scale-110"
        />
        
        {badge && (
          <div 
            className="absolute -top-1 -right-1 text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: status === "open" ? COLORS.SUCCESS : COLORS.ERROR,
              color: COLORS.BG_WHITE,
            }}
          >
            {badge.label}
          </div>
        )}
      </div>

      {/* ✅ Contenu */}
      <div className="flex-1 min-w-0">
        <h4 
          className="font-semibold text-lg mb-1 truncate"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          {title}
        </h4>
        
        {description && (
          <p 
            className="text-sm mb-3 line-clamp-2"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            {description}
          </p>
        )}
        
        <Link
          href={buttonLink}
          className={cn(
            "inline-flex items-center gap-1 text-sm font-medium",
            "hover:underline transition-colors duration-200",
            "focus:outline-none focus:ring-1 focus:ring-green-500 rounded"
          )}
          style={{ color: COLORS.PRIMARY }}
        >
          {buttonText} →
        </Link>
      </div>
    </div>
  );
}

export { LargeCardAlternate, LargeCardCompact };
export default LargeCards;