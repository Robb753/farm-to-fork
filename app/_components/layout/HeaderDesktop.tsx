"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import { COLORS } from "@/lib/config/constants";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger"; // ✅

declare global {
  interface Window {
    __F2F_HEADER_DESKTOP_MOUNTED__?: boolean;
  }
}

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

const useUserDisplayInfo = (): UserDisplayInfo => {
  const { user } = useUser();
  const role = useUserRole() as UserRole;

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

const useHeaderDesktopMountGuard = () => {
  const [canRender] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;

    if (window.__F2F_HEADER_DESKTOP_MOUNTED__) {
      logger.warn("HeaderDesktop déjà monté - rendu bloqué");
      return false;
    }

    window.__F2F_HEADER_DESKTOP_MOUNTED__ = true;
    logger.debug("HeaderDesktop monté (guard ok)");
    return true;
  });

  useEffect(() => {
    return () => {
      if (
        typeof window !== "undefined" &&
        window.__F2F_HEADER_DESKTOP_MOUNTED__
      ) {
        delete window.__F2F_HEADER_DESKTOP_MOUNTED__;
        logger.debug("HeaderDesktop démonté - flag nettoyé");
      }
    };
  }, []);

  return canRender;
};

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
      type="button"
    >
      Se connecter
    </button>

    <button
      onClick={onSignUp}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all hover:bg-opacity-90"
      style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.TEXT_WHITE }}
      type="button"
    >
      <PlusCircle className="w-4 h-4" />
      S&apos;inscrire
    </button>
  </div>
);

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
                aria-hidden="true"
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
      <Link
        href="/user#favorites"
        className="p-2 rounded-lg transition-all relative hover:bg-gray-100"
        style={{ color: COLORS.TEXT_SECONDARY }}
        title="Mes favoris"
      >
        <Heart className="w-5 h-5" />
      </Link>

      <button
        className="p-2 rounded-lg transition-all relative hover:bg-gray-100"
        style={{ color: COLORS.TEXT_SECONDARY }}
        type="button"
      >
        <Bell className="w-5 h-5" />
        <span
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{ backgroundColor: COLORS.ERROR }}
        />
      </button>

      <div className="relative">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center gap-2 p-1 rounded-lg transition-colors focus:outline-none hover:bg-gray-50"
          type="button"
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

        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-64 rounded-xl shadow-xl z-50 py-2"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              border: `1px solid ${COLORS.BORDER}`,
            }}
          >
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

            <div className="py-1">
              {menuItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={`${item.href}-${index}`}
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

              <div
                className="my-1 border-t"
                style={{ borderColor: COLORS.BORDER }}
              />

              <button
                onClick={() => {
                  setIsOpen(false);
                  void onSignOut();
                }}
                className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors w-full text-left"
                style={{ color: COLORS.ERROR }}
                type="button"
              >
                <LogIn className="w-4 h-4 rotate-180" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        )}

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

const HeaderDesktopSkeleton: React.FC = () => (
  <header
    className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-white/60"
    style={{
      backgroundColor: `${COLORS.BG_WHITE}F2`,
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

export default function HeaderDesktop({
  showSearchInHeader = true,
  className = "",
}: HeaderDesktopProps): JSX.Element | null {
  const { isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const role = useUserRole() as UserRole;
  const { reset } = useUserActions();

  const canRender = useHeaderDesktopMountGuard();
  const userInfo = useUserDisplayInfo();

  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      reset();
      await signOut();
      logger.info("Déconnexion réussie");
    } catch (error) {
      logger.error("Erreur lors de la déconnexion", error);
    }
  }, [reset, signOut]);

  const openSignIn = useCallback((): void => {
    window.dispatchEvent(new CustomEvent("openSigninModal"));
  }, []);

  const openSignUp = useCallback((): void => {
    window.dispatchEvent(new CustomEvent("openSignupModal"));
  }, []);

  if (!isLoaded) return <HeaderDesktopSkeleton />;
  if (!canRender) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-[200] w-full border-b backdrop-blur supports-[backdrop-filter]:bg-white/60",
        className
      )}
      style={{
        backgroundColor: `${COLORS.BG_WHITE}F2`,
        borderColor: COLORS.BORDER,
      }}
    >
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logof2f.svg"
              alt="Farm To Fork"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
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

        <div className="flex items-center gap-4">
          {showSearchInHeader && (
            <div className="hidden lg:flex items-center w-[380px] max-w-[40vw]">
              <MapboxCitySearch
                variant="header"
                placeholder="Rechercher une ville…"
                className="mapbox-dropdown header-search"
                onCitySelect={() => {
                  setTimeout(() => {
                    const dropdowns =
                      document.querySelectorAll('[role="listbox"]');
                    dropdowns.forEach((dropdown) => {
                      const parent = dropdown.closest(".mapbox-dropdown");
                      if (parent) {
                        parent.classList.add("closed");
                        setTimeout(
                          () => parent.classList.remove("closed"),
                          300
                        );
                      }
                    });
                  }, 150);
                }}
              />
            </div>
          )}

          <Link
            href="/onboarding/step-1"
            className="hidden md:flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-lg transition-all"
            style={{ color: COLORS.PRIMARY, backgroundColor: "transparent" }}
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
