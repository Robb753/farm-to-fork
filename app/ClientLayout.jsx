// app/ClientLayout.jsx
"use client";

import { usePathname } from "next/navigation";
import Provider from "./Provider";
import Header from "./_components/layout/Header";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      <Header showSearchInHeader={!isHome} /> {/* passe le prop ici */}
      <Provider>{children}</Provider>
    </>
  );
}
