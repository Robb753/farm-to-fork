// components/layout/Header.jsx
"use client";
import { useEffect, useState } from "react";
import HeaderMobile from "./HeaderMobile";
import HeaderDesktop from "./HeaderDesktop";

export default function Header({ showSearchInHeader = true }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [canRender, setCanRender] = useState(true); // ⬅️ garde-fou

  useEffect(() => {
    setIsClient(true);

    // anti-doublon (dev & hot-reload friendly)
    if (typeof window !== "undefined") {
      if (window.__F2F_HEADER_MOUNTED__) {
        setCanRender(false); // bloque un second header
      } else {
        window.__F2F_HEADER_MOUNTED__ = true;
      }
    }

    const checkViewport = () => setIsMobile(window.innerWidth < 768);
    checkViewport();
    window.addEventListener("resize", checkViewport);

    return () => {
      window.removeEventListener("resize", checkViewport);
      if (typeof window !== "undefined" && window.__F2F_HEADER_MOUNTED__) {
        delete window.__F2F_HEADER_MOUNTED__;
      }
    };
  }, []);

  if (!isClient) {
    return (
      <header className="flex items-center justify-between px-6 py-3 bg-white shadow-sm border-b z-40">
        <div className="w-32 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
      </header>
    );
  }

  if (!canRender) {
    return null; // ⬅️ ne montre pas le skeleton dans ce cas
  }

  return isMobile ? (
    <HeaderMobile showSearchInHeader={showSearchInHeader} />
  ) : (
    <HeaderDesktop showSearchInHeader={showSearchInHeader} />
  );
}
