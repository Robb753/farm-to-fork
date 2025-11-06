"use client";

import { SignUp, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { COLORS, PATHS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Page d'inscription pour les producteurs
 * 
 * Features:
 * - Formulaire d'inscription Clerk personnalisé
 * - Redirection automatique après connexion
 * - Design responsive avec image de fond
 * - Configuration centralisée des couleurs et chemins
 */
export default function SignUpFarmerPage(): JSX.Element {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  /**
   * Redirige vers la demande d'accès producteur après inscription
   */
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/request-farmer-access");
    }
  }, [isLoaded, isSignedIn, router]);

  // Ne rien afficher si l'utilisateur est déjà connecté
  if (isLoaded && isSignedIn) return null;

  return (
    <section style={{ backgroundColor: COLORS.BG_WHITE }}>
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:min-h-screen">
        {/* ✅ Section image avec design amélioré */}
        <section 
          className={cn(
            "relative flex h-32 sm:h-48 md:h-64 lg:h-full items-end",
            "lg:col-span-5 xl:col-span-6"
          )}
          style={{ backgroundColor: COLORS.TEXT_PRIMARY }}
        >
          <Image
            alt="Champs agricoles et ferme locale"
            src="/image1.jpg"
            fill
            className="absolute inset-0 object-cover opacity-70"
            priority
          />
          
          {/* Overlay gradient pour améliorer la lisibilité */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${COLORS.PRIMARY}40 0%, transparent 50%)`,
            }}
          />
          
          <div className="hidden lg:block lg:relative lg:p-12 z-10">
            <Link 
              className={cn(
                "block transition-opacity duration-200 hover:opacity-80",
                "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
              )}
              href={PATHS.HOME}
              style={{ color: COLORS.BG_WHITE }}
            >
              <span className="sr-only">Retour à l'accueil</span>
              <svg
                className="h-8 sm:h-10"
                viewBox="0 0 28 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 12L12 20L24 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </Link>
            
            <h2 
              className="mt-6 text-3xl font-bold"
              style={{ color: COLORS.BG_WHITE }}
            >
              Rejoignez Farm To Fork ! 🌱
            </h2>
            
            <p 
              className="mt-4 leading-relaxed"
              style={{ color: `${COLORS.BG_WHITE}E6` }} // 90% opacity
            >
              Créez un compte pour enregistrer votre ferme, vendre vos produits locaux
              et connecter avec une communauté de consommateurs engagés.
            </p>
            
            {/* ✅ Bénéfices pour les producteurs */}
            <div className="mt-8 space-y-3">
              {[
                "🗺️ Visibilité sur notre carte interactive",
                "🛒 Vente directe aux consommateurs",
                "📈 Développement de votre clientèle locale",
              ].map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-2 text-sm"
                  style={{ color: `${COLORS.BG_WHITE}E6` }}
                >
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ✅ Section formulaire */}
        <main 
          className={cn(
            "flex items-center justify-center px-4 py-8",
            "sm:px-8 sm:py-12 md:px-12",
            "lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6"
          )}
        >
          <div className="max-w-lg w-full">
            {/* ✅ En-tête mobile */}
            <div className="lg:hidden mb-6 text-center">
              <h1 
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Rejoignez Farm To Fork ! 🌱
              </h1>
              <p 
                className="text-lg"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Créez un compte pour commencer votre aventure agricole.
              </p>
              
              {/* Bénéfices version mobile */}
              <div className="mt-4 text-sm space-y-2">
                {[
                  "🗺️ Visibilité sur notre carte",
                  "🛒 Vente directe",
                  "📈 Croissance locale",
                ].map((benefit, index) => (
                  <div 
                    key={index}
                    style={{ color: COLORS.TEXT_MUTED }}
                  >
                    {benefit}
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ Composant SignUp personnalisé */}
            <div className="space-y-4">
              <SignUp
                routing="hash"
                signInUrl="/sign-in"
                fallbackRedirectUrl="/request-farmer-access"
                appearance={{
                  elements: {
                    formButtonPrimary: `bg-[${COLORS.PRIMARY}] hover:bg-[${COLORS.PRIMARY_DARK}] text-white font-semibold transition-colors duration-200`,
                    formFieldInput: `border-[${COLORS.BORDER}] focus:border-[${COLORS.PRIMARY}] focus:ring-[${COLORS.PRIMARY}]`,
                    headerTitle: `text-[${COLORS.TEXT_PRIMARY}]`,
                    headerSubtitle: `text-[${COLORS.TEXT_SECONDARY}]`,
                    socialButtonsBlockButton: `border-[${COLORS.BORDER}] hover:bg-[${COLORS.BG_GRAY}]`,
                    dividerLine: `bg-[${COLORS.BORDER}]`,
                    dividerText: `text-[${COLORS.TEXT_MUTED}]`,
                  },
                  layout: {
                    socialButtonsPlacement: "top",
                  },
                }}
              />
              
              {/* ✅ Lien vers connexion */}
              <div className="text-center mt-6">
                <p 
                  className="text-sm"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Vous avez déjà un compte ?{" "}
                  <Link
                    href="/sign-in"
                    className={cn(
                      "font-medium hover:underline transition-colors duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
                    )}
                    style={{ color: COLORS.PRIMARY }}
                  >
                    Se connecter
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* ✅ Section informative en bas */}
      <div 
        className="border-t py-8 px-4"
        style={{
          backgroundColor: COLORS.BG_GRAY,
          borderColor: COLORS.BORDER,
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h3 
            className="font-semibold mb-4"
            style={{ color: COLORS.PRIMARY }}
          >
            🚜 Processus d'inscription producteur
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Créer un compte",
                desc: "Inscription gratuite en quelques clics"
              },
              {
                step: "2", 
                title: "Demande d'accès",
                desc: "Remplissez le formulaire de demande producteur"
              },
              {
                step: "3",
                title: "Validation",
                desc: "Notre équipe valide votre profil sous 48h"
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div 
                  className="w-8 h-8 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: COLORS.PRIMARY }}
                >
                  {step.step}
                </div>
                <div 
                  className="font-medium mb-1"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {step.title}
                </div>
                <div 
                  className="text-sm"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}