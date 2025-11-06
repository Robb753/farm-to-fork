"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { cn } from "@/lib/utils";

import dynamic from "next/dynamic";
import useCitySearchControl from "@/app/modules/maps/hooks/useCitySearchControl";
import { COLORS } from "@/lib/config";

/**
 * Interfaces TypeScript pour HeaderMobile
 */
interface HeaderMobileProps {
  /** Afficher la barre de recherche dans le header */
  showSearchInHeader?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
}

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
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
      <div 
        className="h-10 w-full rounded-full animate-pulse"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      />
    )
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
 * Composant Modal mobile pour navigation
 */
const MobileModal: React.FC<MobileModalProps> = ({ isOpen, onClose, children }) => {
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
    <div className="fixed inset-0 z-50" style={{ backgroundColor: COLORS.BG_WHITE }}>
      <div className="flex h-full flex-col">
        <div 
          className="flex items-center justify-between border-b p-4 shadow-sm"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.BORDER,
          }}
        >
          <h2 
            className="text-lg font-semibold"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Menu
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
            style={{
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.BG_GRAY;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div 
          className="flex-1 overflow-y-auto"
          style={{ backgroundColor: COLORS.BG_GRAY }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Menu utilisateur mobile custom (sans DropdownMenu problématique)
 */
interface UserMenuMobileProps {
  userInfo: UserDisplayInfo;
  role: UserRole;
  onSignOut: () => Promise<void>;
}

const UserMenuMobile: React.FC<UserMenuMobileProps> = ({ userInfo, role, onSignOut }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const menuItems = [
    {
      href: "/user",
      icon: User,
      label: "Mon profil",
      color: COLORS.TEXT_SECONDARY,
    },
    ...(role === "admin" ? [{
      href: "/admin",
      icon: ListChecks,
      label: "Administration",
      color: COLORS.TEXT_SECONDARY,
    }] : []),
    ...(role === "farmer" ? [{
      href: "/dashboard/farms",
      icon: () => (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      label: "Ma ferme",
      color: COLORS.TEXT_SECONDARY,
    }] : []),
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
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border px-2 py-2 shadow-sm transition-colors"
        style={{
          borderColor: COLORS.BORDER,
          backgroundColor: COLORS.BG_WHITE,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.BG_GRAY;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.BG_WHITE;
        }}
      >
        <AvatarImage
          src={userInfo.avatarUrl}
          alt={`Photo de ${userInfo.displayName}`}
          size={24}
          className="ring-1 ring-green-100"
          fallbackSrc="/default-avatar.png"
        />
        <span 
          className="hidden max-w-20 truncate text-sm font-medium xs:block"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          {userInfo.displayName.split(" ")[0]}
        </span>
        <ChevronDown 
          className="hidden h-3 w-3 xs:block" 
          style={{ color: COLORS.TEXT_MUTED }}
        />
      </button>

      {/* Menu dropdown */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-72 rounded-xl shadow-xl z-50 py-2"
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
              <div className="min-w-0 flex-1">
                <div 
                  className="truncate font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {userInfo.displayName}
                </div>
                <div 
                  className="truncate text-sm"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  {userInfo.email}
                </div>
                <div 
                  className="mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
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
                    className="w-5 h-5" 
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
              <LogIn className="w-5 h-5 -rotate-180" />
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
  );
};

/**
 * Composant Skeleton pour le loading state
 */
const HeaderMobileSkeleton: React.FC = () => (
  <header 
    className="fixed left-0 right-0 top-0 z-40 border-b backdrop-blur"
    style={{
      backgroundColor: `${COLORS.BG_WHITE}F2`, // 95% opacity
      borderColor: COLORS.BORDER,
    }}
  >
    <div className="flex items-center justify-between px-4 py-3">
      <div 
        className="h-8 w-32 animate-pulse rounded"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      />
      <div 
        className="h-8 w-10 animate-pulse rounded-lg"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      />
    </div>
  </header>
);

/**
 * Composant HeaderMobile principal
 * 
 * Features:
 * - Responsive mobile-first design
 * - Recherche Mapbox intégrée
 * - Menu utilisateur custom (sans DropdownMenu)
 * - Modal mobile pour navigation
 * - Authentification Clerk
 * - Design system cohérent
 * - Gestion d'état robuste
 * - Loading states optimisés
 * 
 * @param props - Configuration du header mobile
 * @returns Header mobile complet
 */
export default function HeaderMobile({ 
  showSearchInHeader = true,
  className = ""
}: HeaderMobileProps): JSX.Element {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const role = useUserRole() as UserRole;
  const { reset } = useUserActions();

  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [searchCity, setSearchCity] = useState<string>("");
  
  const { handleCitySelect } = useCitySearchControl({ setSearchCity });
  const userInfo = useUserDisplayInfo();

  useEffect(() => {
    setIsClient(true);
  }, []);

  /**
   * Gestion de la déconnexion avec nettoyage du store
   */
  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      reset();
      await signOut();
      console.debug("Déconnexion mobile réussie");
    } catch (error) {
      console.error("Erreur lors de la déconnexion mobile:", error);
    }
  }, [reset, signOut]);

  /**
   * Ouverture des modales d'authentification
   */
  const openSignIn = useCallback((): void => {
    window.dispatchEvent(new CustomEvent("openSigninModal"));
    setShowMobileMenu(false);
  }, []);

  const openSignUp = useCallback((): void => {
    window.dispatchEvent(new CustomEvent("openSignupModal"));
    setShowMobileMenu(false);
  }, []);

  // États de chargement
  if (!isClient || !isLoaded) {
    return <HeaderMobileSkeleton />;
  }

  return (
    <>
      {/* Header principal avec recherche intégrée */}
      <header
        className={cn(
          "fixed left-0 right-0 top-0 z-40 border-b backdrop-blur",
          className
        )}
        style={{
          backgroundColor: `${COLORS.BG_WHITE}F2`, // 95% opacity
          borderColor: COLORS.BORDER,
        }}
      >
        <div className="flex items-center gap-2 px-3 py-2 max-w-screen-sm mx-auto w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 pl-1 shrink-0">
            <Image
              src="/logof2f.svg"
              alt="Farm To Fork"
              width={120}
              height={32}
              priority
              className="h-8 w-auto"
            />
            <span
              className="hidden xs:block text-base font-bold"
              style={{ color: COLORS.PRIMARY }}
            >
              Farm To Fork
            </span>
          </Link>

          {/* Barre de recherche ville */}
          {showSearchInHeader && (
            <div className="mx-2 flex-1 min-w-0">
              <MapboxCitySearch
                placeholder="Rechercher une ville…"
                onCitySelect={handleCitySelect}
                className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 px-4 focus:border-green-300 focus:bg-white focus:ring-2 focus:ring-green-100"
              />
            </div>
          )}

          {/* Actions à droite */}
          {!isSignedIn ? (
            <button
              onClick={() => setShowMobileMenu(true)}
              className="flex items-center gap-1 rounded-lg border px-2 py-2 shadow-sm transition-colors"
              style={{
                borderColor: COLORS.BORDER,
                backgroundColor: COLORS.BG_WHITE,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.BG_GRAY;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.BG_WHITE;
              }}
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
                className="relative rounded-lg p-2 transition-all"
                style={{ color: COLORS.TEXT_SECONDARY }}
                aria-label="Favoris"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.BG_GRAY;
                  e.currentTarget.style.color = COLORS.ERROR;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                }}
              >
                <Heart className="h-5 w-5" />
              </Link>

              {/* Notifications */}
              <button
                className="relative rounded-lg p-2 transition-all"
                style={{ color: COLORS.TEXT_SECONDARY }}
                aria-label="Notifications"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.BG_GRAY;
                  e.currentTarget.style.color = COLORS.TEXT_PRIMARY;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
                }}
              >
                <Bell className="h-5 w-5" />
                <span
                  className="absolute -right-1 -top-1 h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS.ERROR }}
                />
              </button>

              {/* Menu utilisateur custom */}
              <UserMenuMobile
                userInfo={userInfo}
                role={role}
                onSignOut={handleSignOut}
              />
            </div>
          )}
        </div>
      </header>

      {/* Modal mobile pour utilisateurs non connectés */}
      <MobileModal
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      >
        <div className="space-y-6 p-6">
          {/* Section principale */}
          <div className="text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: COLORS.PRIMARY_BG }}
            >
              <span className="text-2xl">🌱</span>
            </div>
            <h3
              className="mb-2 text-lg font-semibold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Rejoignez Farm To Fork
            </h3>
            <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
              Découvrez les producteurs locaux près de chez vous
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="space-y-3">
            <button
              onClick={openSignUp}
              className="w-full rounded-lg px-4 py-3 font-medium transition-colors"
              style={{
                backgroundColor: COLORS.PRIMARY,
                color: COLORS.TEXT_WHITE,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
              }}
            >
              <span className="inline-flex items-center gap-3">
                <PlusCircle className="h-5 w-5" />
                Créer un compte
              </span>
            </button>

            <button
              onClick={openSignIn}
              className="w-full rounded-lg border px-4 py-3 font-medium transition-colors"
              style={{
                borderColor: COLORS.PRIMARY,
                color: COLORS.PRIMARY,
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY_BG;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <span className="inline-flex items-center gap-3">
                <LogIn className="h-5 w-5" />
                Se connecter
              </span>
            </button>
          </div>

          {/* Navigation */}
          <div className="border-t pt-6" style={{ borderColor: COLORS.BORDER }}>
            <div className="space-y-3">
              <Link
                href="/explore"
                className="flex items-center gap-3 rounded-lg p-3 transition-colors"
                style={{
                  color: COLORS.TEXT_SECONDARY,
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.BG_WHITE;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                onClick={() => setShowMobileMenu(false)}
              >
                <MapPin className="h-5 w-5" style={{ color: COLORS.PRIMARY }} />
                <span>Explorer la carte</span>
              </Link>

              <Link
                href="/discover/producteurs"
                className="flex items-center gap-3 rounded-lg p-3 transition-colors"
                style={{
                  color: COLORS.TEXT_SECONDARY,
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.BG_WHITE;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                onClick={() => setShowMobileMenu(false)}
              >
                <User className="h-5 w-5" style={{ color: COLORS.PRIMARY }} />
                <span>Producteurs</span>
              </Link>

              <Link
                href="/become-farmer"
                className="flex items-center gap-3 rounded-lg p-3 transition-colors"
                style={{
                  color: COLORS.TEXT_SECONDARY,
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.BG_WHITE;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                onClick={() => setShowMobileMenu(false)}
              >
                <PlusCircle
                  className="h-5 w-5"
                  style={{ color: COLORS.PRIMARY }}
                />
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

/**
 * Export des types pour utilisation externe
 */
export type { HeaderMobileProps, UserDisplayInfo };