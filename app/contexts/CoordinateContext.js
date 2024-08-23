"use client"
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
  return useContext(CoordinateContext);
}
