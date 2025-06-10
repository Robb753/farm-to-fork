"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogIn, Menu, User, Heart, PlusCircle, ListChecks } from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import SignInModal from "@/app/modules/auth/SignInModal";
import SignupModalSimple from "@/app/modules/auth/SignupModalSimple";
import { LanguageSelector } from "../LanguageSelector";
import useUserSync from "@/app/hooks/useUserSync";

function Header() {
  const { user, isSignedIn } = useUser();
  const { isFarmer, role, isReady } = useUserSync();
  const [modalType, setModalType] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // 🔁 Sync Clerk role
  useEffect(() => {
    if (!isSignedIn) return;

    if (isReady && role) {
      setUserRole(role);
      return;
    }

    const clerkRole = user?.publicMetadata?.role;
    if (clerkRole === "farmer" || clerkRole === "user") {
      setUserRole(clerkRole);
      return;
    }

    const localRole = localStorage.getItem("userRole");
    if (localRole === "farmer" || localRole === "user") {
      setUserRole(localRole);
      return;
    }

    setUserRole("user");
  }, [isSignedIn, user, role, isReady]);

  // ✅ Emit modal state globally
  useEffect(() => {
    const isOpen = modalType === "signin" || modalType === "signup-role";
    window.dispatchEvent(new CustomEvent("modalOpen", { detail: isOpen }));
  }, [modalType]);

  const handleCloseModal = () => setModalType(null);
  const isFarmerUser = userRole === "farmer";

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white md:px-8 shadow-sm relative z-40">
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

      <div className="flex items-center gap-6">
        <Link
          href="/become-farmer"
          className="text-sm text-green-600 font-medium hover:underline"
        >
          Devenir producteur
        </Link>

        <LanguageSelector />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 px-3 py-2 border rounded-md shadow-sm hover:bg-gray-50">
              <Menu className="w-5 h-5" />
              {!isSignedIn && <LogIn className="w-5 h-5" />}
              {isSignedIn && (
                <Image
                  src={user?.imageUrl || "/default-avatar.png"}
                  alt="User"
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-72 p-2 bg-gray-50">
            {!isSignedIn ? (
              <div className="bg-white rounded-md shadow-sm overflow-hidden">
                <DropdownMenuItem
                  onClick={() => setModalType("signup-role")}
                  className="py-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 px-4">
                    <PlusCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Inscription</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setModalType("signin")}
                  className="py-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 px-4">
                    <LogIn className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Connexion</span>
                  </div>
                </DropdownMenuItem>
              </div>
            ) : (
              <>
                <DropdownMenuLabel className="text-lg font-medium py-3 text-gray-800 px-4">
                  Mon Compte (
                  {userRole === "admin"
                    ? "Administrateur"
                    : userRole === "farmer"
                      ? "Agriculteur"
                      : "Utilisateur"}
                  )
                </DropdownMenuLabel>

                <div className="bg-white rounded-md shadow-sm overflow-hidden">
                  <DropdownMenuItem asChild className="py-3 hover:bg-gray-50">
                    <Link href="/user" className="flex items-center gap-3 px-4">
                      <User className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Profil</span>
                    </Link>
                  </DropdownMenuItem>

                  {userRole === "admin" && (
                    <DropdownMenuItem asChild className="py-3 hover:bg-gray-50">
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4"
                      >
                        <ListChecks className="w-5 h-5 text-green-600" />
                        <span className="text-gray-700">Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {userRole === "farmer" && (
                    <DropdownMenuItem asChild className="py-3 hover:bg-gray-50">
                      <Link
                        href="/dashboard/farms"
                        className="flex items-center gap-3 px-4"
                      >
                        <svg
                          className="w-5 h-5 text-green-600"
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
                        <span className="text-gray-700">Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </div>

                <div className="mt-2 bg-white rounded-md shadow-sm overflow-hidden">
                  <DropdownMenuItem className="py-3 hover:bg-gray-50">
                    <SignOutButton className="w-full flex justify-start">
                      <div className="flex items-center gap-3 px-4">
                        <svg
                          className="w-5 h-5 text-green-600"
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
                        <span className="text-gray-700">Se déconnecter</span>
                      </div>
                    </SignOutButton>
                  </DropdownMenuItem>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modales conditionnelles */}
      {modalType === "signin" && <SignInModal onClose={handleCloseModal} />}
      {modalType === "signup-role" && (
        <SignupModalSimple onClose={handleCloseModal} />
      )}
    </header>
  );
}

export default Header;
