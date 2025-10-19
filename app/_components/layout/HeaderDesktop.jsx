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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  LogIn,
  PlusCircle,
  ListChecks,
  Heart,
  User,
  Menu,
  Search,
  MapPin,
  Bell,
  Settings,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { AvatarImage } from "@/components/ui/OptimizedImage";
import {
  useUserRole,
  useUserSyncState,
  useUserActions,
} from "@/lib/store/userStore";

export default function HeaderDesktop() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const role = useUserRole();
  const { isReady } = useUserSyncState();
  const { reset } = useUserActions();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSignOut = async () => {
    try {
      reset();
      await signOut();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const openSignIn = () => {
    window.dispatchEvent(new CustomEvent("openSigninModal"));
  };

  const openSignUp = () => {
    window.dispatchEvent(new CustomEvent("openSignupModal"));
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

  if (!isClient || !isLoaded) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="w-32 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Logo et Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logof2f.svg"
              alt="Farm to Fork"
              width={40}
              height={40}
              priority
              className="w-auto h-10"
            />
            <span className="text-xl font-bold text-green-700 hidden sm:block">
              Farm To Fork
            </span>
          </Link>

          {/* Navigation principale */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/explore"
              className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors flex items-center gap-1"
            >
              <MapPin className="w-4 h-4" />
              Explorer
            </Link>
            <Link
              href="/discover/producteurs"
              className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
            >
              Producteurs
            </Link>
            <Link
              href="/discover/produits"
              className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
            >
              Produits
            </Link>
          </nav>
        </div>

        {/* Actions droite */}
        <div className="flex items-center gap-4">
          {/* Barre de recherche compacte */}
          <div className="hidden lg:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-100 transition-all"
              />
            </div>
          </div>

          {/* Devenir producteur */}
          <Link
            href="/become-farmer"
            className="hidden md:flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 px-3 py-2 rounded-lg hover:bg-green-50 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Devenir producteur
          </Link>

          {/* Menu utilisateur */}
          {!isSignedIn ? (
            <div className="flex items-center gap-2">
              <button
                onClick={openSignIn}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Se connecter
              </button>
              <button
                onClick={openSignUp}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                S'inscrire
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Favoris */}
              <Link
                href="/user#favorites"
                className="p-2 text-gray-600 hover:text-red-500 hover:bg-gray-50 rounded-lg transition-all relative"
                title="Mes favoris"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Notifications */}
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>

              {/* Dropdown utilisateur */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-lg transition-colors">
                    <AvatarImage
                      src={getUserAvatarUrl()}
                      alt={`Photo de ${getUserDisplayName()}`}
                      size={36}
                      className="ring-2 ring-gray-100 hover:ring-green-200 transition-all"
                      fallbackSrc="/default-avatar.png"
                    />
                    <div className="hidden lg:block text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {getUserDisplayName()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getRoleLabel()}
                      </div>
                    </div>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-64 p-2">
                  <DropdownMenuLabel className="p-3">
                    <div className="flex items-center gap-3">
                      <AvatarImage
                        src={getUserAvatarUrl()}
                        alt={`Photo de ${getUserDisplayName()}`}
                        size={40}
                        className="ring-2 ring-green-100"
                        fallbackSrc="/default-avatar.png"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {getUserDisplayName()}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {user?.primaryEmailAddress?.emailAddress}
                        </div>
                        <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                          {getRoleLabel()}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link
                      href="/user"
                      className="flex items-center gap-3 p-3 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-gray-600" />
                      <span>Mon profil</span>
                    </Link>
                  </DropdownMenuItem>

                  {role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 p-3 cursor-pointer"
                      >
                        <ListChecks className="w-4 h-4 text-gray-600" />
                        <span>Administration</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {role === "farmer" && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard/farms"
                        className="flex items-center gap-3 p-3 cursor-pointer"
                      >
                        <svg
                          className="w-4 h-4 text-gray-600"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>Ma ferme</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem asChild>
                    <Link
                      href="/user#favorites"
                      className="flex items-center gap-3 p-3 cursor-pointer"
                    >
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>Mes favoris</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/user#settings"
                      className="flex items-center gap-3 p-3 cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                      <span>Paramètres</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-3 p-3 cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogIn className="w-4 h-4 rotate-180" />
                    <span>Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
