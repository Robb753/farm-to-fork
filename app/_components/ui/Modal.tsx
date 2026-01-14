"use client";

import React, { useEffect, useRef, forwardRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "@/utils/icons";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import type { ModalProps } from "@/lib/types";

interface ExtendedModalProps extends ModalProps {
  className?: string;
  title?: string;
  disableEscapeKeyDown?: boolean;
  disableBackdropClick?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

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
    forwardedRef
  ) => {
    const modalRef = useRef<HTMLDivElement | null>(null);
    const backdropRef = useRef<HTMLDivElement | null>(null);
    const isClosingRef = useRef<boolean>(false);
    const closeTimeoutRef = useRef<number | null>(null);

    /**
     * ✅ Helper: assigne le même node au ref interne + ref externe
     * Compatible callback ref et object ref, sans TS hacks.
     */
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        modalRef.current = node;

        if (!forwardedRef) return;

        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else {
          // ForwardedRef peut être readonly selon les types.
          // On cast en MutableRefObject pour assigner proprement.
          (
            forwardedRef as React.MutableRefObject<HTMLDivElement | null>
          ).current = node;
        }
      },
      [forwardedRef]
    );

    const handleClose = useCallback((): void => {
      if (isClosingRef.current || !onClose) return;

      isClosingRef.current = true;
      onClose();

      if (closeTimeoutRef.current) window.clearTimeout(closeTimeoutRef.current);

      closeTimeoutRef.current = window.setTimeout(() => {
        isClosingRef.current = false;
        closeTimeoutRef.current = null;
      }, 300);
    }, [onClose]);

    useEffect(() => {
      return () => {
        if (closeTimeoutRef.current) {
          window.clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
      };
    }, []);

    // ✅ Fermeture avec ESC
    useEffect(() => {
      if (!isOpen || disableEscapeKeyDown) return;

      const handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === "Escape") handleClose();
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, disableEscapeKeyDown, handleClose]);

    // ✅ Clic sur le backdrop
    const handleBackdropClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>): void => {
        if (disableBackdropClick) return;
        if (e.target === backdropRef.current) handleClose();
      },
      [disableBackdropClick, handleClose]
    );

    // ✅ Prévenir le scroll du body
    useEffect(() => {
      if (!isOpen) return;

      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

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

    // ✅ Focus management
    useEffect(() => {
      if (!isOpen) return;
      const node = modalRef.current;
      if (!node) return;

      const t = window.setTimeout(() => node.focus(), 100);
      return () => window.clearTimeout(t);
    }, [isOpen]);

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
          backgroundColor: `${COLORS.TEXT_PRIMARY}80`,
        }}
        aria-modal="true"
        role="dialog"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby="modal-content"
        onClick={handleBackdropClick}
      >
        <div
          ref={setRefs}
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
              backgroundColor: `${COLORS.BG_WHITE}e6`,
              color: COLORS.TEXT_SECONDARY,
            }}
            aria-label="Fermer la fenêtre"
            title="Fermer (Échap)"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>

          <div
            id="modal-content"
            className="relative w-full h-full max-h-[90vh] overflow-auto"
          >
            {children}
          </div>
        </div>
      </div>
    );

    return typeof window !== "undefined"
      ? createPortal(modalContent, document.body)
      : null;
  }
);

Modal.displayName = "Modal";

export default Modal;
export type { ExtendedModalProps as ModalProps };
