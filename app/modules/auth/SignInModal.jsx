"use client";

import Modal from "@/app/_components/ui/Modal";
import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function SignInModal({ onClose }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    if (isLoading) return; // Empêche la fermeture pendant le chargement
    if (onClose) {
      onClose();
    } else {
      router.push("/");
    }
  };

  // ✅ Gestion de la réussite de connexion
  const handleSignInSuccess = () => {
    setIsLoading(true);
    // Fermer le modal après un délai pour permettre la synchronisation
    setTimeout(() => {
      handleClose();
    }, 500);
  };

  return (
    <Modal onClose={handleClose} className="max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px] max-h-[90vh]">
        {/* ✅ Image à gauche - Masquée sur mobile pour économiser l'espace */}
        <section className="relative hidden lg:block bg-gray-900 lg:col-span-5 xl:col-span-6 rounded-l-xl overflow-hidden">
          <Image
            alt="Champs agricoles - Farm To Fork"
            src="/image1.jpg"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
            fill
            sizes="(max-width: 1024px) 0vw, 50vw"
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

        {/* ✅ Formulaire à droite - Responsive optimisé */}
        <main className="flex flex-col lg:col-span-7 xl:col-span-6 bg-white lg:rounded-r-xl overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 lg:p-8">
              {/* ✅ Titre mobile visible seulement sur petits écrans */}
              <div className="lg:hidden mb-6 text-center">
                <h2 className="text-2xl font-bold text-green-700 mb-2">
                  Connexion
                </h2>
                <p className="text-gray-600">
                  Accédez à votre compte Farm To Fork
                </p>
              </div>

              {/* ✅ Indicateur de chargement */}
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 font-medium">
                      Connexion en cours...
                    </p>
                  </div>
                </div>
              )}

              {/* ✅ Composant SignIn avec configuration optimisée */}
              <SignIn
                routing="hash"
                signUpUrl="#/sign-up" // Utilise hash routing pour éviter les navigations
                appearance={{
                  elements: {
                    formButtonPrimary:
                      "bg-green-600 hover:bg-green-700 text-white font-medium transition-colors duration-200",
                    rootBox: "w-full",
                    card: "shadow-none border-0 bg-transparent",
                    headerTitle:
                      "text-2xl font-bold text-gray-900 hidden lg:block",
                    headerSubtitle: "text-gray-600 hidden lg:block",
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
                    borderRadius: "0.375rem",
                    fontFamily: "inherit",
                    fontSize: "0.875rem",
                  },
                  layout: {
                    logoImageUrl: undefined, // Supprime le logo Clerk
                    showOptionalFields: false,
                    termsPageUrl: "/legal/privacy-policy",
                    privacyPageUrl: "/legal/privacy-policy",
                  },
                }}
                afterSignInUrl="/" // Redirection après connexion
                onComplete={handleSignInSuccess}
              />
            </div>
          </div>

          {/* ✅ Footer avec liens utiles */}
          <div className="border-t border-gray-100 p-4 lg:p-6 bg-gray-50 lg:rounded-br-xl">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Pas encore de compte ?{" "}
                <button
                  onClick={() => {
                    // Fermer ce modal et ouvrir le modal d'inscription
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
