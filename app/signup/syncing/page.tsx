"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/userStore";
import { COLORS, PATHS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Page de synchronisation après inscription
 *
 * Features:
 * - Synchronisation du profil utilisateur avec le store
 * - Redirection automatique selon le rôle
 * - Interface de chargement avec compteur visuel
 * - Configuration centralisée des couleurs
 */
export default function SignupSyncingPage(): JSX.Element {
  const router = useRouter();

  // ✅ Extraction des données nécessaires depuis le store
  const { role, isReady } = useUserStore((state) => ({
    role: state.role,
    isReady: state.isReady,
  }));

  // ✅ Helpers dérivés localement avec types
  const isFarmer = role === "farmer";
  const isUser = role === "user";
  const isAdmin = role === "admin";

  const [tries, setTries] = useState<number>(1);
  const hasRedirectedRef = useRef<boolean>(false);

  // ✅ Message calculé depuis le rôle et les tentatives
  const syncStatus = isReady
    ? isFarmer
      ? "Redirection vers votre dashboard..."
      : isAdmin
        ? "Redirection vers l'administration..."
        : isUser
          ? "Redirection vers l'accueil..."
          : "Redirection..."
    : tries <= 3
      ? "Synchronisation du profil..."
      : tries <= 6
        ? "Vérification des permissions..."
        : tries <= 9
          ? "Finalisation des paramètres..."
          : "Dernière vérification...";

  /**
   * Gère les redirections quand la synchronisation est prête
   */
  useEffect(() => {
    if (!isReady || hasRedirectedRef.current) return;

    hasRedirectedRef.current = true;
    let timeoutId: NodeJS.Timeout | null = null;

    // ✅ Redirection selon le rôle avec chemins configurés
    if (isFarmer) {
      timeoutId = setTimeout(() => router.replace("/dashboard/farms"), 500);
    } else if (isAdmin) {
      timeoutId = setTimeout(() => router.replace("/admin"), 500);
    } else if (isUser) {
      timeoutId = setTimeout(() => router.replace(PATHS.HOME), 500);
    } else {
      // Fallback si rôle non reconnu
      timeoutId = setTimeout(() => router.replace(PATHS.HOME), 500);
    }

    // ✅ Cleanup: Clear timeout if component unmounts before navigation
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isReady, isFarmer, isUser, isAdmin, router]);

  /**
   * Compteur visuel de tentatives (limité à 10)
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setTries((prev) => (prev < 10 ? prev + 1 : prev));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: COLORS.BG_GRAY }}
    >
      <div className="text-center space-y-6 max-w-md w-full">
        {/* ✅ Spinner amélioré */}
        <div className="relative">
          <div
            className={cn(
              "animate-spin rounded-full h-16 w-16 border-4",
              "border-t-transparent mx-auto"
            )}
            style={{
              borderColor: `${COLORS.PRIMARY} ${COLORS.PRIMARY} ${COLORS.PRIMARY} transparent`,
            }}
          />
          <div
            className="absolute inset-0 rounded-full h-16 w-16 border-2 border-dashed mx-auto animate-pulse"
            style={{ borderColor: `${COLORS.PRIMARY}40` }}
          />
        </div>

        {/* ✅ Titre principal */}
        <h1
          className="text-2xl font-semibold"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          Finalisation de votre inscription...
        </h1>

        {/* ✅ Message de statut dynamique calculé */}
        <p className="text-lg" style={{ color: COLORS.TEXT_SECONDARY }}>
          {syncStatus}
        </p>

        {/* ✅ Barre de progression */}
        <div className="w-full max-w-xs mx-auto">
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: COLORS.BORDER }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                backgroundColor: COLORS.PRIMARY,
                width: `${Math.min((tries / 10) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span style={{ color: COLORS.TEXT_MUTED }}>Étape {tries}/10</span>
            <span style={{ color: COLORS.TEXT_MUTED }}>
              {Math.min((tries / 10) * 100, 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* ✅ Informations complémentaires */}
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderColor: `${COLORS.PRIMARY}20`,
          }}
        >
          <h3 className="font-medium mb-2" style={{ color: COLORS.PRIMARY }}>
            🔄 Que se passe-t-il ?
          </h3>
          <ul
            className="text-sm space-y-1 text-left"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            <li>• Synchronisation de votre profil</li>
            <li>• Configuration de vos permissions</li>
            <li>• Préparation de votre espace personnel</li>
          </ul>
        </div>

        {/* ✅ Message de patience si ça prend du temps */}
        {tries >= 8 && (
          <div
            className="p-3 rounded-lg border animate-in fade-in duration-500"
            style={{
              backgroundColor: `${COLORS.WARNING}10`,
              borderColor: `${COLORS.WARNING}30`,
            }}
          >
            <p className="text-sm" style={{ color: COLORS.WARNING }}>
              ⏳ La synchronisation prend plus de temps que prévu. Cela peut
              arriver lors des premiers accès.
            </p>
          </div>
        )}

        {/* ✅ Fallback après 10 tentatives */}
        {tries >= 10 && (
          <div
            className="p-4 rounded-lg border animate-in slide-in-from-bottom-4 duration-500"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
          >
            <h4
              className="font-medium mb-2"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              🤔 Synchronisation longue ?
            </h4>
            <p
              className="text-sm mb-3"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Si cette page ne se met pas à jour, vous pouvez continuer
              manuellement.
            </p>
            <button
              onClick={() => router.push(PATHS.HOME)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm",
                "transition-all duration-200 hover:shadow-sm",
                "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              )}
              style={{
                backgroundColor: COLORS.PRIMARY,
                color: COLORS.BG_WHITE,
              }}
            >
              Continuer vers l'accueil
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
