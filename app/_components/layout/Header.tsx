"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import HeaderMobile from "./HeaderMobile";
import HeaderDesktop from "./HeaderDesktop";
import HeaderErrorBoundary from "./HeaderErrorBoundary";

interface HeaderProps {
  className?: string;
}

const MOBILE_BREAKPOINT = 768;

// useSyncExternalStore garantit que la valeur client est lue au premier rendu
// (pas de useState(false) qui force un re-render post-hydration sur mobile).
// Cela supprime le Layout Shift causé par le swap HeaderDesktop → HeaderMobile.
function subscribeToResize(callback: () => void): () => void {
  window.addEventListener("resize", callback, { passive: true });
  return () => window.removeEventListener("resize", callback);
}

function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribeToResize,
    () => window.innerWidth < MOBILE_BREAKPOINT,
    () => false, // snapshot serveur : false (rendu SSR = desktop par défaut)
  );
}

export default function Header({ className = "" }: HeaderProps): JSX.Element {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const showSearchInHeader = pathname === "/explore";

  return (
    <HeaderErrorBoundary className={className}>
      {isMobile ? (
        <HeaderMobile
          showSearchInHeader={showSearchInHeader}
          className={className}
        />
      ) : (
        <HeaderDesktop
          showSearchInHeader={showSearchInHeader}
          className={className}
        />
      )}
    </HeaderErrorBoundary>
  );
}

export type { HeaderProps };
