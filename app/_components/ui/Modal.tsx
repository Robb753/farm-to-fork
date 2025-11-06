"use client";

import React, { useEffect, useRef, forwardRef } from "react";
import { createPortal } from "react-dom";
import { X } from "@/utils/icons";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import type { ModalProps } from "@/lib/types";

/**
 * Props étendues pour le composant Modal
 */
interface ExtendedModalProps extends ModalProps {
  /**
   * Classes CSS additionnelles pour la modal
   */
  className?: string;
  /**
   * Titre de la modal pour l'accessibilité
   */
  title?: string;
  /**
   * Désactiver la fermeture par ESC
   */
  disableEscapeKeyDown?: boolean;
  /**
   * Désactiver la fermeture par clic sur le backdrop
   */
  disableBackdropClick?: boolean;
  /**
   * Taille de la modal
   */
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

/**
 * Composant Modal accessible et réutilisable
 *
 * Features:
 * - Fermeture par ESC ou clic sur backdrop
 * - Focus management automatique
 * - Portal pour isolation DOM
 * - Prévention du scroll du body
 * - Animations avec Tailwind
 * - Accessibilité ARIA
 */
const Modal = forwardRef<HTMLDivElement, ExtendedModalProps>(
  (
    {
      children,
      isOpen,
      onClose,
      className = "",
      title,
      disableEscapeKeyDown = false,
      disableBackdropClick = false,
      size = "lg",
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const isClosingRef = useRef<boolean>(false);

    // ✅ Fonction de fermeture sécurisée
    const handleClose = (): void => {
      if (isClosingRef.current || !onClose) return;
      isClosingRef.current = true;
      onClose();
      // Reset du flag après un délai pour permettre la réouverture
      setTimeout(() => {
        isClosingRef.current = false;
      }, 300);
    };

    // ✅ Fermeture avec ESC
    useEffect(() => {
      if (!isOpen || disableEscapeKeyDown) return;

      const handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === "Escape") {
          handleClose();
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, disableEscapeKeyDown]);

    // ✅ Clic sur le backdrop
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
      if (disableBackdropClick) return;
      if (e.target === backdropRef.current) {
        handleClose();
      }
    };

    // ✅ Prévenir le scroll du body
    useEffect(() => {
      if (!isOpen) return;

      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      // Calcul de la largeur de la scrollbar pour éviter le "jump"
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }, [isOpen]);

    // ✅ Focus management pour l'accessibilité
    useEffect(() => {
      if (!isOpen) return;

      const modal = modalRef.current;
      if (modal) {
        // Focus sur la modal avec un délai pour l'animation
        const focusTimeout = setTimeout(() => {
          modal.focus();
        }, 100);

        return () => clearTimeout(focusTimeout);
      }
    }, [isOpen]);

    // ✅ Classes de taille basées sur la configuration
    const getSizeClasses = (modalSize: ExtendedModalProps["size"]): string => {
      const sizeMap = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-4xl",
        xl: "max-w-6xl",
        full: "max-w-[95vw]",
      };
      return sizeMap[modalSize || "lg"];
    };

    // Ne pas rendre si la modal n'est pas ouverte
    if (!isOpen) return null;

    const modalContent = (
      <div
        ref={backdropRef}
        className={cn(
          "fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto py-4 px-4",
          "bg-black/50 backdrop-blur-sm",
          "animate-in fade-in-0 duration-300"
        )}
        style={{
          backgroundColor: `${COLORS.TEXT_PRIMARY}80`, // 50% opacity avec couleur configurée
        }}
        aria-modal="true"
        role="dialog"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby="modal-content"
        onClick={handleBackdropClick}
      >
        <div
          ref={ref || modalRef}
          tabIndex={-1}
          className={cn(
            "relative w-full max-h-[90vh]",
            "bg-white rounded-xl shadow-2xl",
            "transform transition-all duration-300 ease-out",
            "animate-in fade-in-0 zoom-in-95",
            "overflow-hidden",
            getSizeClasses(size),
            className
          )}
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.BORDER,
          }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* ✅ Header optionnel avec titre */}
          {title && (
            <div
              className="px-6 py-4 border-b"
              style={{ borderColor: COLORS.BORDER }}
            >
              <h2
                id="modal-title"
                className="text-lg font-semibold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {title}
              </h2>
            </div>
          )}

          {/* ✅ Bouton de fermeture accessible */}
          <button
            onClick={handleClose}
            className={cn(
              "absolute top-4 right-4 z-50",
              "w-8 h-8",
              "bg-white/90 hover:bg-white",
              "rounded-full",
              "flex items-center justify-center",
              "transition-all duration-200",
              "shadow-sm hover:shadow-md",
              "focus:outline-none focus:ring-2 focus:ring-green-500",
              "focus:ring-offset-2",
              "text-gray-500 hover:text-gray-700"
            )}
            style={{
              backgroundColor: `${COLORS.BG_WHITE}e6`, // 90% opacity
              color: COLORS.TEXT_SECONDARY,
            }}
            aria-label="Fermer la fenêtre"
            title="Fermer (Échap)"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>

          {/* ✅ Contenu du modal avec scroll */}
          <div
            id="modal-content"
            className="relative w-full h-full max-h-[90vh] overflow-auto"
          >
            {children}
          </div>
        </div>
      </div>
    );

    // ✅ Utilisation de createPortal pour une meilleure isolation
    return typeof window !== "undefined"
      ? createPortal(modalContent, document.body)
      : null;
  }
);

Modal.displayName = "Modal";

export default Modal;
export type { ExtendedModalProps as ModalProps };
