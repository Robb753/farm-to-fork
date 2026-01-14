import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Middleware TypeScript sécurisé pour Farm2Fork - Next.js 15 compatible
 *
 * Features:
 * - Sécurité maximale avec vérification des rôles
 * - Protection dashboard (utilisateurs connectés uniquement)
 * - Protection admin (administrateurs uniquement)
 * - Protection profile (propriétaire uniquement)
 * - Types TypeScript complets
 * - Gestion appropriée de l'authentification Clerk
 */

// ==================== TYPE DEFINITIONS ====================
/**
 * Interface pour les métadonnées publiques Clerk
 */
interface ClerkPublicMetadata {
  role?: "admin" | "farmer" | "user";
  isAdmin?: boolean;
}

/**
 * Interface pour les métadonnées privées Clerk
 */
interface ClerkMetadata {
  role?: "admin" | "farmer" | "user";
  isAdmin?: boolean;
}

/**
 * Interface pour les claims de session Clerk
 */
interface ClerkSessionClaims {
  metadata?: ClerkMetadata;
  publicMetadata?: ClerkPublicMetadata;
  [key: string]: unknown;
}

// ==================== MATCHERS DE ROUTES ====================
const isPublicRoute = createRouteMatcher([
  "/", // Page d'accueil
  "/explore(.*)", // Exploration des producteurs (lecture seule)
  // "/view-listing(.*)", // ✅ RETIRÉ: Maintenant privé (utilisateurs connectés uniquement)
  "/legal(.*)", // Pages légales
  "/sign-in(.*)", // Pages de connexion
  "/sign-up(.*)", // Pages d'inscription
  "/api/public(.*)", // APIs publiques
  "/api/webhooks(.*)", // Webhooks (Clerk, Stripe, etc.)
  "/api/auth(.*)", // ✅ AJOUT: APIs d'authentification (éviter les boucles)
  "/api/onboarding(.*)", // ✅ NOUVEAU: APIs onboarding (pour les tests)
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
const isProfileRoute = createRouteMatcher(["/profile(.*)"]);

// ==================== CONFIGURATION SÉCURITÉ RENFORCÉE ====================
export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const { pathname } = req.nextUrl;

  // ==================== ROUTES PUBLIQUES ====================
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // ==================== GESTION UTILISATEUR NON CONNECTÉ ====================
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // ==================== PROTECTION ROUTES ADMIN ====================
  if (isAdminRoute(req)) {
    try {
      // ✅ Vérifier le rôle admin directement depuis sessionClaims avec typage sécurisé
      const metadata = sessionClaims as ClerkSessionClaims;
      const userRole =
        metadata?.metadata?.role || metadata?.publicMetadata?.role;
      const isAdmin =
        userRole === "admin" ||
        metadata?.metadata?.isAdmin ||
        metadata?.publicMetadata?.isAdmin;

      if (!isAdmin) {
        // Rediriger vers dashboard avec message d'erreur
        const dashboardUrl = new URL("/dashboard", req.url);
        dashboardUrl.searchParams.set("error", "admin_access_required");
        return NextResponse.redirect(dashboardUrl);
      }

      return NextResponse.next();
    } catch (error) {
      console.error("Erreur vérification admin:", error);

      // En cas d'erreur, refuser l'accès par sécurité
      const dashboardUrl = new URL("/dashboard", req.url);
      dashboardUrl.searchParams.set("error", "admin_check_failed");
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // ==================== PROTECTION ROUTES PROFILE ====================
  if (isProfileRoute(req)) {
    // Extraire l'ID du profil depuis l'URL: /profile/[userId]
    const profileUserId = pathname.split("/profile/")[1]?.split("/")[0];

    if (profileUserId && profileUserId !== userId) {
      // Rediriger vers son propre profil
      const ownProfileUrl = new URL(`/profile/${userId}`, req.url);
      return NextResponse.redirect(ownProfileUrl);
    }

    return NextResponse.next();
  }

  // ==================== PROTECTION ROUTES DASHBOARD ====================
  if (isDashboardRoute(req)) {
    // Dashboard accessible à tous les utilisateurs connectés
    return NextResponse.next();
  }

  // ==================== ROUTES PRIVÉES GÉNÉRALES ====================
  // Toute autre route privée nécessite une authentification
  return NextResponse.next();
});

// ==================== CONFIGURATION ====================
export const config = {
  // Matcher optimisé pour de meilleures performances
  matcher: [
    /*
     * Matcher toutes les routes sauf:
     * - _next/static (fichiers statiques)
     * - _next/image (images optimisées)
     * - favicon.ico (favicon)
     * - Fichiers avec extension (images, CSS, JS, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.).*)",

    // Routes API spécifiques (sauf publiques et webhooks)
    "/api/((?!public|webhooks|health).*)",
  ],
};

// ==================== HELPERS DE SÉCURITÉ ====================
/**
 * Types pour la gestion des rôles utilisateur
 */
export interface UserRole {
  isAdmin: boolean;
  isFarmer: boolean;
  isCustomer: boolean;
  permissions: string[];
}

/**
 * Interface pour les logs de sécurité
 */
export interface SecurityLog {
  userId: string;
  action:
    | "access_granted"
    | "access_denied"
    | "admin_check"
    | "profile_redirect";
  route: string;
  timestamp: string;
  reason?: string;
}
