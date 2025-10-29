"use client";

import { SignIn } from "@clerk/nextjs";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

/**
 * Modale de connexion (Clerk en routing="hash")
 * - Support ?redirect=/chemin
 * - Focus/scroll safe
 */
export default function SignInModal({ isOpen, onClose }) {
  const backdropRef = useRef(null);

  // ESC pour fermer + lock/unlock du scroll
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e) => e.key === "Escape" && onClose?.();
    const originalOverflow = document.body.style.overflow;

    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  const getRedirectTarget = () => {
    if (typeof window === "undefined") return "/";
    const r = new URLSearchParams(window.location.search).get("redirect");
    return r && r.startsWith("/") ? r : "/";
  };

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      onMouseDown={handleBackdropClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Connexion"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
          aria-label="Fermer"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>

        <SignIn
          routing="hash"
          signUpUrl="#/sign-up"
          fallbackRedirectUrl={getRedirectTarget()}
          afterSignInUrl={getRedirectTarget()}
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500",
              card: "shadow-none",
            },
          }}
        />
      </div>
    </div>
  );
}
