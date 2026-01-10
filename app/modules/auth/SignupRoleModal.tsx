"use client";

import Modal from "@/app/_components/ui/Modal";
import { SignUp, useClerk, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { COLORS, PATHS } from "@/lib/config";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

/**
 * Interface pour les props de la modale d'inscription
 */
interface SignupRoleModalProps {
  onClose?: () => void;
}

/**
 * Interface pour la réponse API de mise à jour du rôle
 */
interface UpdateRoleResponse {
  success: boolean;
  error?: string;
}

/**
 * Modale d'inscription avec sélection de rôle et design responsive
 *
 * Features:
 * - Version mobile plein écran et desktop avec image
 * - Gestion automatique du rôle utilisateur
 * - Redirection intelligente selon le contexte
 * - Protection contre l'hydratation
 * - Configuration centralisée des styles
 */
export default function SignupRoleModal({
  onClose,
}: SignupRoleModalProps): JSX.Element {
  const router = useRouter();
  const { client } = useClerk();
  const { user, isSignedIn } = useUser();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [hasProcessedSignup, setHasProcessedSignup] = useState<boolean>(false);

  // ✅ Rôle par défaut - pourrait être configuré via props si nécessaire
  const role = "user";

  /**
   * Détection de l'inscription réussie
   */
  useEffect(() => {
    if (isSignedIn && user && !hasProcessedSignup) {
      setHasProcessedSignup(true);
      handleUserSignedUp(user.id);
    }
  }, [isSignedIn, user, hasProcessedSignup]);

  /**
   * Traitement après inscription réussie
   */
  const handleUserSignedUp = async (userId: string): Promise<void> => {
    setIsSubmitting(true);

    try {
      toast.info("Création de votre compte...", {
        icon: "🌱",
      });

      const response = await fetch("/api/update-user-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({ userId, role }),
      });

      if (!response.ok) {
        const errorData: UpdateRoleResponse = await response
          .json()
          .catch((parseError) => {
            console.error("Failed to parse error response:", parseError);
            return { success: false, error: "Unable to parse server response" };
          });
        toast.warning("Compte créé, mais le rôle n'a pas pu être synchronisé.");
      } else {
        // ✅ Rafraîchir la session Clerk pour obtenir les nouvelles métadonnées
        try {
          await client?.reload();
        } catch (error) {
          console.warn("Could not reload Clerk client:", error);
        }
        toast.success(
          "Compte créé avec succès ! Bienvenue sur Farm To Fork ! 🎉"
        );
      }

      // ✅ Déterminer l'URL de redirection
      const redirectUrl = getRedirectUrl();

      // Fermer la modale d'abord
      if (onClose) onClose();

      // Redirection avec un délai court pour permettre à la modale de se fermer
      setTimeout(() => {
        router.push(redirectUrl);
      }, 300);
    } catch (error) {
      toast.error("Une erreur est survenue pendant l'inscription.");
      setIsSubmitting(false);
    }
  };

  /**
   * Initialisation côté client et détection mobile
   */
  useEffect(() => {
    setIsClient(true);

    const checkMobile = (): void => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /**
   * Gestion de la fermeture de la modale
   */
  const handleClose = (): void => {
    if (isSubmitting) return;

    if (onClose) {
      onClose();
    } else {
      router.push(PATHS.HOME);
    }
  };

  /**
   * Détermine l'URL de redirection après inscription
   */
  const getRedirectUrl = (): string => {
    if (typeof window === "undefined") return PATHS.HOME;

    // ✅ Vérifier si on vient de la page signup-farmer
    if (window.location.pathname.includes("signup-farmer")) {
      return "/request-farmer-access";
    }

    // ✅ Vérifier s'il y a un paramètre de redirection
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get("redirect");

    // Validation de sécurité : seules les URLs relatives sont autorisées
    if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
      return redirect;
    }

    return PATHS.HOME;
  };

  // ✅ Protection contre l'hydratation
  if (!isClient) {
    return (
      <Modal isOpen={true} onClose={handleClose}>
        <div
          className="flex items-center justify-center min-h-[500px]"
          style={{ backgroundColor: COLORS.BG_WHITE }}
        >
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{
                borderColor: `${COLORS.PRIMARY} transparent ${COLORS.PRIMARY} ${COLORS.PRIMARY}`,
              }}
            />
            <p style={{ color: COLORS.TEXT_MUTED }}>Chargement...</p>
          </div>
        </div>
      </Modal>
    );
  }

  // ✅ Version mobile : Clerk en plein écran
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: COLORS.BG_WHITE }}
      >
        <div className="flex flex-col h-full">
          {/* Header avec bouton fermer */}
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
          >
            <h1
              className="text-lg font-semibold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Inscription Farm To Fork 🌱
            </h1>
            <button
              onClick={handleClose}
              className={cn(
                "p-2 rounded-full transition-colors duration-200",
                "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              )}
              style={{ color: COLORS.TEXT_MUTED }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.BG_GRAY;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              aria-label="Fermer l'inscription"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenu Clerk centré */}
          <div
            className="flex-1 flex items-center justify-center p-6"
            style={{ backgroundColor: COLORS.BG_GRAY }}
          >
            <div className="w-full max-w-sm">
              <div
                className="mb-6 p-4 rounded-lg border text-center"
                style={{
                  backgroundColor: COLORS.PRIMARY_BG,
                  borderColor: `${COLORS.PRIMARY}30`,
                }}
              >
                <h2
                  className="font-semibold mb-2"
                  style={{ color: COLORS.PRIMARY }}
                >
                  🎯 Rejoignez la communauté
                </h2>
                <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                  Découvrez les fermes locales et soutenez les producteurs près
                  de chez vous
                </p>
              </div>

              <SignUp
                routing="hash"
                signInUrl="#/sign-in"
                fallbackRedirectUrl={PATHS.HOME}
                appearance={{
                  elements: {
                    formButtonPrimary: `${isSubmitting ? "pointer-events-none opacity-50" : ""} bg-[${COLORS.PRIMARY}] hover:bg-[${COLORS.PRIMARY_DARK}] focus:ring-2 focus:ring-[${COLORS.PRIMARY}] transition-all duration-200`,
                    formFieldInput: `border-[${COLORS.BORDER}] focus:ring-2 focus:ring-[${COLORS.PRIMARY}] focus:border-[${COLORS.PRIMARY}]`,
                    formFieldLabel: `text-[${COLORS.TEXT_PRIMARY}] font-medium`,
                    card: `shadow-lg bg-[${COLORS.BG_WHITE}] border-[${COLORS.BORDER}]`,
                    rootBox: "w-full",
                    headerTitle: `text-[${COLORS.TEXT_PRIMARY}]`,
                    headerSubtitle: `text-[${COLORS.TEXT_SECONDARY}]`,
                    socialButtonsBlockButton: `border-[${COLORS.BORDER}] hover:bg-[${COLORS.BG_GRAY}]`,
                    footerActionLink: `text-[${COLORS.PRIMARY}] hover:text-[${COLORS.PRIMARY_DARK}]`,
                  },
                  variables: {
                    colorPrimary: COLORS.PRIMARY,
                    borderRadius: "0.5rem",
                    fontFamily: "inherit",
                    colorText: COLORS.TEXT_PRIMARY,
                    colorTextSecondary: COLORS.TEXT_SECONDARY,
                    colorBackground: COLORS.BG_WHITE,
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Version desktop : Modale avec image
  return (
    <Modal isOpen={true} onClose={handleClose}>
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px] max-h-[80vh] overflow-hidden">
        {/* Section image (desktop uniquement) */}
        <section
          className="relative hidden lg:block lg:col-span-5 xl:col-span-6 rounded-l-lg overflow-hidden"
          style={{ backgroundColor: COLORS.TEXT_PRIMARY }}
        >
          <Image
            alt="Ferme locale avec produits frais"
            src="/image1.jpg"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />

          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${COLORS.TEXT_PRIMARY}B3 0%, transparent 50%)`,
            }}
          />

          <div className="absolute bottom-0 left-0 p-8 z-10">
            <h2
              className="text-3xl font-bold mb-3"
              style={{ color: COLORS.BG_WHITE }}
            >
              Rejoignez Farm To Fork 🌱
            </h2>
            <p
              className="text-lg leading-relaxed"
              style={{ color: `${COLORS.BG_WHITE}E6` }}
            >
              Créez votre compte pour découvrir les fermes locales, sauvegarder
              vos producteurs favoris et soutenir l'agriculture de proximité.
            </p>

            {/* Points clés */}
            <div className="mt-4 space-y-2">
              {[
                "🗺️ Carte interactive des fermes",
                "❤️ Favoris et notifications",
                "🛒 Accès direct aux producteurs",
              ].map((point, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: `${COLORS.BG_WHITE}E6` }}
                >
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section formulaire */}
        <main
          className="flex flex-col lg:col-span-7 xl:col-span-6 rounded-r-lg overflow-y-auto"
          style={{ backgroundColor: COLORS.BG_WHITE }}
        >
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md mx-auto">
              {/* Message d'accueil desktop */}
              <div className="lg:hidden mb-6 text-center">
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Rejoignez Farm To Fork ! 🌱
                </h2>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  Découvrez les fermes locales près de chez vous
                </p>
              </div>

              <SignUp
                routing="hash"
                signInUrl="#/sign-in"
                fallbackRedirectUrl={PATHS.HOME}
                appearance={{
                  elements: {
                    formButtonPrimary: `${isSubmitting ? "pointer-events-none opacity-50" : ""} bg-[${COLORS.PRIMARY}] hover:bg-[${COLORS.PRIMARY_DARK}] focus:ring-2 focus:ring-[${COLORS.PRIMARY}] transition-all duration-200`,
                    formFieldInput: `border-[${COLORS.BORDER}] focus:ring-2 focus:ring-[${COLORS.PRIMARY}] focus:border-[${COLORS.PRIMARY}]`,
                    formFieldLabel: `text-[${COLORS.TEXT_PRIMARY}] font-medium`,
                    rootBox: "mx-auto w-full",
                    card: "mx-auto w-full max-w-md shadow-none border-none",
                    headerTitle: `text-[${COLORS.TEXT_PRIMARY}]`,
                    headerSubtitle: `text-[${COLORS.TEXT_SECONDARY}]`,
                    socialButtonsBlockButton: `border-[${COLORS.BORDER}] hover:bg-[${COLORS.BG_GRAY}]`,
                    footerActionLink: `text-[${COLORS.PRIMARY}] hover:text-[${COLORS.PRIMARY_DARK}]`,
                  },
                  variables: {
                    colorPrimary: COLORS.PRIMARY,
                    borderRadius: "0.375rem",
                    fontFamily: "inherit",
                    colorText: COLORS.TEXT_PRIMARY,
                    colorTextSecondary: COLORS.TEXT_SECONDARY,
                    colorBackground: COLORS.BG_WHITE,
                  },
                }}
              />

              {/* Message de confidentialité */}
              <div
                className="mt-6 p-3 rounded-lg border text-center"
                style={{
                  backgroundColor: COLORS.PRIMARY_BG,
                  borderColor: `${COLORS.PRIMARY}30`,
                }}
              >
                <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
                  🔒 Vos données sont protégées. Consultez notre{" "}
                  <a
                    href="/legal/privacy-policy"
                    className="underline hover:no-underline"
                    style={{ color: COLORS.PRIMARY }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    politique de confidentialité
                  </a>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Modal>
  );
}
