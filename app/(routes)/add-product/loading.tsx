"use client"

import { COLORS } from "@/lib/config";
import React from "react";

/**
 * Composant Loading pour la page AddProduct
 * 
 * Ce composant s'affiche pendant le chargement initial de la page d'ajout de produit.
 * Il utilise le design system Farm To Fork pour une cohérence visuelle parfaite.
 * 
 * @returns Composant de chargement stylé pour AddProduct
 */
const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-6 p-8">
        {/* Container avec animation subtile */}
        <div className="relative">
          {/* Spinner principal */}
          <div 
            className="animate-spin h-16 w-16 rounded-full border-t-3 border-b-3"
            style={{ 
              borderColor: COLORS.PRIMARY,
              borderTopColor: "transparent",
            }}
            aria-label="Chargement en cours"
          />
          
          {/* Spinner secondaire pour effet layered */}
          <div 
            className="absolute top-2 left-2 animate-spin h-12 w-12 rounded-full border-t-2"
            style={{ 
              borderColor: COLORS.SUCCESS + "40",
              borderTopColor: "transparent",
              animationDirection: "reverse",
              animationDuration: "1.5s",
            }}
            aria-hidden="true"
          />
        </div>
        
        {/* Texte de chargement principal */}
        <div className="text-center space-y-2">
          <h2 
            className="text-xl font-semibold animate-pulse"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Chargement du formulaire...
          </h2>
          
          <p 
            className="text-sm max-w-xs leading-relaxed"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Préparation de l'interface d'ajout de produit
          </p>
        </div>
        
        {/* Indicateurs de progression */}
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ 
              backgroundColor: COLORS.PRIMARY,
              animationDelay: "0ms",
            }}
          />
          <div 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ 
              backgroundColor: COLORS.PRIMARY,
              animationDelay: "150ms",
            }}
          />
          <div 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ 
              backgroundColor: COLORS.PRIMARY,
              animationDelay: "300ms",
            }}
          />
        </div>
        
        {/* Message contextuel */}
        <div 
          className="mt-4 p-3 rounded-lg border max-w-sm text-center"
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderColor: COLORS.PRIMARY + "20",
          }}
        >
          <p 
            className="text-xs font-medium"
            style={{ color: COLORS.PRIMARY }}
          >
            💡 Conseil : Préparez les détails de votre produit pendant le chargement
          </p>
        </div>
      </div>
    </div>
  );
};

export default Loading;