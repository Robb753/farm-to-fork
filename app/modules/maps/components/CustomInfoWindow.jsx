"use client";

import React, { useEffect, useRef, useState } from "react";
import { OverlayView } from "@react-google-maps/api";
import { motion, AnimatePresence } from "framer-motion";

const OFFSET_Y = 12;

const CustomInfoWindow = ({ position, children, onClose }) => {
  const containerRef = useRef(null);
  const [adjustedStyle, setAdjustedStyle] = useState({});

  // Gestion du clic dehors + ESC
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        !e.target.closest(".gm-style")
      ) {
        onClose?.();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Ajustement automatique si la bulle dépasse le viewport
  useEffect(() => {
    const adjustPosition = () => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const adjustments = {};

      if (rect.left < 8) {
        adjustments.left = "8px";
        adjustments.transform = "translateY(-100%)";
      } else if (rect.right > window.innerWidth - 8) {
        adjustments.right = "8px";
        adjustments.transform = "translateY(-100%)";
      }

      setAdjustedStyle(adjustments);
    };

    requestAnimationFrame(adjustPosition);
  }, []);

  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <AnimatePresence>
        <motion.div
          ref={containerRef}
          key="info-window"
          role="dialog"
          aria-label="Fenêtre d'information"
          aria-modal="false"
          initial={{ opacity: 0, scale: 0.85, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -10 }}
          transition={{
            duration: 0.4,
            type: "spring",
            damping: 18,
            stiffness: 220,
          }}
          style={{
            transform: "translate(-50%, -100%)",
            position: "absolute",
            zIndex: 9999,
            pointerEvents: "auto",
            top: `-${OFFSET_Y}px`,
            ...adjustedStyle,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "10px",
            boxShadow: "0 6px 30px rgba(0,0,0,0.15)",
            padding: "0px",
            minWidth: "220px",
            maxWidth: "300px",
          }}
        >
          <div className="relative px-4 py-3">{children}</div>

          {/* Triangle de bulle */}
          <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 rotate-45 w-4 h-4 bg-white border-l border-b border-gray-300 z-0" />
        </motion.div>
      </AnimatePresence>
    </OverlayView>
  );
};

export default CustomInfoWindow;
