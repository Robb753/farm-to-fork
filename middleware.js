import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Définir les routes réservées aux agriculteurs
const farmerRoutes = ["/dashboard/farms", "/add-new-listing", "/edit-listing"];

// Créer des matchers pour ces routes
const isFarmerRoute = createRouteMatcher(farmerRoutes);

// Middleware personnalisé qui s'exécute avant Clerk
function customMiddleware(auth, req) {
  const { userId, sessionClaims } = auth;
  const { nextUrl } = req;

  // Si l'utilisateur essaie d'accéder à une route réservée aux agriculteurs
  if (isFarmerRoute(nextUrl.pathname)) {
    // Si l'utilisateur n'est pas connecté, rediriger vers la connexion
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Vérifier si l'utilisateur a le rôle "farmer"
    const userRole = sessionClaims?.publicMetadata?.role;

    if (userRole !== "farmer") {
      // Rediriger les utilisateurs non-agriculteurs vers la page d'accueil
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Pour toutes les autres routes, continuer normalement
  return NextResponse.next();
}

// Exporter le middleware Clerk avec notre middleware personnalisé
export default clerkMiddleware({
  beforeAuth: (req) => {
    // Actions avant l'authentification si nécessaire
    return NextResponse.next();
  },
  afterAuth: customMiddleware,
});

// Configuration du matcher (identique à celle que vous aviez)
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
