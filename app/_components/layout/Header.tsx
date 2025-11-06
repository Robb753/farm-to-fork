"use client";

import { useEffect, useState } from "react";
import HeaderMobile from "./HeaderMobile";
import HeaderDesktop from "./HeaderDesktop";

/**
 * Interfaces TypeScript pour le Header
 */
interface HeaderProps {
  /** Afficher la barre de recherche dans le header */
  showSearchInHeader?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Hook simple pour la détection mobile
 */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return { isMobile, mounted };
};

/**
 * Composant Header principal de Farm To Fork
 *
 * Version simplifiée qui évite les problèmes de rendu et les conflits.
 * Focus sur la robustesse et la simplicité.
 */
export default function Header({
  showSearchInHeader = true,
  className = "",
}: HeaderProps): JSX.Element {
  const { isMobile, mounted } = useIsMobile();

  // Pendant l'hydratation, afficher un header de base
  if (!mounted) {
    return (
      <header
        className={`flex items-center justify-between px-4 md:px-6 py-3 bg-white border-b border-gray-200 shadow-sm ${className}`}
        style={{ zIndex: 40 }}
      >
        {/* Logo simple */}
        <div className="flex items-center">
          <span className="text-xl font-bold text-green-600">Farm To Fork</span>
        </div>

        {/* Navigation simple */}
        <div className="hidden md:flex items-center space-x-6">
          <span className="text-gray-600">Explorer</span>
          <span className="text-gray-600">Producteurs</span>
          <span className="text-gray-600">Produits</span>
        </div>

        {/* Actions simples */}
        <div className="flex items-center space-x-3">
          <button className="text-green-600 hover:text-green-700">
            Se connecter
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700">
            S'inscrire
          </button>
        </div>
      </header>
    );
  }

  // Une fois monté, afficher le header approprié
  try {
    if (isMobile) {
      return (
        <HeaderMobile
          showSearchInHeader={showSearchInHeader}
          className={className}
        />
      );
    } else {
      return (
        <HeaderDesktop
          showSearchInHeader={showSearchInHeader}
          className={className}
        />
      );
    }
  } catch (error) {
    console.error("Erreur Header:", error);

    // Fallback robuste
    return (
      <header
        className={`flex items-center justify-between px-4 md:px-6 py-3 bg-white border-b border-gray-200 shadow-sm ${className}`}
        style={{ zIndex: 40 }}
      >
        <div className="flex items-center">
          <span className="text-xl font-bold text-green-600">Farm To Fork</span>
        </div>
        <div className="text-gray-500 text-sm">Chargement...</div>
      </header>
    );
  }
}

export type { HeaderProps };
