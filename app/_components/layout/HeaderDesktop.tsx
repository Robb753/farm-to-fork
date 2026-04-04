"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  LogIn,
  PlusCircle,
  LayoutDashboard,
  ListChecks,
  Heart,
  User,
  Bell,
  Settings,
  Package,
  Sprout,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { AvatarImage } from "@/components/ui/OptimizedImage";
import { useUserRole, useUserActions } from "@/lib/store/userStore";
import { COLORS } from "@/lib/config/constants";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

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
  },
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

const NAV_ITEMS = [
  { href: "/explore", label: "Explorer" },
  { href: "/discover/producteurs", label: "Producteurs" },
  { href: "/discover/produits", label: "Produits" },
] as const;

const MainNavigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-1">
      {NAV_ITEMS.map(({ href, label }) => {
        const isActive =
          pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "text-gray-900 bg-gray-100"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
            )}
          >
            {label}
            {isActive && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-green-600" />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

interface AuthButtonsProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

const AuthButtons: React.FC<AuthButtonsProps> = ({ onSignIn, onSignUp }) => (
  <div className="flex items-center gap-1">
    <button
      onClick={onSignIn}
      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      type="button"
    >
      Se connecter
    </button>

    <button
      onClick={onSignUp}
      className="px-5 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
      type="button"
    >
      S&apos;inscrire
    </button>
  </div>
);

interface UserMenuProps {
  userInfo: UserDisplayInfo;
  role: UserRole;
  onSignOut: () => Promise<void>;
}

const FarmIcon: React.FC<{
  className?: string;
  style?: React.CSSProperties;
}> = ({ className, style }) => (
  <svg
    className={className}
    style={style}
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
);

const UserMenu: React.FC<UserMenuProps> = ({ userInfo, role, onSignOut }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const menuItems = [
    {
      href: "/account",
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
            icon: FarmIcon,
            label: "Ma ferme",
            color: COLORS.TEXT_SECONDARY,
          },
        ]
      : []),
    {
      href: "/orders",
      icon: Package,
      label: "Mes commandes",
      color: COLORS.TEXT_SECONDARY,
    },
    {
      href: "/account",
      icon: Heart,
      label: "Mes favoris",
      color: COLORS.ERROR,
    },
    {
      href: "/account",
      icon: Settings,
      label: "Paramètres",
      color: COLORS.TEXT_SECONDARY,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/account"
        className="p-2 rounded-lg transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        title="Mes favoris"
      >
        <Heart className="w-5 h-5" />
      </Link>

      <button
        className="p-2 rounded-lg transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-900 relative"
        type="button"
      >
        <Bell className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
      </button>

      <div className="relative">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center p-1 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
          type="button"
        >
          <AvatarImage
            src={userInfo.avatarUrl}
            alt={`Photo de ${userInfo.displayName}`}
            size={36}
            className="ring-2 ring-gray-100 hover:ring-green-200 transition-all"
            fallbackSrc="/default-avatar.png"
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-xl z-50 py-2 bg-white border border-gray-100">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <AvatarImage
                  src={userInfo.avatarUrl}
                  alt={`Photo de ${userInfo.displayName}`}
                  size={40}
                  className="ring-2 ring-green-100"
                  fallbackSrc="/default-avatar.png"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-gray-900">
                    {userInfo.displayName}
                  </div>
                  <div className="text-sm truncate text-gray-400">
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
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                    onClick={() => setIsOpen(false)}
                  >
                    <IconComponent
                      className="w-4 h-4"
                      style={{ color: item.color }}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="my-1 border-t border-gray-100" />

              <button
                onClick={() => {
                  setIsOpen(false);
                  void onSignOut();
                }}
                className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors w-full text-left text-red-600"
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
    role="banner"
    className="sticky top-0 z-[200] w-full bg-white border-b border-gray-100"
  >
    <div className="container flex h-16 items-center justify-between px-6">
      <div className="w-32 h-8 rounded-lg animate-pulse bg-gray-100" />
      <div className="w-20 h-8 rounded-lg animate-pulse bg-gray-100" />
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
    window.location.href = "/sign-in";
  }, []);

  const openSignUp = useCallback((): void => {
    window.location.href = "/sign-up";
  }, []);

  if (!isLoaded) return <HeaderDesktopSkeleton />;

  return (
    <header
      role="banner"
      className={cn(
        "sticky top-0 z-[200] w-full bg-white border-b border-gray-100",
        className,
      )}
    >
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Left: Logo + Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-green-600" />
            <span className="text-[17px] font-semibold tracking-tight text-gray-900">
              Farm2Fork
            </span>
          </Link>
          <MainNavigation />
        </div>

        {/* Right: Search + CTA + Auth */}
        <div className="flex items-center gap-3">
          {showSearchInHeader && (
            <div className="hidden lg:flex items-center w-[320px] max-w-[38vw]">
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
                          300,
                        );
                      }
                    });
                  }, 150);
                }}
              />
            </div>
          )}

          {role !== "admin" &&
            (role === "farmer" ? (
              <Link
                href="/dashboard/farms"
                className="hidden md:flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors text-green-600 hover:bg-green-50 hover:text-green-700"
              >
                <LayoutDashboard className="w-4 h-4" />
                Mon espace producteur
              </Link>
            ) : (
              <Link
                href={
                  isSignedIn
                    ? "/become-producer"
                    : "/sign-in?redirect=/become-producer"
                }
                className="hidden md:flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors text-green-600 hover:bg-green-50 hover:text-green-700"
              >
                <PlusCircle className="w-4 h-4" />
                Devenir producteur
              </Link>
            ))}

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
