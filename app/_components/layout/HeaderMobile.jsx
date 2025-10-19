// components/layout/HeaderMobile.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogIn,
  Menu,
  User,
  Heart,
  PlusCircle,
  ListChecks,
  X,
  ChevronDown,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { AvatarImage } from "@/components/ui/OptimizedImage";
import Image from "next/image";
// ✅ Utiliser le store Zustand au lieu de useUserSync
import {
  useUserRole,
  useUserSyncState,
  useUserActions,
} from "@/lib/store/userStore";

const MobileModal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = isOpen ? "hidden" : "unset";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default function HeaderMobile() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();

  // ✅ Utiliser les hooks Zustand au lieu de useUserSync
  const role = useUserRole();
  const { isReady } = useUserSyncState();
  const { reset } = useUserActions();

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // S'assurer que le composant est monté côté client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ Gestion de la déconnexion avec reset du store
  const handleSignOut = async () => {
    try {
      reset(); // Réinitialiser le store Zustand
      await signOut();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  // ✅ Fonctions d'ouverture de modales (utilisation des événements globaux)
  const openSignIn = () => {
    window.dispatchEvent(new CustomEvent("openSigninModal"));
    setShowMobileMenu(false);
  };

  const openSignUp = () => {
    window.dispatchEvent(new CustomEvent("openSignupModal"));
    setShowMobileMenu(false);
  };

  const getUserAvatarUrl = () => {
    if (!user) return "/default-avatar.png";
    return user.imageUrl || "/default-avatar.png";
  };

  const getUserDisplayName = () => {
    if (!user) return "Utilisateur";
    if (user.fullName) return user.fullName;
    if (user.firstName) return user.firstName;
    const email = user.primaryEmailAddress?.emailAddress;
    return email ? email.split("@")[0] : "Utilisateur";
  };

  const getRoleLabel = () => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "farmer":
        return "Agriculteur";
      default:
        return "Utilisateur";
    }
  };

  // Afficher un état de chargement pendant l'hydratation
  if (!isClient || !isLoaded || !isReady) {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center">
            <Image
              src="/logof2f.svg"
              alt="Logo Farm to Fork"
              width={40}
              height={40}
              priority
              className="mr-2"
              style={{ width: "auto", height: "40px" }}
            />
            <span className="text-lg font-medium text-green-600 tracking-tight">
              Farm To Fork
            </span>
          </Link>
          <div className="w-10 h-8 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logof2f.svg"
              alt="Logo Farm to Fork"
              width={40}
              height={40}
              priority
              className="mr-2"
              style={{ width: "auto", height: "40px" }}
            />
            <span className="text-lg font-medium text-green-600 tracking-tight">
              Farm To Fork
            </span>
          </Link>

          {/* Menu ou utilisateur */}
          {!isSignedIn ? (
            <button
              onClick={() => setShowMobileMenu(true)}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg shadow-sm hover:bg-gray-50"
            >
              <Menu className="w-4 h-4" />
              <LogIn className="w-4 h-4" />
            </button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-2 border rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                  <AvatarImage
                    src={getUserAvatarUrl()}
                    alt={`Photo de ${getUserDisplayName()}`}
                    size={24}
                    className="ring-1 ring-green-100"
                    fallbackSrc="/default-avatar.png"
                  />
                  <span className="text-sm font-medium text-gray-700 max-w-20 truncate">
                    {getUserDisplayName().split(" ")[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-64 p-2 bg-white border rounded-lg"
              >
                <DropdownMenuLabel className="text-lg font-medium py-3 text-gray-800 px-4">
                  <div className="flex items-center gap-3">
                    <AvatarImage
                      src={getUserAvatarUrl()}
                      alt={`Photo de ${getUserDisplayName()}`}
                      size={32}
                      className="ring-2 ring-green-100"
                      fallbackSrc="/default-avatar.png"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {getUserDisplayName()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getRoleLabel()}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuItem asChild className="py-3 hover:bg-gray-50">
                  <Link href="/user" className="flex items-center gap-3 px-4">
                    <User className="w-5 h-5 text-green-600" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>

                {role === "admin" && (
                  <DropdownMenuItem asChild className="py-3 hover:bg-gray-50">
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4"
                    >
                      <ListChecks className="w-5 h-5 text-green-600" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {role === "farmer" && (
                  <DropdownMenuItem asChild className="py-3 hover:bg-gray-50">
                    <Link
                      href="/dashboard/farms"
                      className="flex items-center gap-3 px-4"
                    >
                      <svg
                        className="w-5 h-5 text-green-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild className="py-3 hover:bg-gray-50">
                  <Link
                    href="/user#favorites"
                    className="flex items-center gap-3 px-4"
                  >
                    <Heart className="w-5 h-5 text-red-500" />
                    <span>Mes favoris</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="py-3 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="w-full flex items-center gap-3 px-4">
                    <LogIn className="w-5 h-5 text-green-600 rotate-180" />
                    <span>Se déconnecter</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <MobileModal
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      >
        <div className="p-4 space-y-4">
          <Link
            href="/become-farmer"
            className="block w-full text-center bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 p-4"
            onClick={() => setShowMobileMenu(false)}
          >
            Devenir producteur
          </Link>
          <div className="space-y-3">
            <button
              onClick={openSignUp}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              <PlusCircle className="w-5 h-5" />
              S'inscrire
            </button>

            <button
              onClick={openSignIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50"
            >
              <LogIn className="w-5 h-5" />
              Se connecter
            </button>
          </div>
        </div>
      </MobileModal>

      {/* Spacer pour compenser le header fixe */}
      <div className="h-16" />
    </>
  );
}
