"use client";

import React, { useEffect, useRef } from "react";
import { OverlayView } from "@react-google-maps/api";
import { motion, AnimatePresence } from "framer-motion";

const CustomInfoWindow = ({ position, children, onClose }) => {
  const containerRef = useRef(null);

  const offsetY = 12;

  const containerStyle = {
    transform: "translate(-50%, -100%)",
    position: "absolute",
    zIndex: 9999,
    pointerEvents: "auto",
    top: `-${offsetY}px`,
  };

  // 👇 Gestion du clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        !event.target.closest(".gm-style") // ignore les clics sur la map native
      ) {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <AnimatePresence>
        <motion.div
          ref={containerRef}
          key="info-window"
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{
            duration: 0.5,
            type: "spring",
            damping: 20,
            stiffness: 200,
          }}
          style={{
            ...containerStyle,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
            padding: "0px",
            minWidth: "200px",
            maxWidth: "280px",
          }}
        >
          <div className="relative">{children}</div>
        </motion.div>
      </AnimatePresence>
    </OverlayView>
  );
};

export default CustomInfoWindow;
