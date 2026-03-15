"use client";

import Modal from "@/app/_components/ui/Modal";
import { SignUp, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { COLORS } from "@/lib/config";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SignupRoleModalProps {
  onClose?: () => void;
}

function subscribeToResize(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getIsMobileSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 1024;
}

function getIsMobileServerSnapshot(): boolean {
  return false;
}

export default function SignupRoleModal({
  onClose,
}: SignupRoleModalProps): JSX.Element {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const hasRedirectedRef = useRef(false);

  const isMobile = useSyncExternalStore(
    subscribeToResize,
    getIsMobileSnapshot,
    getIsMobileServerSnapshot
  );

  // After sign-up, redirect to /welcome for role selection
  useEffect(() => {
    if (isSignedIn && user && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      onClose?.();
      setTimeout(() => {
        router.push("/welcome");
      }, 200);
    }
  }, [isSignedIn, user, router, onClose]);

  const handleClose = (): void => {
    onClose ? onClose() : router.push("/");
  };

  // =============== UI MOBILE ===============
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: COLORS.BG_WHITE }}
      >
        <div className="flex flex-col h-full">
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

          <div
            className="flex-1 flex items-center justify-center p-6"
            style={{ backgroundColor: COLORS.BG_GRAY }}
          >
            <div className="w-full max-w-sm">
              {isSignedIn && user ? (
                <div
                  className="p-5 rounded-xl border text-center space-y-3"
                  style={{
                    backgroundColor: COLORS.BG_WHITE,
                    borderColor: COLORS.BORDER,
                  }}
                >
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Compte créé ✅
                  </h2>
                  <p
                    className="text-sm"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Redirection en cours...
                  </p>
                </div>
              ) : (
                <>
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
                    <p
                      className="text-sm"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      Découvrez les fermes locales et soutenez les producteurs
                      près de chez vous
                    </p>
                  </div>

                  <SignUp
                    routing="hash"
                    signInUrl="#/sign-in"
                    fallbackRedirectUrl="/welcome"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =============== UI DESKTOP ===============
  return (
    <Modal isOpen={true} onClose={handleClose}>
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px] max-h-[80vh] overflow-hidden">
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
              vos producteurs favoris et soutenir l&apos;agriculture de
              proximité.
            </p>
          </div>
        </section>

        <main
          className="flex flex-col lg:col-span-7 xl:col-span-6 rounded-r-lg overflow-y-auto"
          style={{ backgroundColor: COLORS.BG_WHITE }}
        >
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md mx-auto">
              {isSignedIn && user ? (
                <div
                  className="p-6 rounded-xl border text-center space-y-3"
                  style={{
                    backgroundColor: COLORS.BG_WHITE,
                    borderColor: COLORS.BORDER,
                  }}
                >
                  <h2
                    className="text-xl font-bold"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Compte créé ✅
                  </h2>
                  <p style={{ color: COLORS.TEXT_SECONDARY }}>
                    Redirection en cours...
                  </p>
                </div>
              ) : (
                <SignUp
                  routing="hash"
                  signInUrl="#/sign-in"
                  fallbackRedirectUrl="/welcome"
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </Modal>
  );
}
