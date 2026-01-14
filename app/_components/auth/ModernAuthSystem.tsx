// app/_components/auth/ModernAuthSystem.tsx
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  MouseEvent,
  KeyboardEvent,
} from "react";
import { SignIn, SignUp, useUser } from "@clerk/nextjs";
import { X, User, Tractor, ChevronRight, Phone, MapPin } from "lucide-react";
import { useUserActions } from "@/lib/store/userStore";
import { COLORS, PATHS } from "@/lib/config";

// Types TypeScript
interface FarmerRequestData {
  farmName: string;
  location: string;
  phoneNumber: string;
  description: string;
}

type AuthMode = "welcome" | "farmer-request" | "signup" | "signin";
type UserRole = "user" | "farmer";

interface AuthModalState {
  isOpen: boolean;
  mode: AuthMode;
  selectedRole: UserRole;
  setIsOpen: (open: boolean) => void;
  setMode: (mode: AuthMode) => void;
  setSelectedRole: (role: UserRole) => void;
}

// Hook pour gérer l'état global de l'auth
const useAuthModal = (): AuthModalState => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("welcome");
  const [selectedRole, setSelectedRole] = useState<UserRole>("user");

  useEffect(() => {
    const handleOpenSignin = () => {
      setMode("signin");
      setIsOpen(true);
    };

    const handleOpenSignup = () => {
      setMode("welcome");
      setIsOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        // OK : event handler (pas un effect qui setState)
        setIsOpen(false);
        setMode("welcome");
        setSelectedRole("user");
      }
    };

    window.addEventListener("openSigninModal", handleOpenSignin as any);
    window.addEventListener("openSignupModal", handleOpenSignup as any);
    document.addEventListener("keydown", handleKeyDown as any);

    return () => {
      window.removeEventListener("openSigninModal", handleOpenSignin as any);
      window.removeEventListener("openSignupModal", handleOpenSignup as any);
      document.removeEventListener("keydown", handleKeyDown as any);
    };
  }, [isOpen]);

  return {
    isOpen,
    mode,
    selectedRole,
    setIsOpen,
    setMode,
    setSelectedRole,
  };
};

/* -------------------------------------------------------------------------- */
/*                              Steps (outside)                               */
/* -------------------------------------------------------------------------- */

interface WelcomeStepProps {
  onSelectUser: () => void;
  onSelectFarmer: () => void;
  onGoSignin: () => void;
}

function WelcomeStep({
  onSelectUser,
  onSelectFarmer,
  onGoSignin,
}: WelcomeStepProps) {
  return (
    <div className="p-8 text-center">
      <div className="mb-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: COLORS.PRIMARY_BG }}
        >
          <span className="text-xl">🌱</span>
        </div>
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          Rejoignez Farm To Fork
        </h2>
        <p className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
          Comment souhaitez-vous utiliser notre plateforme ?
        </p>
      </div>

      <div className="space-y-3 mb-8">
        <button
          onClick={onSelectUser}
          className="w-full p-4 border-2 rounded-xl transition-all text-left group"
          style={{
            borderColor: COLORS.BORDER,
            backgroundColor: COLORS.BG_WHITE,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = COLORS.PRIMARY;
            e.currentTarget.style.backgroundColor = COLORS.PRIMARY_BG;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = COLORS.BORDER;
            e.currentTarget.style.backgroundColor = COLORS.BG_WHITE;
          }}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3
                className="font-semibold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Consommateur
              </h3>
              <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                Je cherche des producteurs locaux
              </p>
            </div>
            <ChevronRight
              className="w-5 h-5 transition-colors"
              style={{ color: COLORS.TEXT_MUTED }}
            />
          </div>
        </button>

        <button
          onClick={onSelectFarmer}
          className="w-full p-4 border-2 rounded-xl transition-all text-left group"
          style={{
            borderColor: COLORS.BORDER,
            backgroundColor: COLORS.BG_WHITE,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = COLORS.PRIMARY;
            e.currentTarget.style.backgroundColor = COLORS.PRIMARY_BG;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = COLORS.BORDER;
            e.currentTarget.style.backgroundColor = COLORS.BG_WHITE;
          }}
        >
          <div className="flex items-center space-x-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-green-200"
              style={{ backgroundColor: COLORS.PRIMARY_BG }}
            >
              <Tractor className="w-6 h-6" style={{ color: COLORS.PRIMARY }} />
            </div>
            <div className="flex-1">
              <h3
                className="font-semibold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Producteur
              </h3>
              <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                Je veux vendre mes produits
              </p>
            </div>
            <ChevronRight
              className="w-5 h-5 transition-colors"
              style={{ color: COLORS.TEXT_MUTED }}
            />
          </div>
        </button>
      </div>

      <div className="border-t pt-6" style={{ borderColor: COLORS.BORDER }}>
        <p className="text-sm mb-4" style={{ color: COLORS.TEXT_SECONDARY }}>
          Déjà un compte ?
        </p>
        <button
          onClick={onGoSignin}
          className="font-medium transition-colors"
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
  );
}

interface FarmerRequestStepProps {
  farmerRequestData: FarmerRequestData;
  setFarmerRequestData: React.Dispatch<React.SetStateAction<FarmerRequestData>>;
  onBack: () => void;
  onContinue: () => void;
}

function FarmerRequestStep({
  farmerRequestData,
  setFarmerRequestData,
  onBack,
  onContinue,
}: FarmerRequestStepProps) {
  const disabled =
    !farmerRequestData.farmName ||
    !farmerRequestData.location ||
    !farmerRequestData.description;

  return (
    <div className="p-8">
      <div className="mb-6 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: COLORS.PRIMARY_BG }}
        >
          <Tractor className="w-8 h-8" style={{ color: COLORS.PRIMARY }} />
        </div>
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          Parlez-nous de votre ferme
        </h2>
        <p style={{ color: COLORS.TEXT_SECONDARY }}>
          Ces informations nous aideront à valider votre demande
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Nom de votre ferme *
          </label>
          <input
            type="text"
            value={farmerRequestData.farmName}
            onChange={(e) =>
              setFarmerRequestData((prev) => ({
                ...prev,
                farmName: e.target.value,
              }))
            }
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-offset-0 outline-none"
            style={{
              borderColor: COLORS.BORDER,
              backgroundColor: COLORS.BG_WHITE,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.PRIMARY;
              e.currentTarget.style.boxShadow = `0 0 0 2px ${COLORS.PRIMARY}33`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.BORDER;
              e.currentTarget.style.boxShadow = "none";
            }}
            placeholder="Ex: Ferme du Soleil"
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Localisation *
          </label>
          <div className="relative">
            <MapPin
              className="absolute left-3 top-3 w-5 h-5"
              style={{ color: COLORS.TEXT_MUTED }}
            />
            <input
              type="text"
              value={farmerRequestData.location}
              onChange={(e) =>
                setFarmerRequestData((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
              className="w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-offset-0 outline-none"
              style={{
                borderColor: COLORS.BORDER,
                backgroundColor: COLORS.BG_WHITE,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.PRIMARY;
                e.currentTarget.style.boxShadow = `0 0 0 2px ${COLORS.PRIMARY}33`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.BORDER;
                e.currentTarget.style.boxShadow = "none";
              }}
              placeholder="Ville, département"
            />
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Téléphone
          </label>
          <div className="relative">
            <Phone
              className="absolute left-3 top-3 w-5 h-5"
              style={{ color: COLORS.TEXT_MUTED }}
            />
            <input
              type="tel"
              value={farmerRequestData.phoneNumber}
              onChange={(e) =>
                setFarmerRequestData((prev) => ({
                  ...prev,
                  phoneNumber: e.target.value,
                }))
              }
              className="w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-offset-0 outline-none"
              style={{
                borderColor: COLORS.BORDER,
                backgroundColor: COLORS.BG_WHITE,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.PRIMARY;
                e.currentTarget.style.boxShadow = `0 0 0 2px ${COLORS.PRIMARY}33`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.BORDER;
                e.currentTarget.style.boxShadow = "none";
              }}
              placeholder="06 12 34 56 78"
            />
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Description de votre activité *
          </label>
          <textarea
            value={farmerRequestData.description}
            onChange={(e) =>
              setFarmerRequestData((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-offset-0 outline-none"
            style={{
              borderColor: COLORS.BORDER,
              backgroundColor: COLORS.BG_WHITE,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.PRIMARY;
              e.currentTarget.style.boxShadow = `0 0 0 2px ${COLORS.PRIMARY}33`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.BORDER;
              e.currentTarget.style.boxShadow = "none";
            }}
            rows={4}
            placeholder="Décrivez votre ferme, vos produits, vos pratiques..."
          />
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 border rounded-lg transition-colors"
          style={{
            borderColor: COLORS.BORDER,
            color: COLORS.TEXT_SECONDARY,
            backgroundColor: COLORS.BG_WHITE,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.BG_GRAY;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.BG_WHITE;
          }}
        >
          Retour
        </button>

        <button
          onClick={onContinue}
          disabled={disabled}
          className="flex-1 px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: COLORS.PRIMARY,
            color: COLORS.BG_WHITE,
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
            }
          }}
        >
          Continuer
        </button>
      </div>
    </div>
  );
}

interface SignupStepProps {
  user: unknown;
  selectedRole: UserRole;
  farmerRequestData: FarmerRequestData;
  onBack: () => void;
}

function SignupStep({
  user,
  selectedRole,
  farmerRequestData,
  onBack,
}: SignupStepProps) {
  if (user) return null;

  return (
    <div className="p-8">
      <div className="mb-6 text-center">
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          {selectedRole === "farmer"
            ? "Créer votre compte producteur"
            : "Créer votre compte"}
        </h2>
        <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
          {selectedRole === "farmer"
            ? "Dernière étape avant de pouvoir publier votre ferme"
            : "Rejoignez la communauté Farm To Fork"}
        </p>
      </div>

      <SignUp
        routing="hash"
        signInUrl="#/sign-in"
        fallbackRedirectUrl={PATHS.HOME}
        forceRedirectUrl={PATHS.HOME}
        appearance={{
          elements: {
            formButtonPrimary: "bg-green-600 hover:bg-green-700",
            card: "shadow-none border-0",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            footerAction: "hidden",
          },
        }}
        unsafeMetadata={{
          role: selectedRole,
          farmerData: selectedRole === "farmer" ? farmerRequestData : null,
        }}
      />

      <div className="mt-4 text-center">
        <button
          onClick={onBack}
          className="text-sm transition-colors"
          style={{ color: COLORS.TEXT_SECONDARY }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
          }}
        >
          ← Retour
        </button>
      </div>
    </div>
  );
}

interface SigninStepProps {
  user: unknown;
  onGoWelcome: () => void;
}

function SigninStep({ user, onGoWelcome }: SigninStepProps) {
  if (user) return null;

  return (
    <div className="p-6">
      <div className="mb-6 text-center">
        <h2
          className="text-xl font-bold mb-2"
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
        signUpUrl="#/sign-up"
        fallbackRedirectUrl={PATHS.HOME}
        forceRedirectUrl={PATHS.HOME}
        appearance={{
          elements: {
            formButtonPrimary: "bg-green-600 hover:bg-green-700",
            card: "shadow-none border-0",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            footerActionLink: "text-green-600 hover:text-green-700",
            footerAction: "hidden",
          },
        }}
      />

      <div className="mt-4 text-center">
        <p className="text-sm mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
          Pas encore de compte ?
        </p>
        <button
          onClick={onGoWelcome}
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
  );
}

/* -------------------------------------------------------------------------- */
/*                             ModernAuthSystem                               */
/* -------------------------------------------------------------------------- */

export default function ModernAuthSystem() {
  const { isOpen, mode, selectedRole, setIsOpen, setMode, setSelectedRole } =
    useAuthModal();

  const { user } = useUser();
  const { setRole } = useUserActions();

  const [farmerRequestData, setFarmerRequestData] = useState<FarmerRequestData>(
    {
      farmName: "",
      location: "",
      phoneNumber: "",
      description: "",
    }
  );

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setMode("welcome");
    setSelectedRole("user");
    setFarmerRequestData({
      farmName: "",
      location: "",
      phoneNumber: "",
      description: "",
    });
  }, [setIsOpen, setMode, setSelectedRole]);

  const handleBackdropClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        closeModal();
      }
    },
    [closeModal]
  );

  const selectRole = useCallback(
    (role: UserRole) => {
      setSelectedRole(role);
      setRole(role);
    },
    [setSelectedRole, setRole]
  );

  const goSignin = useCallback(() => setMode("signin"), [setMode]);
  const goWelcome = useCallback(() => setMode("welcome"), [setMode]);

  const onSelectUser = useCallback(() => {
    selectRole("user");
    setMode("signup");
  }, [selectRole, setMode]);

  const onSelectFarmer = useCallback(() => {
    selectRole("farmer");
    setMode("farmer-request");
  }, [selectRole, setMode]);

  const onFarmerBack = useCallback(() => setMode("welcome"), [setMode]);
  const onFarmerContinue = useCallback(() => setMode("signup"), [setMode]);

  const onSignupBack = useCallback(() => {
    setMode(selectedRole === "farmer" ? "farmer-request" : "welcome");
  }, [setMode, selectedRole]);

  // ✅ IMPORTANT : pas d'effet qui ferme le modal.
  // Si l'utilisateur est connecté, on n'affiche juste pas le modal.
  if (!isOpen) return null;
  if (user) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="rounded-2xl max-w-md w-full relative overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: COLORS.BG_WHITE }}
      >
        {/* Header avec fermeture */}
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

        {/* Contenu dynamique */}
        <div className="relative" style={{ backgroundColor: COLORS.BG_WHITE }}>
          {mode === "welcome" && (
            <WelcomeStep
              onSelectUser={onSelectUser}
              onSelectFarmer={onSelectFarmer}
              onGoSignin={goSignin}
            />
          )}

          {mode === "farmer-request" && (
            <FarmerRequestStep
              farmerRequestData={farmerRequestData}
              setFarmerRequestData={setFarmerRequestData}
              onBack={onFarmerBack}
              onContinue={onFarmerContinue}
            />
          )}

          {mode === "signup" && (
            <SignupStep
              user={user}
              selectedRole={selectedRole}
              farmerRequestData={farmerRequestData}
              onBack={onSignupBack}
            />
          )}

          {mode === "signin" && (
            <SigninStep user={user} onGoWelcome={goWelcome} />
          )}
        </div>
      </div>
    </div>
  );
}
