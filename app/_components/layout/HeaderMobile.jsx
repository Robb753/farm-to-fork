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
import { useUser, SignOutButton } from "@clerk/nextjs";
import SignInModal from "@/app/modules/auth/SignInModal";
import SignupModalSimple from "@/app/modules/auth/SignupModalSimple";
import useUserSync from "@/app/hooks/useUserSync";
import { AvatarImage } from "@/components/ui/OptimizedImage";
import Image from "next/image";

const MobileModal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
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
  const { user, isSignedIn } = useUser();
  const { role, isReady } = useUserSync();

  const [userRole, setUserRole] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Synchronisation rôle utilisateur
  useEffect(() => {
    if (!isSignedIn) return;

    if (isReady && role) return setUserRole(role);

    const clerkRole = user?.publicMetadata?.role;
    if (clerkRole === "farmer" || clerkRole === "user") {
      return setUserRole(clerkRole);
    }

    const localRole = localStorage.getItem("userRole");
    if (localRole === "farmer" || localRole === "user") {
      return setUserRole(localRole);
    }

    setUserRole("user");
  }, [isSignedIn, user, role, isReady]);

  const getUserAvatarUrl = () =>
    user?.imageUrl ||
    user?.publicMetadata?.profileImage ||
    "/default-avatar.png";

  const getUserDisplayName = () => {
    if (!user) return "Utilisateur";
    if (user.fullName) return user.fullName;
    if (user.firstName) return user.firstName;
    const email = user.primaryEmailAddress?.emailAddress;
    return email ? email.split("@")[0] : "Utilisateur";
  };

  const handleCloseModal = () => setModalType(null);
  const isFarmerUser = userRole === "farmer";

  // Ouverture modale = déclencheur global (pour le backdrop notamment)
  useEffect(() => {
    const isOpen = modalType === "signin" || modalType === "signup-role";
    window.dispatchEvent(new CustomEvent("modalOpen", { detail: isOpen }));
  }, [modalType]);

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
            />
            <span className="text-2xl font-medium text-green-600 tracking-tight">
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
                  {getUserDisplayName()}
                </DropdownMenuLabel>

                <DropdownMenuItem asChild>
                  <Link
                    href="/user"
                    className="flex items-center gap-3 px-4 py-2"
                  >
                    <User className="w-5 h-5 text-green-600" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>

                {userRole === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-2"
                    >
                      <ListChecks className="w-5 h-5 text-green-600" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                {isFarmerUser && (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/farms"
                      className="flex items-center gap-3 px-4 py-2"
                    >
                      <svg
                        className="w-5 h-5 text-green-600"
                        viewBox="0 0 24 24"
                        fill="none"
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

                <DropdownMenuItem asChild>
                  <Link
                    href="/user#favorites"
                    className="flex items-center gap-3 px-4 py-2"
                  >
                    <Heart className="w-5 h-5 text-red-500" />
                    <span>Mes favoris</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem className="py-3">
                  <SignOutButton className="w-full flex gap-3 px-4 py-2">
                    <LogIn className="w-5 h-5 text-green-600 transform rotate-180" />
                    <span>Se déconnecter</span>
                  </SignOutButton>
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
              onClick={() => {
                setModalType("signup-role");
                setShowMobileMenu(false);
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              <PlusCircle className="w-5 h-5" />
              S'inscrire
            </button>

            <button
              onClick={() => {
                setModalType("signin");
                setShowMobileMenu(false);
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50"
            >
              <LogIn className="w-5 h-5" />
              Se connecter
            </button>
          </div>
        </div>
      </MobileModal>

      <div className="h-16" />

      {modalType === "signin" && <SignInModal onClose={handleCloseModal} />}
      {modalType === "signup-role" && (
        <SignupModalSimple onClose={handleCloseModal} />
      )}
    </>
  );
}
