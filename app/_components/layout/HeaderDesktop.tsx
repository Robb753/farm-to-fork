"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  LogIn,
  PlusCircle,
  ListChecks,
  Heart,
  User,
  MapPin,
  Bell,
  Settings,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { AvatarImage } from "@/components/ui/OptimizedImage";
import { useUserRole, useUserActions } from "@/lib/store/userStore";
import { COLORS } from "@/lib/config"; // ✅ IMPORT MANQUANT AJOUTÉ
import { cn } from "@/lib/utils";

/**
 * Interfaces TypeScript pour HeaderDesktop
 */
interface HeaderDesktopProps {
  showSearchInHeader?: boolean;
  className?: string;
}

interface UserDisplayInfo {
  avatarUrl: string;
  displayName: string;
  email: string | undefined;
  roleLabel: string;
}

type UserRole = "admin" | "farmer" | "user";

/**
 * Chargement dynamique de MapboxCitySearch
 */
const MapboxCitySearch = dynamic(
  () => import("@/app/modules/maps/components/shared/MapboxCitySearch"),
  {
    ssr: false,
    loading: () => (
      <div className="w-[380px] max-w-[40vw] h-10 rounded-full bg-gray-200 animate-pulse" />
    ),
  }
);

/**
 * Hook pour les informations utilisateur
 */
const useUserDisplayInfo = (): UserDisplayInfo => {
  const { user } = useUser();
  const role = useUserRole();

  const getUserAvatarUrl = useCallback((): string => {
    return user?.imageUrl || "/default-avatar.png";
  }, [user?.imageUrl]);

  const getUserDisplayName = useCallback((): string => {
    if (!user) return "Utilisateur";
    if (user.fullName) return user.fullName;
    if (user.firstName) return user.firstName;
    const email = user.primaryEmailAddress?.emailAddress;
    return email ? email.split("@")[0] : "Utilisateur";
  }, [user]);

  const getRoleLabel = useCallback((): string => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "farmer":
        return "Agriculteur";
      default:
        return "Utilisateur";
    }
  }, [role]);

  return {
    avatarUrl: getUserAvatarUrl(),
    displayName: getUserDisplayName(),
    email: user?.primaryEmailAddress?.emailAddress,
    roleLabel: getRoleLabel(),
  };
};

/**
 * Composant de navigation principale
 */
const MainNavigation: React.FC = () => (
  <nav className="hidden md:flex items-center space-x-6">
    <Link
      href="/explore"
      className="text-sm font-medium hover:text-green-600 transition-colors flex items-center gap-1"
      style={{ color: COLORS.TEXT_SECONDARY }}
    >
      <MapPin className="w-4 h-4" />
      Explorer
    </Link>
    <Link
      href="/discover/producteurs"
      className="text-sm font-medium hover:text-green-600 transition-colors"
      style={{ color: COLORS.TEXT_SECONDARY }}
    >
      Producteurs
    </Link>
    <Link
      href="/discover/produits"
      className="text-sm font-medium hover:text-green-600 transition-colors"
      style={{ color: COLORS.TEXT_SECONDARY }}
    >
      Produits
    </Link>
  </nav>
);

/**
 * Boutons d'authentification
 */
interface AuthButtonsProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({ onSignIn, onSignUp }) => (
  <div className="flex items-center gap-2">
    <button
      onClick={onSignIn}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:text-gray-800 transition-colors"
      style={{ color: COLORS.TEXT_SECONDARY }}
    >
      Se connecter
    </button>
    <button
      onClick={onSignUp}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:shadow-md"
      style={{ backgroundColor: COLORS.PRIMARY }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
      }}
    >
      <PlusCircle className="w-4 h-4" />
      S'inscrire
    </button>
  </div>
);

/**
 * Menu utilisateur simplifié
 */
interface UserMenuProps {
  userInfo: UserDisplayInfo;
  role: UserRole;
  onSignOut: () => Promise<void>;
}

const UserMenu: React.FC<UserMenuProps> = ({ userInfo, role, onSignOut }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const menuItems = [
    { href: "/user", icon: User, label: "Mon profil" },
    ...(role === "admin"
      ? [{ href: "/admin", icon: ListChecks, label: "Administration" }]
      : []),
    ...(role === "farmer"
      ? [{ href: "/dashboard/farms", icon: Settings, label: "Ma ferme" }]
      : []),
    { href: "/user#favorites", icon: Heart, label: "Mes favoris" },
    { href: "/user#settings", icon: Settings, label: "Paramètres" },
  ];

  return (
    <div className="flex items-center gap-3">
      {/* Favoris */}
      <Link
        href="/user#favorites"
        className="p-2 rounded-lg hover:text-red-500 hover:bg-gray-100 transition-all"
        style={{ color: COLORS.TEXT_SECONDARY }}
        title="Mes favoris"
      >
        <Heart className="w-5 h-5" />
      </Link>

      {/* Notifications */}
      <button
        className="p-2 rounded-lg hover:bg-gray-100 transition-all relative"
        style={{ color: COLORS.TEXT_SECONDARY }}
      >
        <Bell className="w-5 h-5" />
        <span
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{ backgroundColor: COLORS.ERROR }}
        />
      </button>

      {/* Menu utilisateur */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none"
        >
          <AvatarImage
            src={userInfo.avatarUrl}
            alt={`Photo de ${userInfo.displayName}`}
            size={36}
            className="ring-2 ring-gray-100 hover:ring-green-200 transition-all"
            fallbackSrc="/default-avatar.png"
          />
          <div className="hidden lg:block text-left">
            <div
              className="text-sm font-medium"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {userInfo.displayName}
            </div>
            <div className="text-xs" style={{ color: COLORS.TEXT_SECONDARY }}>
              {userInfo.roleLabel}
            </div>
          </div>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-64 rounded-xl shadow-xl border z-50 py-2"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
          >
            {/* Header utilisateur */}
            <div
              className="p-3 border-b"
              style={{ borderColor: COLORS.BORDER }}
            >
              <div className="flex items-center gap-3">
                <AvatarImage
                  src={userInfo.avatarUrl}
                  alt={`Photo de ${userInfo.displayName}`}
                  size={40}
                  className="ring-2 ring-green-100"
                  fallbackSrc="/default-avatar.png"
                />
                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium truncate"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {userInfo.displayName}
                  </div>
                  <div
                    className="text-sm truncate"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {userInfo.email}
                  </div>
                  <div
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1"
                    style={{
                      backgroundColor: COLORS.PRIMARY_BG,
                      color: COLORS.PRIMARY,
                    }}
                  >
                    {userInfo.roleLabel}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={index}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                    onClick={() => setIsOpen(false)}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Séparateur */}
              <div
                className="my-1 border-t"
                style={{ borderColor: COLORS.BORDER }}
              />

              {/* Déconnexion */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onSignOut();
                }}
                className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors w-full text-left"
                style={{ color: COLORS.ERROR }}
              >
                <LogIn className="w-4 h-4 rotate-180" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        )}

        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

/**
 * HeaderDesktop principal - Version corrigée avec COLORS
 */
export default function HeaderDesktop({
  showSearchInHeader = true,
  className = "",
}: HeaderDesktopProps): JSX.Element {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const role = useUserRole() as UserRole;
  const { reset } = useUserActions();
  const [mounted, setMounted] = useState<boolean>(false);
  const userInfo = useUserDisplayInfo();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Gestion de la déconnexion
  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      reset();
      await signOut();
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    }
  }, [reset, signOut]);

  // Ouverture des modales d'auth
  const openSignIn = useCallback((): void => {
    window.dispatchEvent(new CustomEvent("openSigninModal"));
  }, []);

  const openSignUp = useCallback((): void => {
    window.dispatchEvent(new CustomEvent("openSignupModal"));
  }, []);

  // Header de fallback pendant l'hydratation
  if (!mounted || !isLoaded) {
    return (
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b backdrop-blur",
          className
        )}
        style={{
          backgroundColor: COLORS.BG_WHITE,
          borderColor: COLORS.BORDER,
        }}
      >
        <div className="container flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2">
              <span
                className="text-xl font-bold"
                style={{ color: COLORS.PRIMARY }}
              >
                Farm To Fork
              </span>
            </Link>
            <MainNavigation />
          </div>
          <div className="w-32 h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur",
        className
      )}
      style={{
        backgroundColor: `${COLORS.BG_WHITE}f0`, // 95% opacity
        borderColor: COLORS.BORDER,
      }}
    >
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Logo + Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logof2f.svg"
              alt="Farm To Fork"
              width={120}
              height={32}
              priority
              className="h-8 w-auto"
              onError={(e) => {
                // Fallback si image pas trouvée
                e.currentTarget.style.display = "none";
              }}
            />
            <span
              className="text-xl font-bold hidden sm:block"
              style={{ color: COLORS.PRIMARY }}
            >
              Farm To Fork
            </span>
          </Link>
          <MainNavigation />
        </div>

        {/* Actions droite */}
        <div className="flex items-center gap-4">
          {/* Recherche */}
          {showSearchInHeader && (
            <div className="hidden lg:flex items-center w-[380px] max-w-[40vw]">
              <MapboxCitySearch
                variant="header"
                placeholder="Rechercher une ville…"
              />
            </div>
          )}

          {/* Devenir producteur */}
          <Link
            href="/become-farmer"
            className="hidden md:flex items-center gap-1 text-sm font-medium px-3 py-2 hover:bg-green-50 rounded-lg transition-all"
            style={{ color: COLORS.PRIMARY }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.PRIMARY_DARK;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.PRIMARY;
            }}
          >
            <PlusCircle className="w-4 h-4" />
            Devenir producteur
          </Link>

          {/* Auth */}
          {!isSignedIn ? (
            <AuthButtons onSignIn={openSignIn} onSignUp={openSignUp} />
          ) : (
            <UserMenu
              userInfo={userInfo}
              role={role}
              onSignOut={handleSignOut}
            />
          )}
        </div>
      </div>
    </header>
  );
}

export type { HeaderDesktopProps, UserDisplayInfo };
