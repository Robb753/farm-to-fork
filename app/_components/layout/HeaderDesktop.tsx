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
import {
  useUserRole,
  useUserSyncState,
  useUserActions,
} from "@/lib/store/userStore";
import { COLORS } from "@/lib/config/constants";
import { cn } from "@/lib/utils";

/**
 * Extension de Window pour le flag de montage HeaderDesktop
 */
declare global {
  interface Window {
    __F2F_HEADER_DESKTOP_MOUNTED__?: boolean;
  }
}

/**
 * Interfaces TypeScript pour HeaderDesktop
 */
interface HeaderDesktopProps {
  /** Afficher la barre de recherche dans le header */
  showSearchInHeader?: boolean;
  /** Classe CSS personnalisée */
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
 * Chargement dynamique de MapboxCitySearch pour éviter les erreurs SSR
 */
const MapboxCitySearch = dynamic(
  () => import("@/app/modules/maps/components/shared/MapboxCitySearch"),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-[380px] max-w-[40vw] h-10 rounded-full animate-pulse"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      />
    ),
  }
);

/**
 * Hook pour la gestion des informations utilisateur
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
 * Hook pour la gestion anti-doublon du HeaderDesktop
 */
const useHeaderDesktopMountGuard = () => {
  const [canRender, setCanRender] = useState<boolean>(true);

  useEffect(() => {
    // Protection anti-doublon (dev & hot-reload friendly)
    if (typeof window !== "undefined") {
      if (window.__F2F_HEADER_DESKTOP_MOUNTED__) {
        setCanRender(false);
        console.warn("HeaderDesktop déjà monté - rendu bloqué");
      } else {
        window.__F2F_HEADER_DESKTOP_MOUNTED__ = true;
        console.debug("HeaderDesktop monté avec succès");
      }
    }

    return () => {
      if (
        typeof window !== "undefined" &&
        window.__F2F_HEADER_DESKTOP_MOUNTED__
      ) {
        delete window.__F2F_HEADER_DESKTOP_MOUNTED__;
        console.debug("HeaderDesktop démonté - flag nettoyé");
      }
    };
  }, []);

  return canRender;
};

/**
 * Composant de navigation principale
 */
const MainNavigation: React.FC = () => (
  <nav className="hidden md:flex items-center space-x-6">
    <Link
      href="/explore"
      className="text-sm font-medium transition-colors flex items-center gap-1 hover:text-green-600"
      style={{ color: COLORS.TEXT_SECONDARY }}
    >
      <MapPin className="w-4 h-4" />
      Explorer
    </Link>

    <Link
      href="/discover/producteurs"
      className="text-sm font-medium transition-colors hover:text-green-600"
      style={{ color: COLORS.TEXT_SECONDARY }}
    >
      Producteurs
    </Link>

    <Link
      href="/discover/produits"
      className="text-sm font-medium transition-colors hover:text-green-600"
      style={{ color: COLORS.TEXT_SECONDARY }}
    >
      Produits
    </Link>
  </nav>
);

/**
 * Composant des boutons d'authentification
 */
interface AuthButtonsProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({ onSignIn, onSignUp }) => (
  <div className="flex items-center gap-2">
    <button
      onClick={onSignIn}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:text-opacity-80"
      style={{ color: COLORS.TEXT_SECONDARY }}
    >
      Se connecter
    </button>

    <button
      onClick={onSignUp}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all hover:bg-opacity-90"
      style={{
        backgroundColor: COLORS.PRIMARY,
        color: COLORS.TEXT_WHITE,
      }}
    >
      <PlusCircle className="w-4 h-4" />
      S'inscrire
    </button>
  </div>
);

/**
 * Composant du menu utilisateur connecté (version custom sans DropdownMenu)
 */
interface UserMenuProps {
  userInfo: UserDisplayInfo;
  role: UserRole;
  onSignOut: () => Promise<void>;
}

const UserMenu: React.FC<UserMenuProps> = ({ userInfo, role, onSignOut }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const menuItems = [
    {
      href: "/user",
      icon: User,
      label: "Mon profil",
      color: COLORS.TEXT_SECONDARY,
    },
    ...(role === "admin"
      ? [
          {
            href: "/admin",
            icon: ListChecks,
            label: "Administration",
            color: COLORS.TEXT_SECONDARY,
          },
        ]
      : []),
    ...(role === "farmer"
      ? [
          {
            href: "/dashboard/farms",
            icon: () => (
              <svg
                className="w-4 h-4"
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
            ),
            label: "Ma ferme",
            color: COLORS.TEXT_SECONDARY,
          },
        ]
      : []),
    {
      href: "/user#favorites",
      icon: Heart,
      label: "Mes favoris",
      color: COLORS.ERROR,
    },
    {
      href: "/user#settings",
      icon: Settings,
      label: "Paramètres",
      color: COLORS.TEXT_SECONDARY,
    },
  ];

  return (
    <div className="flex items-center gap-3">
      {/* Bouton favoris */}
      <Link
        href="/user#favorites"
        className="p-2 rounded-lg transition-all relative hover:bg-gray-100"
        style={{ color: COLORS.TEXT_SECONDARY }}
        title="Mes favoris"
      >
        <Heart className="w-5 h-5" />
      </Link>

      {/* Bouton notifications */}
      <button
        className="p-2 rounded-lg transition-all relative hover:bg-gray-100"
        style={{ color: COLORS.TEXT_SECONDARY }}
      >
        <Bell className="w-5 h-5" />
        <span
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{ backgroundColor: COLORS.ERROR }}
        />
      </button>

      {/* Menu dropdown utilisateur custom */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 p-1 rounded-lg transition-colors focus:outline-none hover:bg-gray-50"
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
            <div className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              {userInfo.roleLabel}
            </div>
          </div>
        </button>

        {/* Menu dropdown */}
        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-64 rounded-xl shadow-xl z-50 py-2"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              border: `1px solid ${COLORS.BORDER}`,
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
                    style={{ color: COLORS.TEXT_MUTED }}
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
                    onClick={() => setIsOpen(false)}
                  >
                    <IconComponent
                      className="w-4 h-4"
                      style={{ color: item.color }}
                    />
                    <span style={{ color: COLORS.TEXT_PRIMARY }}>
                      {item.label}
                    </span>
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

        {/* Overlay pour fermer le menu */}
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
 * Composant Skeleton pour le loading state
 */
const HeaderDesktopSkeleton: React.FC = () => (
  <header
    className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-white/60"
    style={{
      backgroundColor: `${COLORS.BG_WHITE}F2`, // 95% opacity
      borderColor: COLORS.BORDER,
    }}
  >
    <div className="container flex h-16 items-center justify-between px-6">
      <div
        className="w-32 h-8 rounded animate-pulse"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      />
      <div
        className="w-20 h-8 rounded animate-pulse"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      />
    </div>
  </header>
);

/**
 * Composant HeaderDesktop principal
 *
 * Features:
 * - Navigation complète avec liens typés
 * - Authentification Clerk intégrée
 * - Menu utilisateur avec rôles
 * - Recherche Mapbox en header
 * - Design system cohérent
 * - Protection anti-doublon
 * - Gestion d'état robuste
 * - Animations et transitions
 *
 * @param props - Configuration du header desktop
 * @returns Header desktop complet
 */
export default function HeaderDesktop({
  showSearchInHeader = true,
  className = "",
}: HeaderDesktopProps): JSX.Element | null {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const role = useUserRole() as UserRole;
  const { reset } = useUserActions();

  const [isClient, setIsClient] = useState<boolean>(false);
  const canRender = useHeaderDesktopMountGuard();
  const userInfo = useUserDisplayInfo();

  useEffect(() => {
    setIsClient(true);
  }, []);

  /**
   * Gestion de la déconnexion avec nettoyage du store
   */
  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      reset(); // Nettoyage du store utilisateur
      await signOut();
      console.debug("Déconnexion réussie");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  }, [reset, signOut]);

  /**
   * Ouverture des modales d'authentification
   */
  const openSignIn = useCallback((): void => {
    window.dispatchEvent(new CustomEvent("openSigninModal"));
  }, []);

  const openSignUp = useCallback((): void => {
    window.dispatchEvent(new CustomEvent("openSignupModal"));
  }, []);

  // États de chargement
  if (!isClient || !isLoaded) {
    return <HeaderDesktopSkeleton />;
  }

  // Protection anti-doublon
  if (!canRender) {
    return null;
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-[200] w-full border-b backdrop-blur supports-[backdrop-filter]:bg-white/60",
        className
      )}
      style={{
        backgroundColor: `${COLORS.BG_WHITE}F2`, // 95% opacity
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
          {/* Recherche ville (Mapbox) */}
          {showSearchInHeader && (
            <div className="hidden lg:flex items-center w-[380px] max-w-[40vw]">
              <MapboxCitySearch
                variant="header"
                placeholder="Rechercher une ville…"
                className="mapbox-dropdown header-search" // ✅ Ajouter header-search
                onCitySelect={() => {
                  // ✅ NOUVEAU : Fermer la dropdown après sélection
                  setTimeout(() => {
                    const dropdowns =
                      document.querySelectorAll('[role="listbox"]');
                    dropdowns.forEach((dropdown) => {
                      const parent = dropdown.closest(".mapbox-dropdown");
                      if (parent) {
                        parent.classList.add("closed");
                        setTimeout(() => {
                          parent.classList.remove("closed");
                        }, 300);
                      }
                    });
                  }, 150);
                }}
              />
            </div>
          )}

          {/* Bouton devenir producteur */}
          <Link
            href="/become-farmer"
            className="hidden md:flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-lg transition-all"
            style={{
              color: COLORS.PRIMARY,
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY_BG;
              e.currentTarget.style.color = COLORS.PRIMARY_DARK;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = COLORS.PRIMARY;
            }}
          >
            <PlusCircle className="w-4 h-4" />
            Devenir producteur
          </Link>

          {/* Authentification */}
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

/**
 * Export des types pour utilisation externe
 */
export type { HeaderDesktopProps, UserDisplayInfo };
