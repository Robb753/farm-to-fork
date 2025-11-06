"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { COLORS, PATHS } from "@/lib/config";

/**
 * Composant tunnel de redirection pour l'inscription producteur
 * 
 * Features:
 * - Redirection intelligente selon l'état de connexion
 * - Routage basé sur le rôle utilisateur
 * - Écran de chargement pendant la vérification
 * - Configuration centralisée des chemins
 */
export default function SignupFarmerTunnel(): JSX.Element {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  /**
   * Gère la redirection selon l'état de l'utilisateur
   */
  useEffect(() => {
    if (!isLoaded) return;

    // ✅ Non connecté → redirige vers signup avec URL de retour
    if (!isSignedIn) {
      const signupUrl = `/sign-up?redirectUrl=${encodeURIComponent("/request-farmer-access")}`;
      router.push(signupUrl);
      return;
    }

    // ✅ Connecté → route selon le rôle utilisateur
    const role = user?.publicMetadata?.role as string | undefined;
    
    if (role === "farmer") {
      // Producteur confirmé → dashboard
      router.push("/dashboard/farms");
    } else if (role === "admin") {
      // Admin → dashboard admin
      router.push("/admin");
    } else {
      // Utilisateur standard ou rôle non défini → demande d'accès
      router.push("/request-farmer-access");
    }
  }, [isLoaded, isSignedIn, user, router]);

  // ✅ Écran de chargement pendant la vérification
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen px-4"
      style={{ backgroundColor: COLORS.BG_GRAY }}
    >
      <div className="text-center">
        {/* Spinner */}
        <Loader2 
          className="h-12 w-12 animate-spin mx-auto mb-4" 
          style={{ color: COLORS.PRIMARY }}
        />
        
        {/* Message de chargement */}
        <h1 
          className="text-xl font-semibold mb-2"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          Redirection en cours...
        </h1>
        
        <p 
          className="text-sm"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          Nous vérifions votre statut et vous dirigeons vers la bonne page.
        </p>
        
        {/* Indicateur de progression */}
        <div className="mt-6 w-48 mx-auto">
          <div 
            className="h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: COLORS.BORDER }}
          >
            <div 
              className="h-full rounded-full animate-pulse"
              style={{ 
                backgroundColor: COLORS.PRIMARY,
                width: "60%",
                animation: "loading 2s ease-in-out infinite",
              }}
            />
          </div>
          <p 
            className="text-xs mt-2"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            Vérification du profil...
          </p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}