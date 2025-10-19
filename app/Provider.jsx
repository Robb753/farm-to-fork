// app/Provider.jsx
"use client";

import React from "react";
import Header from "./_components/layout/Header";
import Footer from "./_components/layout/Footer";
import { Toaster } from "sonner";
import ModernAuthSystem from "./_components/auth/ModernAuthSystem";

// Plus besoin des anciens providers de transition

function Provider({ children }) {
  return (
    <>
      <Toaster />
      <ModernAuthSystem />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

export default Provider;
