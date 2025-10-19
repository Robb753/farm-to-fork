// components/layout/Header.jsx
"use client";
import { useEffect, useState } from "react";
import HeaderMobile from "./HeaderMobile";
import HeaderDesktop from "./HeaderDesktop";

export default function Header() {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Vérification initiale
    checkViewport();

    // Écouter les changements de taille
    window.addEventListener("resize", checkViewport);

    return () => {
      window.removeEventListener("resize", checkViewport);
    };
  }, []);

  // Afficher un état de chargement pendant l'hydratation côté client
  if (!isClient) {
    return (
      <header className="flex items-center justify-between px-6 py-3 bg-white shadow-sm border-b z-40">
        <div className="w-32 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
      </header>
    );
  }

  return isMobile ? <HeaderMobile /> : <HeaderDesktop />;
}
