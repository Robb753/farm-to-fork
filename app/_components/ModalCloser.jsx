"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function ModalCloser() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    // Fonction pour tenter de fermer les modals
    const closeModals = () => {
      // Essayer de fermer via le bouton de fermeture
      const closeButtons = document.querySelectorAll(
        'button[aria-label="Fermer la fenêtre"]'
      );
      if (closeButtons.length > 0) {
        console.log("Bouton de fermeture trouvé, tentative de clic");
        closeButtons.forEach((button) => button.click());
      }

      // Si nous sommes sur la page signup-role, rediriger vers l'accueil
      if (pathname === "/signup-role" && isLoaded) {
        console.log("Redirection depuis /signup-role vers l'accueil");
        router.push("/");
      }

      // Si un modal de sélection de rôle est présent et qu'on est connecté
      const roleModal = document.querySelector('div[role="dialog"]');
      if (roleModal && isSignedIn) {
        console.log(
          "Modal trouvé et utilisateur connecté, tentative de fermeture"
        );

        // Essayer de simuler un clic en dehors du modal pour le fermer
        const backdrop = document.querySelector(".fixed.inset-0.z-50");
        if (backdrop) {
          const clickEvent = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window,
          });
          backdrop.dispatchEvent(clickEvent);
        }

        // Si toujours présent, forcer la redirection
        setTimeout(() => {
          if (document.querySelector('div[role="dialog"]')) {
            console.log("Modal toujours présent, forçage de la redirection");
            router.push("/");
          }
        }, 500);
      }
    };

    // Exécuter immédiatement
    closeModals();

    // Et aussi après un court délai pour les modaux qui pourraient s'afficher après le chargement initial
    const timeout = setTimeout(() => {
      closeModals();
    }, 1000);

    // Configurer un observateur de mutations pour détecter l'apparition de nouveaux modals
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            if (
              node.nodeType === 1 &&
              node.querySelector &&
              node.querySelector('div[role="dialog"]')
            ) {
              console.log("Nouveau modal détecté via MutationObserver");
              closeModals();
            }
          });
        }
      });
    });

    // Observer les changements dans le body
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [pathname, router, isSignedIn, isLoaded]);

  // Ce composant n'affiche rien
  return null;
}
