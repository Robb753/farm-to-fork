"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  MapPin,
  Bell,
  Settings,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { AvatarImage } from "@/components/ui/OptimizedImage";
import { useUserRole, useUserActions } from "@/lib/store/userStore";

import dynamic from "next/dynamic";
const MapboxCitySearch = dynamic(
  () => import("@/app/modules/maps/components/shared/MapboxCitySearch"),
  { ssr: false }
);
import useCitySearchControl from "@/app/modules/maps/hooks/useCitySearchControl";

/* ----------------------- Modal mobile ----------------------- */
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
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50">{children}</div>
      </div>
    </div>
  );
};

/* ----------------------- Header ----------------------- */
export default function HeaderMobile() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const role = useUserRole();
  const { reset } = useUserActions();

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [searchCity, setSearchCity] = useState("");
  const { handleCitySelect } = useCitySearchControl({ setSearchCity });

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
    setShowMobileMenu(false);
  };
  const openSignUp = () => {
    window.dispatchEvent(new CustomEvent("openSignupModal"));
    setShowMobileMenu(false);
  };

  const getUserAvatarUrl = () => user?.imageUrl || "/default-avatar.png";
  const getUserDisplayName = () => {
    if (!user) return "Utilisateur";
    if (user.fullName) return user.fullName;
    if (user.firstName) return user.firstName;
    const email = user.primaryEmailAddress?.emailAddress;
    return email ? email.split("@")[0] : "Utilisateur";
  };
  const getRoleLabel = () =>
    role === "admin"
      ? "Administrateur"
      : role === "farmer"
        ? "Agriculteur"
        : "Utilisateur";

  if (!isClient || !isLoaded) {
    return (
      <header className="fixed left-0 right-0 top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-10 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </header>
    );
  }

  return (
    <>
      {/* --- Header principal avec recherche intégrée --- */}
      <header className="fixed left-0 right-0 top-0 z-40 border-b bg-white/95 backdrop-blur">
        <div className="flex items-center gap-2 px-3 py-2 max-w-screen-sm mx-auto w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 pl-1 shrink-0">
            <Image
              src="/logof2f.svg"
              alt="Farm to Fork"
              width={28}
              height={28}
              priority
              className="h-7 w-auto"
            />
            <span className="hidden xs:block text-base font-bold text-green-700">
              Farm To Fork
            </span>
          </Link>

          {/* Barre de recherche ville */}
          <div className="mx-2 flex-1 min-w-0">
            <MapboxCitySearch
              placeholder="Rechercher une ville…"
              onCitySelect={handleCitySelect}
              className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 px-4
                   focus:border-green-300 focus:bg-white focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Actions à droite */}
          {!isSignedIn ? (
            <button
              onClick={() => setShowMobileMenu(true)}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-2 shadow-sm transition-colors hover:bg-gray-50"
              aria-label="Menu & connexion"
            >
              <Menu className="h-4 w-4" />
              <LogIn className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1 shrink-0">
              {/* Favoris */}
              <Link
                href="/user#favorites"
                className="relative rounded-lg p-2 text-gray-600 transition-all hover:bg-gray-50 hover:text-red-500"
                aria-label="Favoris"
              >
                <Heart className="h-5 w-5" />
              </Link>

              {/* Notifications */}
              <button
                className="relative rounded-lg p-2 text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500" />
              </button>

              {/* Dropdown utilisateur */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-2 shadow-sm transition-colors hover:bg-gray-50">
                    <AvatarImage
                      src={getUserAvatarUrl()}
                      alt={`Photo de ${getUserDisplayName()}`}
                      size={24}
                      className="ring-1 ring-green-100"
                      fallbackSrc="/default-avatar.png"
                    />
                    <span className="hidden max-w-20 truncate text-sm font-medium text-gray-700 xs:block">
                      {getUserDisplayName().split(" ")[0]}
                    </span>
                    <ChevronDown className="hidden h-3 w-3 text-gray-500 xs:block" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-72 p-2">
                  <DropdownMenuLabel className="p-3">
                    <div className="flex items-center gap-3">
                      <AvatarImage
                        src={getUserAvatarUrl()}
                        alt={`Photo de ${getUserDisplayName()}`}
                        size={40}
                        className="ring-2 ring-green-100"
                        fallbackSrc="/default-avatar.png"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-gray-900">
                          {getUserDisplayName()}
                        </div>
                        <div className="truncate text-sm text-gray-500">
                          {user?.primaryEmailAddress?.emailAddress}
                        </div>
                        <div className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          {getRoleLabel()}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/user" className="flex items-center gap-3 p-3">
                      <User className="h-5 w-5 text-gray-600" />
                      <span>Mon profil</span>
                    </Link>
                  </DropdownMenuItem>

                  {role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 p-3"
                      >
                        <ListChecks className="h-5 w-5 text-gray-600" />
                        <span>Administration</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {role === "farmer" && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard/farms"
                        className="flex items-center gap-3 p-3"
                      >
                        <svg
                          className="h-5 w-5 text-gray-600"
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
                      className="flex items-center gap-3 p-3"
                    >
                      <Heart className="h-5 w-5 text-red-500" />
                      <span>Mes favoris</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/user#settings"
                      className="flex items-center gap-3 p-3"
                    >
                      <Settings className="h-5 w-5 text-gray-600" />
                      <span>Paramètres</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await handleSignOut();
                    }}
                    className="flex items-center gap-3 p-3 text-red-600 focus:text-red-600"
                  >
                    <LogIn className="h-5 w-5 -rotate-180" />
                    <span>Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      {/* --- Modal mobile pour utilisateurs non connectés --- */}
      <MobileModal
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      >
        <div className="space-y-6 p-6">
          {/* Section principale */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <span className="text-2xl">🌱</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Rejoignez Farm To Fork
            </h3>
            <p className="text-sm text-gray-600">
              Découvrez les producteurs locaux près de chez vous
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="space-y-3">
            <button
              onClick={openSignUp}
              className="w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition-colors hover:bg-green-700"
            >
              <span className="inline-flex items-center gap-3">
                <PlusCircle className="h-5 w-5" />
                Créer un compte
              </span>
            </button>

            <button
              onClick={openSignIn}
              className="w-full rounded-lg border border-green-600 px-4 py-3 font-medium text-green-600 transition-colors hover:bg-green-50"
            >
              <span className="inline-flex items-center gap-3">
                <LogIn className="h-5 w-5" />
                Se connecter
              </span>
            </button>
          </div>

          {/* Navigation */}
          <div className="border-t border-gray-200 pt-6">
            <div className="space-y-3">
              <Link
                href="/explore"
                className="flex items-center gap-3 rounded-lg p-3 text-gray-700 transition-colors hover:bg-white"
                onClick={() => setShowMobileMenu(false)}
              >
                <MapPin className="h-5 w-5 text-green-600" />
                <span>Explorer la carte</span>
              </Link>

              <Link
                href="/discover/producteurs"
                className="flex items-center gap-3 rounded-lg p-3 text-gray-700 transition-colors hover:bg-white"
                onClick={() => setShowMobileMenu(false)}
              >
                <User className="h-5 w-5 text-green-600" />
                <span>Producteurs</span>
              </Link>

              <Link
                href="/become-farmer"
                className="flex items-center gap-3 rounded-lg p-3 text-gray-700 transition-colors hover:bg-white"
                onClick={() => setShowMobileMenu(false)}
              >
                <PlusCircle className="h-5 w-5 text-green-600" />
                <span>Devenir producteur</span>
              </Link>
            </div>
          </div>
        </div>
      </MobileModal>

      {/* Spacer pour compenser le header fixe */}
      <div className="h-16" />
    </>
  );
}
