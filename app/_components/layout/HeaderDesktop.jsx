// components/layout/HeaderDesktop.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { LogIn, PlusCircle, ListChecks, Heart, User, Menu } from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { AvatarImage } from "@/components/ui/OptimizedImage";
// ✅ Utiliser le bon store Zustand au lieu du contexte
import {
  useUserRole,
  useUserSyncState,
  useUserActions,
} from "@/lib/store/userStore";

export default function HeaderDesktop() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();

  // ✅ Utiliser les hooks Zustand au lieu du contexte
  const role = useUserRole();
  const { isReady } = useUserSyncState();
  const { reset } = useUserActions();

  const [isClient, setIsClient] = useState(false);

  // S'assurer que le composant est monté côté client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ Gestion simplifiée de la déconnexion avec reset du store
  const handleSignOut = async () => {
    try {
      reset(); // Réinitialiser le store Zustand
      await signOut();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  // ✅ Fonctions d'ouverture de modales simplifiées
  const openSignIn = () => {
    window.dispatchEvent(new CustomEvent("openSigninModal"));
  };

  const openSignUp = () => {
    window.dispatchEvent(new CustomEvent("openSignupModal"));
  };

  // ✅ Utilitaires pour l'avatar et le nom
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

  // ✅ État de chargement simplifié
  if (!isClient || !isLoaded || !isReady) {
    return (
      <header className="flex items-center justify-between px-6 py-3 bg-white shadow-sm border-b z-40">
        <Image
          src="/logof2f.svg"
          alt="Logo Farm to Fork"
          width={60}
          height={60}
          priority
          style={{ width: "auto", height: "60px" }}
        />
        <div className="flex items-center gap-6">
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white shadow-sm border-b z-40">
      {/* Logo */}
      <Link href="/">
        <Image
          src="/logof2f.svg"
          alt="Logo Farm to Fork"
          width={60}
          height={60}
          priority
          style={{ width: "auto", height: "60px" }}
        />
      </Link>

      <div className="flex items-center gap-6">
        <Link
          href="/become-farmer"
          className="text-sm text-green-600 font-medium hover:underline"
        >
          Devenir producteur
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 border rounded-md shadow-sm hover:bg-gray-50 transition">
              <Menu className="w-5 h-5" />
              {!isSignedIn ? (
                <LogIn className="w-5 h-5" />
              ) : (
                <AvatarImage
                  src={getUserAvatarUrl()}
                  alt={`Photo de ${getUserDisplayName()}`}
                  size={28}
                  className="ring-2 ring-green-100"
                  fallbackSrc="/default-avatar.png"
                />
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-72 p-2 bg-white border shadow-md"
          >
            {!isSignedIn ? (
              <>
                <DropdownMenuItem
                  onClick={openSignUp}
                  className="cursor-pointer py-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 px-4">
                    <PlusCircle className="w-5 h-5 text-green-600" />
                    <span>S'inscrire</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={openSignIn}
                  className="cursor-pointer py-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 px-4">
                    <LogIn className="w-5 h-5 text-green-600" />
                    <span>Se connecter</span>
                  </div>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuLabel className="text-lg font-medium px-4 py-3">
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
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
