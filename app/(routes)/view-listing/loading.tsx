"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Composant de chargement pour les pages de listing
 * 
 * Affiche un indicateur de chargement moderne avec :
 * - Animation fluide et accessible
 * - Design cohérent avec le thème Farm To Fork
 * - Messages contextuels pour l'utilisateur
 * - Optimisation pour tous les appareils
 * 
 * @returns JSX.Element - Interface de chargement optimisée
 */
export default function LoadingPage(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 px-4">
      
      {/* Conteneur principal avec effet de carte */}
      <div className="text-center space-y-8 max-w-sm mx-auto">
        
        {/* Animation de chargement principale */}
        <div className="relative">
          {/* Spinner externe */}
          <div className={cn(
            "animate-spin rounded-full h-20 w-20 mx-auto",
            "border-4 border-green-200 border-t-green-600",
            "drop-shadow-sm"
          )} />
          
          {/* Spinner interne pour effet double */}
          <div className={cn(
            "absolute inset-0 animate-spin rounded-full h-20 w-20 mx-auto",
            "border-2 border-transparent border-b-green-400",
            "animation-delay-150"
          )} />
          
          {/* Icône centrale */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse">
              🌱
            </div>
          </div>
        </div>

        {/* Messages de chargement */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-800 animate-pulse">
            Chargement de la ferme
          </h2>
          
          <p className="text-gray-600 text-sm leading-relaxed">
            Nous préparons toutes les informations sur cette ferme locale...
          </p>
          
          {/* Barre de progression simulée */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className={cn(
              "h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full",
              "animate-pulse"
            )} style={{ width: "60%" }} />
          </div>
        </div>

        {/* Messages d'information */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-100 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="animate-pulse">💡</div>
            <p>
              <strong>Le saviez-vous ?</strong> Nos fermes partenaires proposent 
              plus de 150 produits locaux différents !
            </p>
          </div>
        </div>
      </div>

      {/* Loading dots en bas */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 bg-green-500 rounded-full animate-bounce",
                `animation-delay-${i * 100}`
              )}
              style={{
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}