// middleware.js
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

// Routes d'authentification
const authRoutes = ["/sign-in", "/sign-up"];

// Routes protégées générales
const protectedRoutes = ["/dashboard", "/forum", "/user", "/map-view"];

// Routes réservées aux farmers
const farmerRoutes = ["/add-new-listing", "/edit-listing", "/farmer-dashboard"];

export default async function middleware(req) {
  const { nextUrl } = req;
  const url = nextUrl.clone();

  try {
    // Obtenir les informations d'authentification
    const { userId, sessionId } = getAuth(req);
    const isSignedIn = !!userId;

    // Vérifier si l'utilisateur est sur une route d'authentification
    if (authRoutes.some((route) => nextUrl.pathname.startsWith(route))) {
      // Si l'utilisateur est connecté et essaie d'accéder à une page d'authentification,
      // le rediriger vers la page d'accueil
      if (isSignedIn) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      // Si l'utilisateur n'est pas connecté, laisser passer
      return NextResponse.next();
    }

    // Vérifier si l'utilisateur est sur une route protégée
    if (protectedRoutes.some((route) => nextUrl.pathname.startsWith(route))) {
      // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
      if (!isSignedIn) {
        const signInUrl = new URL("/sign-in", req.url);
        signInUrl.searchParams.set("redirect_url", req.url);
        return NextResponse.redirect(signInUrl);
      }
      // Si l'utilisateur est connecté, laisser passer
      return NextResponse.next();
    }

    // Vérifier si l'utilisateur est sur une route farmer
    if (farmerRoutes.some((route) => nextUrl.pathname.startsWith(route))) {
      // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
      if (!isSignedIn) {
        const signInUrl = new URL("/sign-in", req.url);
        signInUrl.searchParams.set("redirect_url", req.url);
        return NextResponse.redirect(signInUrl);
      }

      // Nous ne pouvons pas vérifier le rôle dans le middleware, car cela nécessite un appel à clerkClient
      // Nous allons donc laisser passer et gérer cela côté client avec un composant de protection

      return NextResponse.next();
    }

    // Pour toutes les autres routes, laisser passer
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Exclure les fichiers statiques, les assets et les routes API
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
};
