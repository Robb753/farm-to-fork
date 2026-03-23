// app/_components/auth/ModernAuthSystem.tsx
"use client";

import { useState, useEffect, useCallback, MouseEvent } from "react";
import { SignIn, SignUp, useUser } from "@clerk/nextjs";
import { X } from "lucide-react";
import { COLORS } from "@/lib/config";

type ModalMode = "signin" | "signup";

export default function ModernAuthSystem() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("signin");
  const { user } = useUser();

  useEffect(() => {
    const handleOpenSignin = () => {
      setMode("signin");
      setIsOpen(true);
    };
    const handleOpenSignup = () => {
      setMode("signup");
      setIsOpen(true);
    };
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("openSigninModal", handleOpenSignin as EventListener);
    window.addEventListener("openSignupModal", handleOpenSignup as EventListener);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("openSigninModal", handleOpenSignin as EventListener);
      window.removeEventListener("openSignupModal", handleOpenSignup as EventListener);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const closeModal = useCallback(() => setIsOpen(false), []);

  const handleBackdropClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) closeModal();
    },
    [closeModal]
  );

  if (!isOpen || user) return null;

  const clerkAppearance = {
    elements: {
      formButtonPrimary: "bg-green-600 hover:bg-green-700",
      card: "shadow-none border-0",
      headerTitle: "hidden",
      headerSubtitle: "hidden",
      footerAction: "hidden",
    },
  };

  return (
    <div
      className="inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="rounded-2xl max-w-md w-full relative overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: COLORS.BG_WHITE }}
      >
        {/* Close button */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={closeModal}
            className="p-2 rounded-full transition-colors"
            style={{ backgroundColor: `${COLORS.BG_WHITE}e6` }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.BG_GRAY;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${COLORS.BG_WHITE}e6`;
            }}
            aria-label="Fermer"
          >
            <X className="w-4 h-4" style={{ color: COLORS.TEXT_SECONDARY }} />
          </button>
        </div>

        {mode === "signin" && (
          <div className="p-6">
            <div className="mb-4 text-center">
              <h2
                className="text-xl font-bold mb-1"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Bon retour sur Farm To Fork
              </h2>
              <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                Connectez-vous pour accéder à votre espace
              </p>
            </div>
            <SignIn
              routing="hash"
              fallbackRedirectUrl="/"
              appearance={clerkAppearance}
            />
            <div className="mt-4 text-center">
              <p className="text-sm mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                Pas encore de compte ?
              </p>
              <button
                onClick={() => setMode("signup")}
                className="font-medium text-sm transition-colors"
                style={{ color: COLORS.PRIMARY }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.PRIMARY_DARK;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = COLORS.PRIMARY;
                }}
              >
                Créer un compte
              </button>
            </div>
          </div>
        )}

        {mode === "signup" && (
          <div className="p-6">
            <div className="mb-4 text-center">
              <h2
                className="text-xl font-bold mb-1"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Rejoindre Farm To Fork
              </h2>
              <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                Créez votre compte gratuitement
              </p>
            </div>
            <SignUp
              routing="hash"
              fallbackRedirectUrl="/welcome"
              appearance={clerkAppearance}
            />
            <div className="mt-4 text-center">
              <p className="text-sm mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                Déjà un compte ?
              </p>
              <button
                onClick={() => setMode("signin")}
                className="font-medium text-sm transition-colors"
                style={{ color: COLORS.PRIMARY }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.PRIMARY_DARK;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = COLORS.PRIMARY;
                }}
              >
                Se connecter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
