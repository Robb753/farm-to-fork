"use client";

import React, { useEffect, useRef } from "react";
import { X } from "@/utils/icons";
import { createPortal } from "react-dom";

const Modal = React.forwardRef(({ children, onClose, className = "" }, ref) => {
  const modalRef = useRef(null);
  const backdropRef = useRef(null);
  const isClosingRef = useRef(false);

  // ✅ Fonction de fermeture sécurisée
  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    onClose?.();
  };

  // ✅ Fermeture avec ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ✅ Clic sur le backdrop
  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) {
      handleClose();
    }
  };

  // ✅ Prévenir le scroll du body
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // ✅ Focus management pour l'accessibilité
  useEffect(() => {
    const modal = modalRef.current;
    if (modal) {
      modal.focus();
    }
  }, []);

  const modalContent = (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-4 px-4"
      aria-modal="true"
      role="dialog"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative w-full max-w-4xl max-h-[90vh] 
          bg-white rounded-xl shadow-2xl 
          transform transition-all duration-300 ease-out
          animate-in fade-in-0 zoom-in-95
          overflow-hidden
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ✅ Bouton de fermeture accessible */}
        <button
          onClick={handleClose}
          className="
            absolute top-4 right-4 z-50
            w-8 h-8 
            bg-white/90 hover:bg-white 
            rounded-full 
            flex items-center justify-center
            text-gray-500 hover:text-gray-700
            transition-all duration-200
            shadow-sm hover:shadow-md
            focus:outline-none focus:ring-2 focus:ring-green-500
          "
          aria-label="Fermer la fenêtre"
          title="Fermer (Échap)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ✅ Contenu du modal avec scroll */}
        <div className="relative w-full h-full max-h-[90vh] overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );

  // ✅ Utilisation de createPortal pour une meilleure isolation
  return typeof window !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
});

Modal.displayName = "Modal";

export default Modal;
