"use client";

import React from "react";
import { COLORS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Props du composant Loading
 */
interface LoadingProps {
  /**
   * Message de chargement personnalisé
   */
  message?: string;
  /**
   * Taille du spinner
   */
  size?: "sm" | "md" | "lg";
  /**
   * Afficher en plein écran ou inline
   */
  fullScreen?: boolean;
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

/**
 * Composant de chargement avec spinner animé
 * 
 * Features:
 * - Spinner animé avec couleurs configurées
 * - Message personnalisable
 * - Tailles multiples (sm, md, lg)
 * - Mode plein écran ou inline
 * - Accessibilité avec ARIA
 */
export default function Loading({
  message = "Chargement en cours...",
  size = "md",
  fullScreen = true,
  className,
}: LoadingProps = {}): JSX.Element {
  /**
   * Configuration des tailles de spinner
   */
  const sizeConfig = {
    sm: {
      spinner: "h-8 w-8",
      text: "text-sm",
      border: "border-2",
    },
    md: {
      spinner: "h-16 w-16", 
      text: "text-lg",
      border: "border-4",
    },
    lg: {
      spinner: "h-24 w-24",
      text: "text-xl",
      border: "border-4",
    },
  };

  const config = sizeConfig[size];

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center px-4",
        fullScreen ? "min-h-screen" : "py-8",
        className
      )}
      style={{ backgroundColor: COLORS.BG_WHITE }}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {/* ✅ Spinner avec couleurs configurées */}
      <div 
        className={cn(
          "animate-spin ease-linear rounded-full mb-6",
          "border-t-transparent",
          config.spinner,
          config.border
        )}
        style={{ 
          borderColor: `${COLORS.PRIMARY} ${COLORS.PRIMARY} ${COLORS.PRIMARY} transparent`
        }}
        aria-hidden="true"
      />

      {/* ✅ Texte de chargement */}
      <p 
        className={cn(
          "animate-pulse font-medium",
          config.text
        )}
        style={{ color: COLORS.TEXT_SECONDARY }}
      >
        {message}
      </p>

      {/* ✅ Points animés optionnels pour les longs chargements */}
      <div className="flex space-x-1 mt-2">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full animate-bounce",
              `animation-delay-${index * 150}`
            )}
            style={{ 
              backgroundColor: COLORS.PRIMARY,
              animationDelay: `${index * 0.15}s`,
            }}
          />
        ))}
      </div>

      {/* ✅ Texte d'accessibilité caché */}
      <span className="sr-only">
        Veuillez patienter pendant le chargement de la page
      </span>
    </div>
  );
}

/**
 * Variante inline du composant Loading pour utilisation dans des composants
 */
export function InlineLoading({ 
  message = "Chargement...", 
  size = "sm" 
}: Pick<LoadingProps, "message" | "size">): JSX.Element {
  return (
    <Loading 
      message={message} 
      size={size} 
      fullScreen={false}
      className="py-4"
    />
  );
}

/**
 * Spinner simple sans texte pour utilisation dans des boutons
 */
export function SpinnerOnly({ 
  size = "sm",
  className 
}: Pick<LoadingProps, "size" | "className">): JSX.Element {
  const sizeConfig = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2", 
    lg: "h-8 w-8 border-4",
  };

  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-t-transparent",
        sizeConfig[size],
        className
      )}
      style={{ 
        borderColor: `currentColor currentColor currentColor transparent`
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Overlay de chargement pour superposer sur du contenu
 */
export function LoadingOverlay({ 
  message = "Chargement en cours...",
  isVisible = true 
}: {
  message?: string;
  isVisible?: boolean;
}): JSX.Element | null {
  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/50 backdrop-blur-sm"
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Chargement en cours"
    >
      <div 
        className="bg-white rounded-lg p-8 shadow-xl max-w-sm mx-4"
        style={{
          backgroundColor: COLORS.BG_WHITE,
          borderColor: COLORS.BORDER,
        }}
      >
        <Loading 
          message={message}
          size="md"
          fullScreen={false}
        />
      </div>
    </div>
  );
}