// app/Provider.jsx
"use client";

import React, { useState, useEffect } from "react";
import Header from "./_components/layout/Header";
import Footer from "./_components/layout/Footer";
import { Toaster } from "sonner";
import { UserRoleProvider } from "./contexts/UserRoleContext";
import { LanguageProvider } from "./contexts/Language-context";
import ClientModalWrapper from "./_components/ui/ClientModalWrapper";
// Nous n'importons plus les providers de carte individuels ici
// Nous utiliserons MapDataProvider directement dans les layouts où c'est nécessaire

function Provider({ children }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Chargement...
      </div>
    );
  }

  return (
    <LanguageProvider>
      <UserRoleProvider>
        <Toaster />
        <ClientModalWrapper />
          <Header />
          <main className="flex-1">{children}</main>
        <Footer />
      </UserRoleProvider>
    </LanguageProvider>
  );
}

export default Provider;
