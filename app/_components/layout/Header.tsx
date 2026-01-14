"use client";

import { useEffect, useState } from "react";
import HeaderMobile from "./HeaderMobile";
import HeaderDesktop from "./HeaderDesktop";
import HeaderErrorBoundary from "./HeaderErrorBoundary";

interface HeaderProps {
  showSearchInHeader?: boolean;
  className?: string;
}

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const compute = () => window.innerWidth < MOBILE_BREAKPOINT;

    // init + resize listener = OK (synchronisation avec un système externe)
    const update = () => setIsMobile(compute());
    update();

    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return isMobile;
}

export default function Header({
  showSearchInHeader = true,
  className = "",
}: HeaderProps): JSX.Element {
  const isMobile = useIsMobile();

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
