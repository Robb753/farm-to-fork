import { COLORS } from "@/lib/config";
import React from "react";

/**
 * Composant Loading pour la page EditListing
 * 
 * Ce composant s'affiche pendant le chargement initial de la page d'édition de listing.
 * Il utilise le design system Farm To Fork pour une cohérence visuelle parfaite
 * avec des animations spécifiques au contexte d'édition.
 * 
 * @returns Composant de chargement stylé pour EditListing
 */
const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-6 p-8">
        {/* Container principal avec animation subtile */}
        <div className="relative">
          {/* Spinner principal avec effet fermier */}
          <div 
            className="animate-spin h-20 w-20 rounded-full border-t-4 border-b-4"
            style={{ 
              borderColor: COLORS.PRIMARY,
              borderTopColor: "transparent",
            }}
            aria-label="Chargement de l'édition en cours"
          />
          
          {/* Cercle intérieur avec rotation inversée */}
          <div 
            className="absolute top-3 left-3 animate-spin h-14 w-14 rounded-full border-r-3"
            style={{ 
              borderColor: COLORS.SUCCESS + "40",
              borderRightColor: "transparent",
              animationDirection: "reverse",
              animationDuration: "2s",
            }}
            aria-hidden="true"
          />
          
          {/* Icône centrale */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl"
            style={{ color: COLORS.PRIMARY }}
          >
            🚜
          </div>
        </div>
        
        {/* Texte de chargement contextuel */}
        <div className="text-center space-y-3">
          <h2 
            className="text-2xl font-bold animate-pulse"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Chargement de votre ferme...
          </h2>
          
          <p 
            className="text-base max-w-sm leading-relaxed"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Préparation de l'interface d'édition de votre listing
          </p>
        </div>
        
        {/* Indicateurs de progression avec délais */}
        <div className="flex items-center gap-3">
          <div 
            className="w-3 h-3 rounded-full animate-bounce"
            style={{ 
              backgroundColor: COLORS.PRIMARY,
              animationDelay: "0ms",
            }}
          />
          <div 
            className="w-3 h-3 rounded-full animate-bounce"
            style={{ 
              backgroundColor: COLORS.SUCCESS,
              animationDelay: "200ms",
            }}
          />
          <div 
            className="w-3 h-3 rounded-full animate-bounce"
            style={{ 
              backgroundColor: COLORS.WARNING,
              animationDelay: "400ms",
            }}
          />
        </div>
        
        {/* Étapes de chargement simulées */}
        <div className="space-y-2 text-center">
          <div 
            className="flex items-center gap-2 text-sm animate-pulse"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.SUCCESS }}>
              ✓
            </span>
            Chargement des informations de base
          </div>
          <div 
            className="flex items-center gap-2 text-sm animate-pulse"
            style={{ 
              color: COLORS.TEXT_MUTED,
              animationDelay: "1s",
            }}
          >
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.WARNING }}>
              ⟳
            </span>
            Récupération des produits et services
          </div>
          <div 
            className="flex items-center gap-2 text-sm opacity-50"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            <span className="w-4 h-4 rounded-full border-2" style={{ borderColor: COLORS.BORDER }}>
              ○
            </span>
            Préparation des images et médias
          </div>
        </div>
        
        {/* Message d'encouragement pour l'édition */}
        <div 
          className="mt-6 p-4 rounded-xl border max-w-md text-center"
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderColor: COLORS.PRIMARY + "20",
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg">📝</span>
            <h3 
              className="font-semibold"
              style={{ color: COLORS.PRIMARY }}
            >
              Conseils d'édition
            </h3>
          </div>
          <p 
            className="text-sm leading-relaxed"
            style={{ color: COLORS.PRIMARY }}
          >
            Pensez à mettre à jour vos photos saisonnières et vos disponibilités produits !
          </p>
        </div>
        
        {/* Barre de progression subtile */}
        <div 
          className="w-64 h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: COLORS.BG_GRAY }}
        >
          <div 
            className="h-full rounded-full animate-pulse"
            style={{ 
              backgroundColor: COLORS.PRIMARY,
              width: "70%",
              animation: "progress 3s ease-in-out infinite",
            }}
          />
        </div>
      </div>
      
      {/* CSS pour l'animation de la barre de progression */}
      <style jsx>{`
        @keyframes progress {
          0% { width: 20%; }
          50% { width: 80%; }
          100% { width: 20%; }
        }
      `}</style>
    </div>
  );
};

export default Loading;