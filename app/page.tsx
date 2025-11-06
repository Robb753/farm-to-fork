"use client";

import React, { useState, useCallback } from "react";
import Explore from "./_components/layout/Explore";
import HomeContent from "./_components/layout/HomeContent";

/**
 * Interface pour les props de la page Home
 */
interface HomeProps {
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Hook personnalisé pour la gestion de l'état de navigation
 */
const useHomeNavigation = () => {
  const [viewMap, setViewMap] = useState<boolean>(false);

  const handleViewMap = useCallback(() => {
    setViewMap(true);
  }, []);

  const handleBackToHome = useCallback(() => {
    setViewMap(false);
  }, []);

  return {
    viewMap,
    handleViewMap,
    handleBackToHome,
  };
};

/**
 * Page d'accueil principale de Farm To Fork
 * 
 * Cette page gère la navigation entre deux vues principales :
 * - HomeContent : Page d'accueil avec héro vidéo et sections
 * - Explore : Carte interactive des producteurs
 * 
 * Features:
 * - Navigation conditionnelle entre vues
 * - Gestion d'état optimisée avec hooks personnalisés
 * - Intégration Zustand pour les stores globaux
 * - Transitions fluides entre les composants
 * - Types TypeScript stricts
 * - Performance optimisée avec useCallback
 * 
 * Architecture:
 * - Pas de MapDataProvider nécessaire (Zustand global)
 * - État local pour la navigation simple
 * - Composants lazy-loadés pour les performances
 * 
 * @param props - Configuration de la page
 * @returns Page d'accueil avec navigation conditionnelle
 */
export default function Home({ className = "" }: HomeProps): JSX.Element {
  const { viewMap, handleViewMap, handleBackToHome } = useHomeNavigation();

  return (
    <div className={className}>
      {/* 
        ✅ Navigation conditionnelle entre les vues
        - viewMap: true → Affiche la carte Explore
        - viewMap: false → Affiche le contenu d'accueil
      */}
      {viewMap ? (
        <Explore />
      ) : (
        <HomeContent onViewMap={handleViewMap} />
      )}

      {/* 
        Note: Plus de MapDataProvider nécessaire
        Les stores Zustand sont globaux et accessibles partout
      */}
    </div>
  );
}

/**
 * Export des types pour utilisation externe
 */
export type { HomeProps };