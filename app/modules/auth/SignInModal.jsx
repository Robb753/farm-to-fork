"use client";

import Modal from "@/app/_components/ui/Modal";
import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function SignInModal({ onClose }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // S'assurer que le composant est monté côté client
  useEffect(() => {
    setIsClient(true);
    // Détecter si on est sur mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleClose = () => {
    if (isLoading) return; // Empêche la fermeture pendant le chargement
    if (onClose) {
      onClose();
    } else {
      router.push("/");
    }
  };

  // Gestion de la réussite de connexion
  const handleSignInSuccess = () => {
    setIsLoading(true);
    // Fermer le modal après un délai pour permettre la synchronisation
    setTimeout(() => {
      handleClose();
    }, 500);
  };

  // Protection contre l'hydratation
  if (!isClient) {
    return (
      <Modal onClose={handleClose}>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="animate-pulse text-gray-500">Chargement...</div>
        </div>
      </Modal>
    );
  }

  // Version mobile : Clerk en plein écran
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="flex flex-col h-full">
          {/* Header avec bouton fermer */}
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <h1 className="text-lg font-semibold text-gray-900">Connexion</h1>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Contenu Clerk centré */}
          <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-sm mx-auto">
              <div
                className="flex justify-center items-center w-full"
                style={{ minHeight: "400px" }}
              >
                {/* Indicateur de chargement */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-600 font-medium">
                        Connexion en cours...
                      </p>
                    </div>
                  </div>
                )}

                <SignIn
                  routing="hash"
                  signUpUrl="#/sign-up"
                  appearance={{
                    elements: {
                      formButtonPrimary:
                        "bg-green-600 hover:bg-green-700 text-white font-medium transition-colors duration-200",
                      card: "shadow-lg bg-white rounded-xl mx-auto w-full max-w-sm",
                      rootBox: "w-full flex justify-center",
                      formContainer: "w-full max-w-sm",
                      main: "w-full max-w-sm mx-auto",
                      socialButtonsBlockButton:
                        "border border-gray-300 hover:border-gray-400 transition-colors",
                      formFieldLabel: "text-gray-700 font-medium",
                      formFieldInput:
                        "border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-md",
                      footerActionLink: "text-green-600 hover:text-green-700",
                      formFieldAction: "text-green-600 hover:text-green-700",
                    },
                    variables: {
                      colorPrimary: "#16a34a",
                      borderRadius: "0.75rem",
                      fontFamily: "inherit",
                    },
                    layout: {
                      logoImageUrl: undefined,
                      showOptionalFields: false,
                      termsPageUrl: "/legal/privacy-policy",
                      privacyPageUrl: "/legal/privacy-policy",
                    },
                  }}
                  fallbackRedirectUrl="/"
                  onComplete={handleSignInSuccess}
                />
              </div>
            </div>
          </div>

          {/* Footer mobile */}
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Pas encore de compte ?{" "}
                <button
                  onClick={() => {
                    handleClose();
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent("openSignupModal"));
                    }, 100);
                  }}
                  className="text-green-600 hover:text-green-700 font-medium underline"
                >
                  Créer un compte
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Version desktop : Modale avec image
  return (
    <Modal onClose={handleClose}>
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* Image à gauche - Desktop uniquement */}
        <section className="relative bg-gray-900 lg:col-span-5 xl:col-span-6 rounded-l-lg overflow-hidden">
          <Image
            alt="Champs agricoles - Farm To Fork"
            src="/image1.jpg"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
            fill
            sizes="50vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 z-10">
            <h2 className="text-3xl font-bold text-white mb-2">
              Bienvenue sur Farm To Fork !
            </h2>
            <p className="text-white/90 leading-relaxed">
              Connectez-vous pour découvrir les fermes locales près de chez
              vous.
            </p>
          </div>
        </section>

        {/* Formulaire à droite - Desktop */}
        <main className="flex flex-col lg:col-span-7 xl:col-span-6 bg-white rounded-r-lg overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto">
              <div className="flex justify-center items-center w-full min-h-[500px]">
                {/* Indicateur de chargement */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-r-lg">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-600 font-medium">
                        Connexion en cours...
                      </p>
                    </div>
                  </div>
                )}

                <SignIn
                  routing="hash"
                  signUpUrl="#/sign-up"
                  appearance={{
                    elements: {
                      formButtonPrimary:
                        "bg-green-600 hover:bg-green-700 text-white font-medium transition-colors duration-200",
                      card: "shadow-lg bg-white rounded-xl mx-auto w-full max-w-md",
                      rootBox: "w-full flex justify-center",
                      formContainer: "w-full max-w-md",
                      main: "w-full max-w-md mx-auto",
                      headerTitle: "text-2xl font-bold text-gray-900",
                      headerSubtitle: "text-gray-600",
                      socialButtonsBlockButton:
                        "border border-gray-300 hover:border-gray-400 transition-colors",
                      formFieldLabel: "text-gray-700 font-medium",
                      formFieldInput:
                        "border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-md",
                      footerActionLink: "text-green-600 hover:text-green-700",
                      formFieldAction: "text-green-600 hover:text-green-700",
                      form: "space-y-4",
                      formFieldRow: "space-y-2",
                      dividerRow: "my-6",
                      dividerText: "text-gray-500 text-sm",
                      socialButtonsBlockButtonText: "font-medium",
                      formButtonReset: "text-green-600 hover:text-green-700",
                    },
                    variables: {
                      colorPrimary: "#16a34a",
                      colorBackground: "#ffffff",
                      colorInputBackground: "#ffffff",
                      colorInputText: "#374151",
                      borderRadius: "0.75rem",
                      fontFamily: "inherit",
                      fontSize: "0.875rem",
                    },
                    layout: {
                      logoImageUrl: undefined,
                      showOptionalFields: false,
                      termsPageUrl: "/legal/privacy-policy",
                      privacyPageUrl: "/legal/privacy-policy",
                    },
                  }}
                  fallbackRedirectUrl="/"
                  onComplete={handleSignInSuccess}
                />
              </div>
            </div>
          </div>

          {/* Footer avec liens utiles */}
          <div className="border-t border-gray-100 p-4 lg:p-6 bg-gray-50 rounded-br-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Pas encore de compte ?{" "}
                <button
                  onClick={() => {
                    handleClose();
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent("openSignupModal"));
                    }, 100);
                  }}
                  className="text-green-600 hover:text-green-700 font-medium underline"
                >
                  Créer un compte
                </button>
              </p>
              <p className="text-xs text-gray-500">
                En vous connectant, vous acceptez nos{" "}
                <a
                  href="/legal/privacy-policy"
                  target="_blank"
                  className="text-green-600 hover:underline"
                >
                  conditions d'utilisation
                </a>
              </p>
            </div>
          </div>
        </main>
      </div>
    </Modal>
  );
}
