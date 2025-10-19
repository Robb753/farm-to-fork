import React, { useState, useEffect } from "react";
import { SignIn, SignUp } from "@clerk/nextjs";
import {
  X,
  User,
  Tractor,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useUserActions } from "@/lib/store/userStore";

// Hook pour gérer l'état global de l'auth
const useAuthModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("welcome");
  const [selectedRole, setSelectedRole] = useState("user");

  useEffect(() => {
    const handleOpenSignin = () => {
      setMode("signin");
      setIsOpen(true);
    };

    const handleOpenSignup = () => {
      setMode("welcome");
      setIsOpen(true);
    };

    // 🔥 FIX: Gestion de l'échappement
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setMode("welcome");
        setSelectedRole("user");
      }
    };

    window.addEventListener("openSigninModal", handleOpenSignin);
    window.addEventListener("openSignupModal", handleOpenSignup);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("openSigninModal", handleOpenSignin);
      window.removeEventListener("openSignupModal", handleOpenSignup);
      document.removeEventListener("keydown", handleKeyDown);
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

// Composant principal du système d'auth
export default function ModernAuthSystem() {
  const { isOpen, mode, selectedRole, setIsOpen, setMode, setSelectedRole } =
    useAuthModal();

  const { user } = useUser();
  const { setRole } = useUserActions();

  const [farmerRequestData, setFarmerRequestData] = useState({
    farmName: "",
    location: "",
    phone: "",
    description: "",
  });

  // Gérer la fermeture automatique après connexion/inscription
  useEffect(() => {
    if (user && isOpen) {
      closeModal();
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const closeModal = () => {
    setIsOpen(false);
    setMode("welcome");
    setSelectedRole("user");
    setFarmerRequestData({
      farmName: "",
      location: "",
      phone: "",
      description: "",
    });
  };

  // 🔥 FIX: Gestion du clic sur le backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const selectRole = (role) => {
    setSelectedRole(role);
    setRole(role);
  };

  // Étape 1: Écran d'accueil avec choix du profil
  const WelcomeStep = () => (
    <div className="p-8 text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-xl">🌱</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Rejoignez Farm To Fork
        </h2>
        <p className="text-xs text-gray-600">
          Comment souhaitez-vous utiliser notre plateforme ?
        </p>
      </div>

      <div className="space-y-3 mb-8">
        <button
          onClick={() => {
            selectRole("user");
            setMode("signup");
          }}
          className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all text-left group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Consommateur</h3>
              <p className="text-sm text-gray-500">
                Je cherche des producteurs locaux
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
          </div>
        </button>

        <button
          onClick={() => {
            selectRole("farmer");
            setMode("farmer-request");
          }}
          className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all text-left group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200">
              <Tractor className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Producteur</h3>
              <p className="text-sm text-gray-500">
                Je veux vendre mes produits
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
          </div>
        </button>
      </div>

      <div className="border-t pt-6">
        <p className="text-sm text-gray-500 mb-4">Déjà un compte ?</p>
        <button
          onClick={() => setMode("signin")}
          className="text-green-600 hover:text-green-700 font-medium"
        >
          Se connecter
        </button>
      </div>
    </div>
  );

  // Étape 2: Collecte des infos producteur
  const FarmerRequestStep = () => (
    <div className="p-8">
      <div className="mb-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Tractor className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Parlez-nous de votre ferme
        </h2>
        <p className="text-gray-600">
          Ces informations nous aideront à valider votre demande
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Ex: Ferme du Soleil"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Localisation *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={farmerRequestData.location}
              onChange={(e) =>
                setFarmerRequestData((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Ville, département"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Téléphone
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={farmerRequestData.phone}
              onChange={(e) =>
                setFarmerRequestData((prev) => ({
                  ...prev,
                  phone: e.target.value,
                }))
              }
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="06 12 34 56 78"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            rows={4}
            placeholder="Décrivez votre ferme, vos produits, vos pratiques..."
          />
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={() => setMode("welcome")}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Retour
        </button>
        <button
          onClick={() => setMode("signup")}
          disabled={
            !farmerRequestData.farmName ||
            !farmerRequestData.location ||
            !farmerRequestData.description
          }
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continuer
        </button>
      </div>
    </div>
  );

  // Étape 3: Inscription Clerk
  const SignupStep = () => (
    <div className="p-8">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {selectedRole === "farmer"
            ? "Créer votre compte producteur"
            : "Créer votre compte"}
        </h2>
        <p className="text-gray-600 text-sm">
          {selectedRole === "farmer"
            ? "Dernière étape avant de pouvoir publier votre ferme"
            : "Rejoignez la communauté Farm To Fork"}
        </p>
      </div>

      <SignUp
        routing="hash"
        signInUrl="#/sign-in"
        appearance={{
          elements: {
            formButtonPrimary: "bg-green-600 hover:bg-green-700",
            card: "shadow-none border-0",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            footerAction: "hidden",
          },
        }}
        afterSignUpUrl="/"
        additionalOAuthScopes={{
          google: ["profile", "email"],
        }}
        unsafeMetadata={{
          role: selectedRole,
          farmerData: selectedRole === "farmer" ? farmerRequestData : null,
        }}
      />

      <div className="mt-4 text-center">
        <button
          onClick={() =>
            setMode(selectedRole === "farmer" ? "farmer-request" : "welcome")
          }
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Retour
        </button>
      </div>
    </div>
  );

  // Étape 4: Connexion Clerk
  const SigninStep = () => (
    <div className="p-6">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Bon retour sur Farm To Fork
        </h2>
        <p className="text-gray-600 text-sm">
          Connectez-vous pour accéder à votre espace
        </p>
      </div>

      <SignIn
        routing="hash"
        signUpUrl="#/sign-up"
        appearance={{
          elements: {
            formButtonPrimary: "bg-green-600 hover:bg-green-700",
            card: "shadow-none border-0",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            footerActionLink: "text-green-600 hover:text-green-700",
            footerAction: "hidden", // ✅ Cache le texte dupliqué en bas
          },
        }}
        afterSignInUrl="/"
      />

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500 mb-2">Pas encore de compte ?</p>
        <button
          onClick={() => setMode("welcome")}
          className="text-green-600 hover:text-green-700 font-medium text-sm"
        >
          Créer un compte
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl max-w-md w-full relative overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* 🔥 FIX: Header avec fermeture plus petit et mieux positionné */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={closeModal}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors bg-white/90 backdrop-blur-sm"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* 🔥 FIX: Image de fond avec overlay plus petit */}


        {/* Contenu dynamique */}
        <div className="relative bg-white">
          {mode === "welcome" && <WelcomeStep />}
          {mode === "farmer-request" && <FarmerRequestStep />}
          {mode === "signup" && <SignupStep />}
          {mode === "signin" && <SigninStep />}
        </div>
      </div>
    </div>
  );
}
