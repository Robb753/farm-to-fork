// app/ClientLayout.tsx
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import ClientProviders from "./ClientProviders";
import Header from "./_components/layout/Header";
import Footer from "./_components/layout/Footer";

/**
 * Interface pour les props de ClientLayout
 */
interface ClientLayoutProps {
  /** Contenu à afficher dans le layout */
  children: React.ReactNode;
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Layout client principal de Farm To Fork
 * 
 * Ce composant gère la structure générale de l'application côté client :
 * - Affichage conditionnel de la recherche dans le header
 * - Intégration des providers globaux
 * - Structure layout responsive
 * - Header et Footer cohérents
 * 
 * Features:
 * - Header adaptatif selon la page (recherche masquée sur accueil)
 * - Providers Clerk, stores et notifications
 * - Structure layout flexible
 * - Types TypeScript stricts
 * 
 * @param props - Configuration du layout
 * @returns Layout client complet
 */
export default function ClientLayout({ 
  children, 
  className = "" 
}: ClientLayoutProps): JSX.Element {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <ClientProviders>
      <div className={`min-h-screen flex flex-col ${className}`}>
        {/* Header avec logique conditionnelle pour la recherche */}
        <Header showSearchInHeader={!isHome} />
        
        {/* Contenu principal */}
        <main className="flex-1">
          {children}
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </ClientProviders>
  );
}

/**
 * Export des types pour utilisation externe
 */
export type { ClientLayoutProps };