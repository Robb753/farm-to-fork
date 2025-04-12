"use client";
import React, { createContext, useContext, useState } from "react";

const CoordinateContext = createContext();

export function CoordinateProvider({ children }) {
  const [coordinates, setCoordinates] = useState(null);

  return (
    <CoordinateContext.Provider value={{ coordinates, setCoordinates }}>
      {children}
    </CoordinateContext.Provider>
  );
}

export function useCoordinates() {
  const context = useContext(CoordinateContext);
  // Retourner un objet avec des valeurs par défaut si le contexte n'est pas disponible
  if (!context) {
    console.warn("useCoordinates doit être utilisé dans un CoordinateProvider");
    return { coordinates: null, setCoordinates: () => {} };
  }
  return context;
}
