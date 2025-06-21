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
import { LanguageSelector } from "../LanguageSelector";
import useUserSync from "@/app/hooks/useUserSync";
import { AvatarImage } from "@/components/ui/OptimizedImage";

// Composant de modal mobile full-screen
const MobileModal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

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

function MobileHeader() {
  const { user, isSignedIn } = useUser();
  const { isFarmer, role, isReady } = useUserSync();
  const [modalType, setModalType] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // 🔁 Sync Clerk role - repris de votre code original
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

  // ✅ Emit modal state globally - repris de votre code original
  useEffect(() => {
    const isOpen = modalType === "signin" || modalType === "signup-role";
    window.dispatchEvent(new CustomEvent("modalOpen", { detail: isOpen }));
  }, [modalType]);

  const handleCloseModal = () => setModalType(null);
  const isFarmerUser = userRole === "farmer";

  // Fonction pour obtenir l'URL de l'avatar utilisateur - reprise de votre code
  const getUserAvatarUrl = () => {
    if (!user) return "/default-avatar.png";

    // Priorité : imageUrl de Clerk
    if (user.imageUrl) return user.imageUrl;

    // Fallback : image de profil depuis les métadonnées
    if (user.publicMetadata?.profileImage)
      return user.publicMetadata.profileImage;

    // Fallback : avatar par défaut
    return "/default-avatar.png";
  };

  // Fonction pour obtenir le nom d'utilisateur - reprise de votre code
  const getUserDisplayName = () => {
    if (!user) return "Utilisateur";

    // Priorité : nom complet
    if (user.fullName) return user.fullName;

    // Fallback : prénom
    if (user.firstName) return user.firstName;

    // Fallback : email ou "Utilisateur"
    const email =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress;
    return email ? email.split("@")[0] : "Utilisateur";
  };

  return (
    <>
      {/* Header principal */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo - Version mobile compacte */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <div className="relative w-8 h-8 mr-2">
              <div className="absolute inset-0 bg-green-200 rounded-full shadow-inner" />
              <div className="absolute inset-[25%] bg-green-600 rounded-full" />
            </div>
            <span className="text-lg font-medium text-green-600 tracking-tight hidden xs:block">
              Farm To Fork
            </span>
            <span className="text-lg font-medium text-green-600 tracking-tight xs:hidden">
              F2F
            </span>
          </Link>

          {/* Actions droite */}
          <div className="flex items-center gap-2">
            {/* Lien devenir producteur - Caché sur très petits écrans */}
            <Link
              href="/become-farmer"
              className="hidden sm:block text-xs text-green-600 font-medium hover:underline px-2 py-1"
            >
              Devenir producteur
            </Link>

            {/* Sélecteur de langue - Caché sur très petits écrans */}
            <div className="hidden md:block">
              <LanguageSelector />
            </div>

            {/* Menu utilisateur */}
            {!isSignedIn ? (
              <button
                onClick={() => setShowMobileMenu(true)}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Menu className="w-4 h-4" />
                <LogIn className="w-4 h-4" />
              </button>
            ) : (
              <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-2 border rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                    <AvatarImage
                      src={getUserAvatarUrl()}
                      alt={`Photo de profil de ${getUserDisplayName()}`}
                      size={24}
                      className="ring-1 ring-green-100"
                      fallbackSrc="/default-avatar.png"
                      priority={false}
                      quality={90}
                    />
                    <span className="text-sm font-medium text-gray-700 hidden xs:block max-w-20 truncate">
                      {getUserDisplayName().split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-64 p-2 bg-white shadow-lg border rounded-lg"
                >
                  {/* Profil utilisateur */}
                  <DropdownMenuLabel className="text-lg font-medium py-3 text-gray-800 px-4">
                    <div className="flex items-center gap-3">
                      <AvatarImage
                        src={getUserAvatarUrl()}
                        alt={`Photo de profil de ${getUserDisplayName()}`}
                        size={40}
                        className="ring-2 ring-green-100"
                        fallbackSrc="/default-avatar.png"
                        priority={false}
                        quality={95}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {getUserDisplayName()}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          {user?.primaryEmailAddress?.emailAddress}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1 w-fit">
                          {userRole === "admin"
                            ? "Administrateur"
                            : userRole === "farmer"
                              ? "Agriculteur"
                              : "Utilisateur"}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  {/* Menu items */}
                  <div className="bg-white rounded-md shadow-sm overflow-hidden">
                    <DropdownMenuItem
                      asChild
                      className="py-3 hover:bg-gray-50 focus:bg-gray-50"
                    >
                      <Link
                        href="/user"
                        className="flex items-center gap-3 px-4"
                      >
                        <User className="w-5 h-5 text-green-600" />
                        <span className="text-gray-700">Profil</span>
                      </Link>
                    </DropdownMenuItem>

                    {userRole === "admin" && (
                      <DropdownMenuItem
                        asChild
                        className="py-3 hover:bg-gray-50 focus:bg-gray-50"
                      >
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
                      <DropdownMenuItem
                        asChild
                        className="py-3 hover:bg-gray-50 focus:bg-gray-50"
                      >
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

                    {/* Favoris pour tous les utilisateurs connectés */}
                    <DropdownMenuItem
                      asChild
                      className="py-3 hover:bg-gray-50 focus:bg-gray-50"
                    >
                      <Link
                        href="/user#favorites"
                        className="flex items-center gap-3 px-4"
                      >
                        <Heart className="w-5 h-5 text-red-500" />
                        <span className="text-gray-700">Mes favoris</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>

                  {/* Déconnexion */}
                  <div className="mt-2 bg-white rounded-md shadow-sm overflow-hidden">
                    <DropdownMenuItem className="py-3 hover:bg-gray-50 focus:bg-gray-50">
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
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Modal mobile pour les utilisateurs non connectés */}
      <MobileModal
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      >
        <div className="p-4 space-y-4">
          {/* Lien devenir producteur */}
          <Link
            href="/become-farmer"
            className="block w-full p-4 text-center bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors"
            onClick={() => setShowMobileMenu(false)}
          >
            Devenir producteur
          </Link>

          {/* Sélecteur de langue sur mobile */}
          <div className="flex justify-center py-2">
            <LanguageSelector />
          </div>

          {/* Boutons d'authentification */}
          <div className="space-y-3">
            <button
              onClick={() => {
                setModalType("signup-role");
                setShowMobileMenu(false);
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              S'inscrire
            </button>

            <button
              onClick={() => {
                setModalType("signin");
                setShowMobileMenu(false);
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Se connecter
            </button>
          </div>

          {/* Informations supplémentaires */}
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 text-center">
              Rejoignez notre communauté de producteurs locaux et découvrez les
              meilleures fermes près de chez vous.
            </p>
          </div>
        </div>
      </MobileModal>

      {/* Spacer pour compenser le header fixed */}
      <div className="h-16"></div>

      {/* Modales conditionnelles - reprises de votre code original */}
      {modalType === "signin" && <SignInModal onClose={handleCloseModal} />}
      {modalType === "signup-role" && (
        <SignupModalSimple onClose={handleCloseModal} />
      )}

      {/* Styles CSS pour les breakpoints personnalisés */}
      <style jsx global>{`
        @media (min-width: 475px) {
          .xs\\:block {
            display: block;
          }
          .xs\\:hidden {
            display: none;
          }
        }

        @media (max-width: 474px) {
          .xs\\:block {
            display: none;
          }
          .xs\\:hidden {
            display: block;
          }
        }

        /* Optimisations pour mobile */
        @media (max-width: 640px) {
          .max-w-20 {
            max-width: 5rem;
          }

          .truncate {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .line-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }

        /* Amélioration du dropdown sur mobile */
        @media (max-width: 768px) {
          [data-radix-popper-content-wrapper] {
            transform: none !important;
            position: fixed !important;
            top: 4rem !important;
            right: 1rem !important;
            left: auto !important;
            width: auto !important;
            min-width: 16rem !important;
            max-width: calc(100vw - 2rem) !important;
          }
        }
      `}</style>
    </>
  );
}

export default MobileHeader;
