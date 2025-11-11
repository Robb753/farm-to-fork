"use client"

import { COLORS } from "@/lib/config";
import React from "react";

/**
 * Composant Loading pour la page AddNewListing
 * 
 * Ce composant s'affiche pendant le chargement initial de la page.
 * Il utilise le design system Farm To Fork pour une cohérence visuelle.
 * 
 * @returns Composant de chargement stylé
 */
const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4 p-8">
        {/* Spinner animé */}
        <div 
          className="animate-spin h-12 w-12 rounded-full border-t-2 border-b-2"
          style={{ borderColor: COLORS.PRIMARY }}
          aria-label="Chargement en cours"
        />
        
        {/* Texte de chargement */}
        <p 
          className="text-lg font-medium animate-pulse"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          Chargement...
        </p>
        
        {/* Message contextuel */}
        <p 
          className="text-sm text-center max-w-xs"
          style={{ color: COLORS.TEXT_MUTED }}
        >
          Préparation de votre espace agriculteur
        </p>
      </div>
    </div>
  );
};

export default Loading;