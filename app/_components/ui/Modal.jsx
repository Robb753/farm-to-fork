"use client";

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { X } from "lucide-react";

const Modal = forwardRef(({ children, onClose }, ref) => {
  const modalRef = useRef(null);
  const isClosingRef = useRef(false);

  // Exposer une méthode forceClose via la référence
  useImperativeHandle(ref, () => ({
    forceClose: () => {
      if (!isClosingRef.current) {
        isClosingRef.current = true;
        document.body.style.overflow = "auto";
        if (onClose) onClose();
      }
    }
  }));

  // Fermer le modal avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isClosingRef.current) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fermer le modal en cliquant à l'extérieur
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target) && !isClosingRef.current) {
      onClose();
    }
  };

  // Empêcher le défilement du body quand le modal est ouvert
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-12"
      aria-modal="true"
      role="dialog"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-[95%] sm:w-[90%] md:w-[80%] max-w-4xl bg-white rounded-xl shadow-xl animate-fadeIn my-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black focus:outline-none z-10 bg-white/80 rounded-full p-1"
          aria-label="Fermer la fenêtre"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {children}
      </div>
    </div>
  );
});

Modal.displayName = "Modal";

export default Modal;