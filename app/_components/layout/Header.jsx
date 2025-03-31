"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogIn, Menu, User, Heart, PlusCircle } from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import SignInModal from "@/app/modules/auth/SignInModal";
import SignupRoleModal from "@/app/modules/auth/SignupRoleModal";
import { LanguageSelector } from "../LanguageSelector";
import useUserSync from "@/app/hooks/useUserSync";


function Header() {
  const { user, isSignedIn } = useUser();
  const { isFarmer } = useUserSync(); // Utilise le nouveau hook useUserSync
  const [modalType, setModalType] = useState(null); // 'signin' | 'signup-role'

  const handleCloseModal = () => setModalType(null);

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white md:px-8 shadow-sm relative z-10">
      {/* Logo */}
      <div className="flex items-center">
        <div className="relative w-10 h-10 mr-2">
          <div className="absolute inset-0 bg-green-200 rounded-full shadow-inner" />
          <div className="absolute inset-[25%] bg-green-600 rounded-full" />
        </div>
        <Link
          href="/"
          className="text-2xl font-medium text-green-600 tracking-tight"
        >
          Farm To Fork
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-6">
        <LanguageSelector />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 px-3 py-2 border rounded-md shadow-sm hover:bg-gray-50">
              <Menu className="w-5 h-5" />
              {!isSignedIn && <LogIn className="w-5 h-5" />}
              {isSignedIn && (
                <Image
                  src={user?.imageUrl || "/default-avatar.png"} // Ajout d'un fallback pour l'image
                  alt="User"
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {!isSignedIn ? (
              <>
                <DropdownMenuItem onClick={() => setModalType("signup-role")}>
                  Inscription
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setModalType("signin")}>
                  Connexion
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/user" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>

                {/* Menu différent selon le rôle */}
                {isFarmer ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard/farms"
                        className="flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
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
                    <DropdownMenuItem asChild>
                      <Link
                        href="/add-new-listing"
                        className="flex items-center gap-2"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Ajouter une ferme</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/user/favorites"
                      className="flex items-center gap-2"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Mes favoris</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem>
                  <SignOutButton className="w-full flex justify-start">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 17L21 12L16 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 12H9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>Se déconnecter</span>
                    </div>
                  </SignOutButton>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modals */}
      {modalType === "signin" && <SignInModal onClose={handleCloseModal} />}
      {modalType === "signup-role" && (
        <SignupRoleModal onClose={handleCloseModal} />
      )}
    </header>
  );
}

export default Header;
