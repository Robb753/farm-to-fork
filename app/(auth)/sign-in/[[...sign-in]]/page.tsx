"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { COLORS, PATHS } from "@/lib/config";

/**
 * Page de connexion avec Clerk
 *
 * Features:
 * - Redirection automatique si déjà connecté
 * - Support du paramètre ?redirect=
 * - Design responsive avec image de branding
 * - Intégration avec la configuration centralisée
 */
export default function SignInPage(): JSX.Element | null {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const params = useSearchParams();

  // ✅ Support du paramètre ?redirect=/chemin avec validation de sécurité
  const redirectTarget = useMemo((): string => {
    const redirectParam = params?.get("redirect");

    // Validation de sécurité : seuls les chemins relatifs sont autorisés
    if (
      redirectParam &&
      redirectParam.startsWith("/") &&
      !redirectParam.startsWith("//")
    ) {
      return redirectParam;
    }

    return PATHS.HOME;
  }, [params]);

  // ✅ Redirection douce si déjà connecté
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace(redirectTarget);
    }
  }, [isLoaded, isSignedIn, router, redirectTarget]);

  // Éviter le flash de contenu si déjà connecté
  if (isLoaded && isSignedIn) return null;

  return (
    <section className="bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:min-h-screen">
        {/* ✅ Section image/branding */}
        <section className="relative flex h-32 sm:h-48 md:h-64 lg:h-full items-end bg-gray-900 lg:col-span-5 xl:col-span-6">
          <Image
            alt="Champs agricoles - Farm to Fork"
            src="/image1.jpg"
            fill
            className="absolute inset-0 object-cover opacity-70"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />

          <div className="hidden lg:block lg:relative lg:p-12">
            <Link
              className="block text-white"
              href={PATHS.HOME}
              aria-label="Retour à l'accueil Farm to Fork"
            >
              <span className="sr-only">Accueil</span>
              <svg
                className="h-8 sm:h-10"
                viewBox="0 0 28 24"
                fill="none"
                role="img"
                aria-label="Logo Farm to Fork"
              >
                <path
                  d="M0.41 10.3847C1.14777 7.4194 2.79594 4.89296 5.09765 3.13419C7.39937 1.37542 10.2325 0.474062 13.1329 0.564718C16.0333 0.655374 18.7954 1.73338 20.9783 3.62481C23.1612 5.51624 24.6443 8.11614 25.1917 10.9634"
                  fill="currentColor"
                />
              </svg>
            </Link>

            <h2
              className="mt-6 text-3xl font-bold text-white"
              style={{ color: COLORS.BG_WHITE }}
            >
              Bienvenue sur Farm To Fork !
            </h2>
            <p
              className="mt-4 leading-relaxed"
              style={{ color: `${COLORS.BG_WHITE}e6` }} // 90% opacity
            >
              Connectez-vous pour accéder à vos fermes, favoris et plus encore.
            </p>
          </div>
        </section>

        {/* ✅ Section formulaire */}
        <main className="flex items-center justify-center px-4 py-8 sm:px-8 sm:py-12 md:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
          <div className="max-w-lg w-full">
            {/* ✅ Header mobile uniquement */}
            <div className="lg:hidden mb-4 text-center">
              <h1
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Bienvenue sur Farm To Fork
              </h1>
              <p className="mt-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                Connectez-vous pour accéder à vos favoris et tableaux de bord.
              </p>
            </div>

            {/* ✅ Composant Clerk avec styling personnalisé */}
            <SignIn
              signUpUrl="/sign-up"
              fallbackRedirectUrl={redirectTarget}
              appearance={{
                elements: {
                  // Bouton principal avec couleurs de la config
                  formButtonPrimary: cn(
                    "transition-all duration-200",
                    "focus:ring-2 focus:ring-offset-2",
                    "rounded-lg font-medium"
                  ),
                  // Card principale
                  card: "shadow-xl rounded-xl border-0",
                  // Champs de saisie
                  formFieldInput: cn(
                    "rounded-lg border transition-colors",
                    "focus:ring-2 focus:ring-offset-1"
                  ),
                  // Labels
                  formFieldLabel: "font-medium text-sm",
                  // Liens
                  footerActionLink: "font-medium",
                },
                variables: {
                  // Couleurs principales depuis la config
                  colorPrimary: COLORS.PRIMARY,
                  colorSuccess: COLORS.SUCCESS,
                  colorWarning: COLORS.WARNING,
                  colorDanger: COLORS.ERROR,
                  // Texte
                  colorText: COLORS.TEXT_PRIMARY,
                  colorTextSecondary: COLORS.TEXT_SECONDARY,
                  // Rayons de bordure
                  borderRadius: "0.5rem",
                },
              }}
            />
          </div>
        </main>
      </div>
    </section>
  );
}
