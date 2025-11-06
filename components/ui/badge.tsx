import React from "react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";

/**
 * Types et interfaces pour le composant Badge
 */
type BadgeVariant = 
  | "default" 
  | "outline" 
  | "secondary" 
  | "success" 
  | "warning" 
  | "error" 
  | "info";

type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  /** Contenu du badge */
  children: React.ReactNode;
  /** Classe CSS personnalisée */
  className?: string;
  /** Variante de style du badge */
  variant?: BadgeVariant;
  /** Taille du badge */
  size?: BadgeSize;
  /** Badge cliquable avec onClick */
  onClick?: () => void;
  /** Badge avec icône */
  icon?: React.ReactNode;
  /** Position de l'icône */
  iconPosition?: "left" | "right";
  /** Badge supprimable */
  onRemove?: () => void;
  /** Badge avec point de notification */
  dot?: boolean;
}

/**
 * Configuration des variants avec le design system
 */
const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: `text-white`,
  outline: `border bg-transparent`,
  secondary: `text-white`,
  success: `text-white`,
  warning: `text-white`,
  error: `text-white`,
  info: `text-white`,
};

/**
 * Configuration des couleurs par variant
 */
const getVariantColors = (variant: BadgeVariant) => {
  switch (variant) {
    case "default":
      return {
        backgroundColor: COLORS.PRIMARY,
        color: COLORS.TEXT_WHITE,
      };
    case "outline":
      return {
        borderColor: COLORS.BORDER,
        color: COLORS.TEXT_SECONDARY,
        backgroundColor: "transparent",
      };
    case "secondary":
      return {
        backgroundColor: COLORS.TEXT_SECONDARY,
        color: COLORS.TEXT_WHITE,
      };
    case "success":
      return {
        backgroundColor: COLORS.SUCCESS,
        color: COLORS.TEXT_WHITE,
      };
    case "warning":
      return {
        backgroundColor: COLORS.WARNING,
        color: COLORS.TEXT_WHITE,
      };
    case "error":
      return {
        backgroundColor: COLORS.ERROR,
        color: COLORS.TEXT_WHITE,
      };
    case "info":
      return {
        backgroundColor: COLORS.INFO,
        color: COLORS.TEXT_WHITE,
      };
    default:
      return {
        backgroundColor: COLORS.PRIMARY,
        color: COLORS.TEXT_WHITE,
      };
  }
};

/**
 * Configuration des tailles
 */
const SIZE_STYLES: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2 py-1 text-xs",
  lg: "px-3 py-1.5 text-sm",
};

/**
 * Composant Badge flexible et réutilisable
 * 
 * Features:
 * - Variants typés avec couleurs du design system
 * - Tailles configurables (sm, md, lg)
 * - Support pour icônes avec positions
 * - Badge cliquable avec onClick
 * - Badge supprimable avec bouton X
 * - Point de notification optionnel
 * - Accessibilité complète
 * - Design cohérent avec Farm To Fork
 * 
 * @param props - Configuration du badge
 * @returns Composant Badge stylé
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  className = "",
  variant = "default",
  size = "md",
  onClick,
  icon,
  iconPosition = "left",
  onRemove,
  dot = false,
}) => {
  const colors = getVariantColors(variant);
  const isClickable = Boolean(onClick);
  const isRemovable = Boolean(onRemove);

  const baseClasses = cn(
    "inline-flex items-center rounded-full font-medium transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    SIZE_STYLES[size],
    VARIANT_STYLES[variant],
    isClickable && "cursor-pointer hover:opacity-80 active:scale-95",
    isRemovable && "pr-1",
    className
  );

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  };

  const badgeContent = (
    <>
      {/* Point de notification */}
      {dot && (
        <span 
          className="w-2 h-2 rounded-full mr-1.5"
          style={{ backgroundColor: colors.color }}
          aria-hidden="true"
        />
      )}

      {/* Icône à gauche */}
      {icon && iconPosition === "left" && (
        <span className="mr-1.5 flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}

      {/* Contenu principal */}
      <span className="truncate">{children}</span>

      {/* Icône à droite */}
      {icon && iconPosition === "right" && (
        <span className="ml-1.5 flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}

      {/* Bouton de suppression */}
      {isRemovable && (
        <button
          type="button"
          onClick={handleRemove}
          className="ml-1.5 p-0.5 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Supprimer le badge"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </>
  );

  // Badge cliquable
  if (isClickable) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={baseClasses}
        style={colors}
        aria-label={typeof children === "string" ? `Badge: ${children}` : "Badge cliquable"}
      >
        {badgeContent}
      </button>
    );
  }

  // Badge standard
  return (
    <span 
      className={baseClasses} 
      style={colors}
      role={onRemove ? "button" : undefined}
      tabIndex={onRemove ? 0 : undefined}
    >
      {badgeContent}
    </span>
  );
};

/**
 * Composant BadgeGroup pour afficher plusieurs badges
 */
interface BadgeGroupProps {
  /** Liste des badges à afficher */
  badges: Array<{
    id: string;
    label: string;
    variant?: BadgeVariant;
    icon?: React.ReactNode;
    onClick?: () => void;
    onRemove?: () => void;
  }>;
  /** Classe CSS personnalisée */
  className?: string;
  /** Espacement entre les badges */
  spacing?: "tight" | "normal" | "loose";
}

export const BadgeGroup: React.FC<BadgeGroupProps> = ({
  badges,
  className = "",
  spacing = "normal",
}) => {
  const spacingClasses = {
    tight: "gap-1",
    normal: "gap-2", 
    loose: "gap-3",
  };

  return (
    <div className={cn("flex flex-wrap", spacingClasses[spacing], className)}>
      {badges.map((badge) => (
        <Badge
          key={badge.id}
          variant={badge.variant}
          onClick={badge.onClick}
          onRemove={badge.onRemove}
          icon={badge.icon}
        >
          {badge.label}
        </Badge>
      ))}
    </div>
  );
};

/**
 * Export des types pour utilisation externe
 */
export type { BadgeProps, BadgeVariant, BadgeSize };