"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { TABLES } from "@/lib/config";
import { useSupabaseWithClerk } from "@/utils/supabase/client";

/**
 * Types pour les rôles utilisateur
 */
export type UserRole = "user" | "farmer" | "admin";

/**
 * Interface pour les flags de rôle
 */
interface RoleFlags {
  isUser: boolean;
  isFarmer: boolean;
  isAdmin: boolean;
}

/**
 * Interface pour la valeur de retour du hook
 */
interface UseUserRoleReturn extends RoleFlags {
  role: UserRole | null;
  loading: boolean;
  error: Error | null;
  user: ReturnType<typeof useUser>["user"];
  // ✅ Flags supplémentaires
  canAccessFarmerFeatures: boolean;
  canAccessAdminFeatures: boolean;
  isAuthenticated: boolean;
  hasElevatedRole: boolean;
}

/**
 * Interface pour les données de profil depuis Supabase
 */
interface ProfileData {
  role: UserRole;
}

/**
 * Hook personnalisé pour gérer les rôles utilisateur
 *
 * Features:
 * - Récupération du rôle depuis Supabase
 * - Synchronisation avec l'état de connexion Clerk
 * - Flags de rôle calculés automatiquement
 * - Gestion d'erreurs robuste
 * - Nettoyage automatique des états
 * - Configuration centralisée des tables
 */
export default function useUserRole(): UseUserRoleReturn {
  const { user, isLoaded } = useUser();

  const supabase = useSupabaseWithClerk();

  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Effet principal pour récupérer et synchroniser le rôle utilisateur
   */
  useEffect(() => {
    let isMounted = true;

    const fetchUserRole = async (): Promise<void> => {
      // ✅ Attendre que Clerk soit chargé
      if (!isLoaded) return;

      // ✅ Utilisateur déconnecté
      if (!user) {
        if (isMounted) {
          setRole(null);
          setError(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // ✅ Récupération de l'email principal
        const email = user.primaryEmailAddress?.emailAddress;
        if (!email) {
          throw new Error("Aucune adresse e-mail trouvée dans le profil Clerk");
        }

        // ✅ Requête Supabase avec table configurée
        const { data, error: supabaseError } = await supabase
          .from(TABLES.PROFILES || "profiles")
          .select("role")
          .eq("email", email)
          .maybeSingle();

        if (supabaseError) {
          console.error(
            "Erreur Supabase lors de la récupération du rôle:",
            supabaseError
          );
          throw new Error(
            `Erreur de base de données: ${supabaseError.message}`
          );
        }

        // ✅ Définition du rôle avec fallback
        const userRole: UserRole = (data as ProfileData)?.role ?? "user";

        if (isMounted) {
          setRole(userRole);
        }
      } catch (err) {
        console.error(
          "Erreur lors de la récupération du rôle utilisateur:",
          err
        );

        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Erreur inconnue"));
          // ✅ En cas d'erreur, définir un rôle par défaut
          setRole("user");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserRole();

    // ✅ Cleanup function pour éviter les fuites mémoire
    return () => {
      isMounted = false;
    };
  }, [isLoaded, user, supabase]);

  /**
   * Flags de rôle calculés de manière optimisée
   */
  const roleFlags: RoleFlags = useMemo(
    () => ({
      isUser: role === "user",
      isFarmer: role === "farmer",
      isAdmin: role === "admin",
    }),
    [role]
  );

  /**
   * Flags supplémentaires pour des vérifications courantes
   */
  const additionalFlags = useMemo(
    () => ({
      // ✅ Peut accéder aux fonctionnalités producteur
      canAccessFarmerFeatures: role === "farmer" || role === "admin",
      // ✅ Peut accéder aux fonctionnalités admin
      canAccessAdminFeatures: role === "admin",
      // ✅ Est authentifié
      isAuthenticated: !!user && !!role,
      // ✅ A un rôle privilégié
      hasElevatedRole: role === "farmer" || role === "admin",
    }),
    [role, user]
  );

  return {
    role,
    ...roleFlags,
    ...additionalFlags,
    loading,
    error,
    user,
  };
}

/**
 * Hook utilitaire pour vérifier rapidement les permissions
 */
export function usePermissions() {
  const {
    role,
    canAccessFarmerFeatures,
    canAccessAdminFeatures,
    isAuthenticated,
  } = useUserRole();

  return {
    // ✅ Vérifications de permissions rapides
    canManageFarms: canAccessFarmerFeatures,
    canManageUsers: canAccessAdminFeatures,
    canAccessDashboard: isAuthenticated,
    canCreateListings: canAccessFarmerFeatures,
    canModerateContent: canAccessAdminFeatures,

    // ✅ Rôle actuel
    currentRole: role,

    // ✅ Vérifications de rôle spécifiques
    isUser: role === "user",
    isFarmer: role === "farmer",
    isAdmin: role === "admin",
  };
}

/**
 * Hook pour les redirections basées sur les rôles
 */
export function useRoleRedirects() {
  const { role, loading, isAuthenticated } = useUserRole();

  const getDefaultRoute = (): string => {
    if (!isAuthenticated) return "/";

    switch (role) {
      case "admin":
        return "/admin";
      case "farmer":
        return "/dashboard/farms";
      case "user":
      default:
        return "/";
    }
  };

  const getAccessibleRoutes = (): string[] => {
    const baseRoutes = ["/", "/search", "/about"];

    if (!isAuthenticated) return baseRoutes;

    const authenticatedRoutes = [...baseRoutes, "/profile", "/favorites"];

    if (role === "farmer" || role === "admin") {
      authenticatedRoutes.push(
        "/dashboard",
        "/dashboard/farms",
        "/dashboard/products"
      );
    }

    if (role === "admin") {
      authenticatedRoutes.push("/admin", "/admin/users", "/admin/moderation");
    }

    return authenticatedRoutes;
  };

  return {
    getDefaultRoute,
    getAccessibleRoutes,
    loading,
  };
}
