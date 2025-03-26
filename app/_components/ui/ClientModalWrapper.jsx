"use client";

import { usePathname, useRouter } from "next/navigation";
import SignInModal from "@/app/modules/auth/SignInModal";

export default function ClientModalWrapper() {
  const pathname = usePathname();
  const router = useRouter();

  // Montrer uniquement le modal de connexion
  const showSignInModal = pathname === "/sign-in";

  const handleClose = () => {
    router.push("/"); // Retour à l'accueil
  };

  return <>{showSignInModal && <SignInModal onClose={handleClose} />}</>;
}
