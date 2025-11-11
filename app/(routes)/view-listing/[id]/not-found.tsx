// app/(routes)/view-listing/[id]/not-found.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "@/utils/icons";
import { cn } from "@/lib/utils";

/**
 * Page 404 personnalisée pour les listings non trouvés
 * 
 * Features:
 * - Design moderne avec animations
 * - Actions multiples pour rediriger l'utilisateur
 * - Message contextuel spécifique aux fermes
 * - Auto-redirection optionnelle
 * - Responsive et accessible
 * 
 * @returns JSX.Element - Page 404 optimisée
 */
export default function NotFoundPage(): JSX.Element {
  const [countdown, setCountdown] = useState<number>(10);
  const [autoRedirect, setAutoRedirect] = useState<boolean>(true);

  /**
   * Gère le compte à rebours pour auto-redirection
   */
  useEffect(() => {
    if (!autoRedirect || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          window.location.href = "/explore";
          return 0;
        }
        return prev - 1;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [autoRedirect, countdown]);

  /**
   * Annule l'auto-redirection
   */
  const handleCancelRedirect = (): void => {
    setAutoRedirect(false);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-8 max-w-2xl mx-auto">
        
        {/* Animation d'erreur */}
        <div className="relative">
          <div className={cn(
            "text-8xl md:text-9xl font-bold",
            "bg-gradient-to-r from-red-400 to-red-600",
            "bg-clip-text text-transparent",
            "animate-pulse"
          )}>
            404
          </div>
          <div className="absolute -top-4 -right-4 text-4xl animate-bounce">
            🏚️
          </div>
        </div>

        {/* Message principal */}
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Oups ! Cette ferme est introuvable
          </h1>
          
          <p className="text-lg text-gray-600 leading-relaxed">
            Il semblerait que cette ferme n'existe plus, n'est pas encore publiée, 
            ou que le lien que vous avez suivi soit obsolète.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
            <p className="text-sm">
              <strong>💡 Le saviez-vous ?</strong> Les producteurs peuvent temporairement 
              désactiver leurs listings pour mise à jour ou en cas d'indisponibilité saisonnière.
            </p>
          </div>
        </div>

        {/* Actions principales */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/explore">
            <Button 
              size="lg" 
              className="w-full sm:w-auto group hover:shadow-lg transition-all duration-200"
            >
              <Search className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              Explorer les fermes
            </Button>
          </Link>

          <Link href="/">
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto group"
            >
              <Home className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              Retour à l'accueil
            </Button>
          </Link>

          <Button 
            variant="ghost" 
            size="lg" 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
            Page précédente
          </Button>
        </div>

        {/* Suggestions alternatives */}
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">
            Que souhaitez-vous faire ?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <Link 
              href="/explore"
              className="group p-3 bg-white rounded-md border hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="font-medium text-gray-900 group-hover:text-green-700">
                🗺️ Découvrir des fermes
              </div>
              <div className="text-gray-500 group-hover:text-green-600">
                Parcourez notre carte interactive
              </div>
            </Link>

            <Link 
              href="/explore?filter=bio"
              className="group p-3 bg-white rounded-md border hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="font-medium text-gray-900 group-hover:text-green-700">
                🌱 Produits bio
              </div>
              <div className="text-gray-500 group-hover:text-green-600">
                Trouvez des fermes certifiées bio
              </div>
            </Link>

            <Link 
              href="/explore?filter=local"
              className="group p-3 bg-white rounded-md border hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="font-medium text-gray-900 group-hover:text-green-700">
                📍 Producteurs locaux
              </div>
              <div className="text-gray-500 group-hover:text-green-600">
                Près de chez vous
              </div>
            </Link>
          </div>
        </div>

        {/* Auto-redirection */}
        {autoRedirect && countdown > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <p className="text-blue-800 text-sm">
              <strong>Redirection automatique</strong> vers l'exploration des fermes dans{" "}
              <span className="font-mono font-bold text-lg text-blue-600">
                {countdown}
              </span>{" "}
              seconde{countdown > 1 ? "s" : ""}
            </p>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancelRedirect}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              Annuler la redirection
            </Button>
          </div>
        )}

        {/* Message d'aide */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>
            Si vous pensez qu'il s'agit d'une erreur, contactez-nous à{" "}
            <a 
              href="mailto:support@farmtofork.fr" 
              className="text-blue-500 hover:underline"
            >
              support@farmtofork.fr
            </a>
          </p>
          <p>Référence d'erreur: FARM_NOT_FOUND_{new Date().getTime()}</p>
        </div>
      </div>
    </div>
  );
}