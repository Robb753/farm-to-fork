"use client";

import { SignIn } from "@clerk/nextjs";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { COLORS, PATHS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Interface pour les props de la modale de connexion
 */
interface SignInModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

/**
 * Modale de connexion avec Clerk
 * 
 * Features:
 * - Support des redirections avec paramètre ?redirect=/chemin
 * - Gestion du focus et scroll lock
 * - Fermeture avec ESC et clic backdrop
 * - Design responsive et accessible
 * - Configuration centralisée des couleurs
 */
export default function SignInModal({ isOpen, onClose }: SignInModalProps): JSX.Element | null {
  const backdropRef = useRef<HTMLDivElement>(null);

  /**
   * Gestion des événements clavier et scroll lock
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // ✅ Calcul de la largeur de la scrollbar pour éviter le saut de layout
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen, onClose]);

  /**
   * Détermine l'URL de redirection après connexion
   */
  const getRedirectTarget = (): string => {
    if (typeof window === "undefined") return PATHS.HOME;
    
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get("redirect");
    
    // ✅ Validation de sécurité : seules les URLs relatives sont autorisées
    if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
      return redirectParam;
    }
    
    return PATHS.HOME;
  };

  /**
   * Gestion du clic sur le backdrop pour fermer la modale
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === backdropRef.current) {
      onClose?.();
    }
  };

  /**
   * Gestion du mouseDown sur le backdrop (plus fiable que onClick)
   */
  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === backdropRef.current) {
      onClose?.();
    }
  };

  // ✅ Ne pas rendre si la modale n'est pas ouverte
  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      onMouseDown={handleBackdropMouseDown}
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center",
        "backdrop-blur-sm p-4 animate-in fade-in duration-200"
      )}
      style={{
        backgroundColor: `${COLORS.TEXT_PRIMARY}99`, // 60% opacity
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Connexion à Farm To Fork"
    >
      {/* ✅ Conteneur de la modale */}
      <div 
        className={cn(
          "relative w-full max-w-md rounded-2xl shadow-2xl p-6",
          "animate-in zoom-in-95 duration-200"
        )}
        style={{ backgroundColor: COLORS.BG_WHITE }}
        onClick={(e) => e.stopPropagation()} // Empêche la fermeture lors du clic sur le contenu
      >
        {/* ✅ Bouton de fermeture */}
        <button
          onClick={onClose}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full transition-colors duration-200",
            "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          )}
          style={{
            backgroundColor: "transparent",
            color: COLORS.TEXT_MUTED,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.BG_GRAY;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          aria-label="Fermer la modale de connexion"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ✅ En-tête de la modale */}
        <div className="mb-4 text-center">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Bienvenue sur Farm To Fork ! 🌱
          </h2>
          <p 
            className="text-sm"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Connectez-vous pour découvrir les fermes locales près de chez vous
          </p>
        </div>

        {/* ✅ Composant SignIn de Clerk personnalisé */}
        <SignIn
          routing="hash"
          signUpUrl="#/sign-up"
          fallbackRedirectUrl={getRedirectTarget()}
          afterSignInUrl={getRedirectTarget()}
          appearance={{
            elements: {
              formButtonPrimary: `bg-[${COLORS.PRIMARY}] hover:bg-[${COLORS.PRIMARY_DARK}] focus:ring-2 focus:ring-[${COLORS.PRIMARY}] text-white font-semibold transition-all duration-200`,
              formFieldInput: `border-[${COLORS.BORDER}] focus:border-[${COLORS.PRIMARY}] focus:ring-[${COLORS.PRIMARY}]`,
              card: "shadow-none border-none bg-transparent",
              headerTitle: `text-[${COLORS.TEXT_PRIMARY}]`,
              headerSubtitle: `text-[${COLORS.TEXT_SECONDARY}]`,
              socialButtonsBlockButton: `border-[${COLORS.BORDER}] hover:bg-[${COLORS.BG_GRAY}] transition-colors duration-200`,
              dividerLine: `bg-[${COLORS.BORDER}]`,
              dividerText: `text-[${COLORS.TEXT_MUTED}]`,
              footerActionLink: `text-[${COLORS.PRIMARY}] hover:text-[${COLORS.PRIMARY_DARK}]`,
            },
            layout: {
              socialButtonsPlacement: "top",
            },
            variables: {
              colorPrimary: COLORS.PRIMARY,
              colorText: COLORS.TEXT_PRIMARY,
              colorTextSecondary: COLORS.TEXT_SECONDARY,
              colorBackground: COLORS.BG_WHITE,
              colorInputBackground: COLORS.BG_WHITE,
              colorInputText: COLORS.TEXT_PRIMARY,
              borderRadius: "0.5rem",
            },
          }}
        />

        {/* ✅ Message informatif en bas */}
        <div 
          className="mt-6 p-3 rounded-lg border text-center"
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderColor: `${COLORS.PRIMARY}30`,
          }}
        >
          <p 
            className="text-xs"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            🔒 Vos données sont protégées et utilisées conformément à notre{" "}
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
  );
}