"use client";

import Modal from "@/app/_components/ui/Modal";
import { SignUp, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SignupRoleModal({ onClose }) {
  const router = useRouter();
  const { client } = useClerk();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const role = "user"; // Rôle forcé

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
    if (isSubmitting) return;
    if (onClose) onClose();
    else router.push("/");
  };

  const handleComplete = async (result) => {
    if (!result?.createdUserId) {
      console.error("[DEBUG] Pas d'ID utilisateur créé");
      toast.error("Erreur lors de la création du compte");
      return;
    }

    const userId = result.createdUserId;
    setIsSubmitting(true);

    try {
      toast.info("Création de votre compte...");

      const response = await fetch("/api/update-user-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({ userId, role }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[DEBUG] Erreur API:", errorData);
        toast.warning("Compte créé, mais le rôle n'a pas pu être synchronisé.");
      } else {
        // Rafraîchir la session Clerk pour obtenir les nouvelles métadonnées
        await client?.session?.refresh();
        toast.success("Compte créé avec succès !");
      }

      // Déterminer l'URL de redirection
      const redirectUrl = getRedirectUrl();

      // Fermer la modale d'abord
      if (onClose) onClose();

      // Redirection avec un délai court pour permettre à la modale de se fermer
      setTimeout(() => {
        router.push(redirectUrl);
      }, 300);
    } catch (error) {
      console.error("[DEBUG] Erreur lors de l'inscription:", error);
      toast.error("Une erreur est survenue pendant l'inscription.");
      setIsSubmitting(false);
    }
  };

  const getRedirectUrl = () => {
    if (typeof window === "undefined") return "/";

    // Vérifier si on vient de la page signup-farmer
    if (window.location.pathname.includes("signup-farmer")) {
      return "/request-farmer-access";
    }

    // Vérifier s'il y a un paramètre de redirection
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get("redirect");
    if (redirect && redirect.startsWith("/")) {
      return redirect;
    }

    return "/";
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
            <h1 className="text-lg font-semibold text-gray-900">Inscription</h1>
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
          <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
            <div className="w-full max-w-sm">
              <SignUp
                routing="hash" // ← Remettre "hash"
                signInUrl="#/sign-in" // ← Remettre le #
                fallbackRedirectUrl="/"
                appearance={{
                  elements: {
                    formButtonPrimary: isSubmitting
                      ? "pointer-events-none opacity-50"
                      : "bg-green-600 hover:bg-green-700",
                    formButtonPrimaryContent: isSubmitting ? "hidden" : "block",
                    formButtonPrimaryLoading: isSubmitting
                      ? "flex items-center justify-center gap-2"
                      : "hidden",
                    formFieldInput:
                      "focus:ring-2 focus:ring-green-500 focus:border-green-500",
                    formFieldLabel: "text-gray-700 font-medium",
                    card: "shadow-lg bg-white",
                    rootBox: "w-full",
                  },
                  variables: {
                    colorPrimary: "#16a34a",
                    borderRadius: "0.5rem",
                    fontFamily: "inherit",
                  },
                }}
                onComplete={handleComplete}
              />
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
        <section className="relative hidden lg:block bg-gray-900 lg:col-span-5 xl:col-span-6 rounded-l-lg overflow-hidden">
          <Image
            alt="Ferme"
            src="/image1.jpg"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 z-10">
            <h2 className="text-3xl font-bold text-white">
              Rejoignez Farm To Fork
            </h2>
            <p className="mt-2 text-white/90">
              Créez votre compte pour enregistrer vos favoris ou publier votre
              ferme.
            </p>
          </div>
        </section>

        <main className="flex flex-col lg:col-span-7 xl:col-span-6 bg-white rounded-r-lg overflow-y-auto">
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md mx-auto">
              <SignUp
                routing="hash" // ← Remettre "hash"
                signInUrl="#/sign-in" // ← Remettre le #
                fallbackRedirectUrl="/"
                appearance={{
                  elements: {
                    formButtonPrimary: isSubmitting
                      ? "pointer-events-none opacity-50"
                      : "bg-green-600 hover:bg-green-700",
                    formButtonPrimaryContent: isSubmitting ? "hidden" : "block",
                    formButtonPrimaryLoading: isSubmitting
                      ? "flex items-center justify-center gap-2"
                      : "hidden",
                    formFieldInput:
                      "focus:ring-2 focus:ring-green-500 focus:border-green-500",
                    formFieldLabel: "text-gray-700 font-medium",
                    rootBox: "mx-auto w-full",
                    card: "mx-auto w-full max-w-md",
                  },
                  variables: {
                    colorPrimary: "#16a34a",
                    borderRadius: "0.375rem",
                    fontFamily: "inherit",
                  },
                }}
                onComplete={handleComplete}
              />
            </div>
          </div>
        </main>
      </div>
    </Modal>
  );
}
