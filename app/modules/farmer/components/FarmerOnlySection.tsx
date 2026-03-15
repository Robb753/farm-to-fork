"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import useUserRole from "@/app/modules/hooks/useUserRole";
import { useClerk } from "@clerk/nextjs";
import { COLORS, PATHS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Interface pour les props du composant
 */
interface FarmerOnlySectionProps {
  children: React.ReactNode;
}

/**
 * Composant de protection d'accès pour les producteurs
 * 
 * Features:
 * - Contrôle d'accès basé sur le rôle (farmer/admin)
 * - États de chargement et non-connecté
 * - Actions de connexion/inscription contextuelle
 * - Messages informatifs selon le statut utilisateur
 * - Configuration centralisée des couleurs
 */
export default function FarmerOnlySection({ children }: FarmerOnlySectionProps): JSX.Element {
  const { role, isFarmer, isAdmin, loading, user } = useUserRole();
  const { openSignIn, openSignUp } = useClerk();

  /**
   * État de chargement avec skeleton
   */
  if (loading) {
    return (
      <div 
        className={cn(
          "rounded-xl border p-6 shadow-sm animate-pulse",
          "transition-all duration-200"
        )}
        style={{
          backgroundColor: COLORS.BG_WHITE,
          borderColor: COLORS.BORDER,
        }}
      >
        <div 
          className="h-5 w-40 rounded mb-3"
          style={{ backgroundColor: COLORS.BG_GRAY }}
        />
        <div 
          className="h-4 w-3/5 rounded mb-3"
          style={{ backgroundColor: COLORS.BG_GRAY }}
        />
        <div 
          className="h-4 w-1/2 rounded"
          style={{ backgroundColor: COLORS.BG_GRAY }}
        />
      </div>
    );
  }

  /**
   * Utilisateur non connecté - Invitation à se connecter
   */
  if (!user) {
    return (
      <div 
        className={cn(
          "rounded-xl border p-6 shadow-sm",
          "transition-all duration-200 hover:shadow-md"
        )}
        style={{
          backgroundColor: COLORS.BG_WHITE,
          borderColor: COLORS.BORDER,
        }}
      >
        <div className="text-center space-y-4">
          <div>
            <h3 
              className="text-lg font-semibold mb-2"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              🚜 Espace producteur
            </h3>
            <p style={{ color: COLORS.TEXT_SECONDARY }}>
              Connecte-toi pour accéder à ton tableau de bord producteur et 
              gérer tes fermes, produits et commandes.
            </p>
          </div>
          
          <div 
            className="p-3 rounded-lg border"
            style={{
              backgroundColor: COLORS.PRIMARY_BG,
              borderColor: `${COLORS.PRIMARY}30`,
            }}
          >
            <p 
              className="text-sm"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              💡 <strong>Nouveau producteur ?</strong> Créez votre compte pour
              rejoindre notre réseau de fermes locales.
            </p>
          </div>
          
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => openSignIn({ 
                redirectUrl: "/dashboard/farms",
                appearance: {
                  variables: {
                    colorPrimary: COLORS.PRIMARY,
                  }
                }
              })}
              className={cn(
                "transition-all duration-200 hover:shadow-sm",
                "focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              )}
              style={{
                backgroundColor: COLORS.PRIMARY,
                color: COLORS.BG_WHITE,
              }}
            >
              Se connecter
            </Button>
            <Button
              variant="outline"
              onClick={() => openSignUp({
                redirectUrl: "/become-producer",
                appearance: {
                  variables: {
                    colorPrimary: COLORS.PRIMARY,
                  }
                }
              })}
              className={cn(
                "transition-all duration-200 hover:shadow-sm",
                "focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              )}
              style={{
                borderColor: COLORS.PRIMARY,
                color: COLORS.PRIMARY,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY_BG;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Créer un compte
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Utilisateur connecté mais sans permissions producteur
   */
  if (!(isFarmer || isAdmin)) {
    return (
      <div 
        className={cn(
          "rounded-xl border p-6",
          "transition-all duration-200"
        )}
        style={{
          backgroundColor: `${COLORS.WARNING}10`,
          borderColor: `${COLORS.WARNING}40`,
        }}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: `${COLORS.WARNING}20`,
                color: COLORS.WARNING,
              }}
            >
              🔒
            </div>
          </div>
          
          <div className="flex-1">
            <h3 
              className="font-semibold mb-2"
              style={{ color: COLORS.WARNING }}
            >
              Accès producteur requis
            </h3>
            <p 
              className="mb-4"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Cet espace est réservé aux producteurs certifiés. 
              Ton rôle actuel : <strong>{role ?? "utilisateur"}</strong>
            </p>
            
            <div 
              className="p-3 rounded-lg border mb-4"
              style={{
                backgroundColor: COLORS.BG_WHITE,
                borderColor: COLORS.BORDER,
              }}
            >
              <h4 
                className="font-medium mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                🌱 Comment devenir producteur ?
              </h4>
              <ul 
                className="text-sm space-y-1"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                <li>• Demandez l'accès producteur via notre formulaire</li>
                <li>• Notre équipe vérifiera votre exploitation</li>
                <li>• Validation sous 48h en moyenne</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => window.location.href = "/become-producer"}
                size="sm"
                className={cn(
                  "transition-all duration-200 hover:shadow-sm",
                  "focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                )}
                style={{
                  backgroundColor: COLORS.PRIMARY,
                  color: COLORS.BG_WHITE,
                }}
              >
                Demander l'accès producteur
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = PATHS.HOME}
                className={cn(
                  "transition-all duration-200",
                  "focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                )}
                style={{ color: COLORS.TEXT_MUTED }}
              >
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Accès autorisé - Afficher le contenu
   */
  return <>{children}</>;
}