// app/ClientLayout.jsx
"use client";

import { usePathname } from "next/navigation";
import ClientProviders from "./ClientProviders";
import Header from "./_components/layout/Header";
import Footer from "./_components/layout/Footer";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <ClientProviders>
      <Header showSearchInHeader={!isHome} />
      <main className="flex-1">{children}</main>
      <Footer />
    </ClientProviders>
  );
}
