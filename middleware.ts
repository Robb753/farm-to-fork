import { NextRequest, NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Middleware TypeScript sécurisé pour Farm2Fork
 *
 * Features:
 * - Sécurité maximale avec vérification des rôles
 * - Protection dashboard (utilisateurs connectés uniquement)
 * - Protection admin (administrateurs uniquement)
 * - Protection profile (propriétaire uniquement)
 * - Types TypeScript complets
 * - Gestion appropriée de l'authentification Clerk
 */

// ==================== MATCHERS DE ROUTES ====================
const isPublicRoute = createRouteMatcher([
  "/", // Page d'accueil
  "/explore(.*)", // Exploration des producteurs (lecture seule)
  "/legal(.*)", // Pages légales
  "/sign-in(.*)", // Pages de connexion
  "/sign-up(.*)", // Pages d'inscription
  "/api/public(.*)", // APIs publiques
  "/api/webhooks(.*)", // Webhooks (Clerk, Stripe, etc.)
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
const isProfileRoute = createRouteMatcher(["/profile(.*)"]);

// ==================== CONFIGURATION SÉCURITÉ RENFORCÉE ====================
export default clerkMiddleware(async (auth, req) => {
  const { userId } = auth();
  const { pathname } = req.nextUrl;

  // ==================== ROUTES PUBLIQUES ====================
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // ==================== GESTION UTILISATEUR NON CONNECTÉ ====================
  if (!userId) {
    console.log(`🔒 Accès refusé - Utilisateur non connecté: ${pathname}`);

    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // ==================== PROTECTION ROUTES ADMIN ====================
  if (isAdminRoute(req)) {
    try {
      // Vérifier le rôle admin dans les métadonnées Clerk
      const response = await fetch(
        `${req.nextUrl.origin}/api/auth/check-admin`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userId}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.log(`🚫 Accès admin refusé pour userId: ${userId}`);

        // Rediriger vers dashboard avec message d'erreur
        const dashboardUrl = new URL("/dashboard", req.url);
        dashboardUrl.searchParams.set("error", "admin_access_required");
        return NextResponse.redirect(dashboardUrl);
      }

      console.log(`✅ Accès admin autorisé pour userId: ${userId}`);
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
      console.log(
        `🚫 Tentative d'accès au profil d'un autre utilisateur: ${userId} -> ${profileUserId}`
      );

      // Rediriger vers son propre profil
      const ownProfileUrl = new URL(`/profile/${userId}`, req.url);
      return NextResponse.redirect(ownProfileUrl);
    }

    console.log(`✅ Accès profile autorisé pour userId: ${userId}`);
    return NextResponse.next();
  }

  // ==================== PROTECTION ROUTES DASHBOARD ====================
  if (isDashboardRoute(req)) {
    // Dashboard accessible à tous les utilisateurs connectés
    console.log(`✅ Accès dashboard autorisé pour userId: ${userId}`);
    return NextResponse.next();
  }

  // ==================== ROUTES PRIVÉES GÉNÉRALES ====================
  // Toute autre route privée nécessite une authentification
  console.log(
    `✅ Accès autorisé pour utilisateur connecté: ${userId} -> ${pathname}`
  );
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
