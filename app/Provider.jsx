// app/Provider.jsx
"use client";

import React, { useState, useEffect } from "react";
import Header from "./_components/layout/Header";
import Footer from "./_components/layout/Footer";
import { Toaster } from "sonner";
import { UserRoleProvider } from "./contexts/UserRoleContext";
import { LanguageProvider } from "./contexts/Language-context";
import ClientModalWrapper from "./_components/ui/ClientModalWrapper";

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
        <main className="min-h-screen">{children}</main>
        <Footer />
      </UserRoleProvider>
    </LanguageProvider>
  );
}

export default Provider;
