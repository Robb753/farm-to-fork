"use client"
import React, { createContext, useContext, useState } from "react";

const FooterContext = createContext();

export function useFooter() {
  return useContext(FooterContext);
}

export function FooterProvider({ children }) {
  const [hideFooter, setHideFooter] = useState(false);

  return (
    <FooterContext.Provider value={{ hideFooter, setHideFooter }}>
      {children}
    </FooterContext.Provider>
  );
}
