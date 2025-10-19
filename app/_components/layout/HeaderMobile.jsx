// components/layout/HeaderMobile.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  Search,
  MapPin,
  Bell,
  Settings,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { AvatarImage } from "@/components/ui/OptimizedImage";
import Image from "next/image";
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
        <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50">{children}</div>
      </div>
    </div>
  );
};

export default function HeaderMobile() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const role = useUserRole();
  const { isReady } = useUserSyncState();
  const { reset } = useUserActions();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  if (!isClient || !isLoaded) {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="w-32 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-10 h-8 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-b">
        <div className="flex items-center justify-between px-4 py-3">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logof2f.svg"
              alt="Farm to Fork"
              width={32}
              height={32}
              priority
              className="w-auto h-8"
            />
            <span className="text-lg font-bold text-green-700 hidden xs:block">
              Farm To Fork
            </span>
          </Link>

          {/* Actions droite */}
          <div className="flex items-center gap-2">
            
            {/* Recherche mobile */}
            <Link 
              href="/explore"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Menu utilisateur ou connexion */}
            {!isSignedIn ? (
              <button
                onClick={() => setShowMobileMenu(true)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Menu className="w-4 h-4" />
                <LogIn className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                
                {/* Favoris */}
                <Link
                  href="/user#favorites"
                  className="p-2 text-gray-600 hover:text-red-500 hover:bg-gray-50 rounded-lg transition-all relative"
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
                    <button className="flex items-center gap-2 px-2 py-2 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                      <AvatarImage
                        src={getUserAvatarUrl()}
                        alt={`Photo de ${getUserDisplayName()}`}
                        size={24}
                        className="ring-1 ring-green-100"
                        fallbackSrc="/default-avatar.png"
                      />
                      <span className="text-sm font-medium text-gray-700 max-w-20 truncate hidden xs:block">
                        {getUserDisplayName().split(" ")[0]}
                      </span>
                      <ChevronDown className="w-3 h-3 text-gray-500 hidden xs:block" />
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
                      <Link href="/user" className="flex items-center gap-3 p-3">
                        <User className="w-5 h-5 text-gray-600" />
                        <span>Mon profil</span>
                      </Link>
                    </DropdownMenuItem>

                    {role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-3 p-3">
                          <ListChecks className="w-5 h-5 text-gray-600" />
                          <span>Administration</span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {role === "farmer" && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/farms" className="flex items-center gap-3 p-3">
                          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>Ma ferme</span>
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild>
                      <Link href="/user#favorites" className="flex items-center gap-3 p-3">
                        <Heart className="w-5 h-5 text-red-500" />
                        <span>Mes favoris</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/become-farmer" className="flex items-center gap-3 p-3">
                        <PlusCircle className="w-5 h-5 text-green-600" />
                        <span>Devenir producteur</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href="/user#settings" className="flex items-center gap-3 p-3">
                        <Settings className="w-5 h-5 text-gray-600" />
                        <span>Paramètres</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="flex items-center gap-3 p-3 text-red-600 focus:text-red-600"
                    >
                      <LogIn className="w-5 h-5 rotate-180" />
                      <span>Se déconnecter</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal mobile pour utilisateurs non connectés */}
      <MobileModal
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      >
        <div className="p-6 space-y-6">
          
          {/* Section principale */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🌱</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Rejoignez Farm To Fork
            </h3>
            <p className="text-gray-600 text-sm">
              Découvrez les producteurs locaux près de chez vous
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="space-y-3">
            <button
              onClick={openSignUp}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              Créer un compte
            </button>

            <button
              onClick={openSignIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Se connecter
            </button>
          </div>

          {/* Navigation */}
          <div className="border-t border-gray-200 pt-6">
            <div className="space-y-3">
              <Link
                href="/explore"
                className="flex items-center gap-3 p-3 text-gray-700 hover:bg-white rounded-lg transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <MapPin className="w-5 h-5 text-green-600" />
                <span>Explorer la carte</span>
              </Link>
              
              <Link
                href="/discover/producteurs"
                className="flex items-center gap-3 p-3 text-gray-700 hover:bg-white rounded-lg transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <User className="w-5 h-5 text-green-600" />
                <span>Producteurs</span>
              </Link>

              <Link
                href="/become-farmer"
                className="flex items-center gap-3 p-3 text-gray-700 hover:bg-white rounded-lg transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <PlusCircle className="w-5 h-5 text-green-600" />
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