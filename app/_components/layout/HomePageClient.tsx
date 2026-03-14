// app/_components/layout/HomePageClient.tsx
"use client";

import React, { useState, useCallback } from "react";
import Explore from "./Explore";
import HomeContent from "./HomeContent";

/**
 * Wrapper client minimal pour la page d'accueil.
 * Isole le seul état interactif (viewMap) afin que app/page.tsx
 * reste un Server Component et bénéficie du SSR pour HomeContent.
 */
export default function HomePageClient(): JSX.Element {
  const [viewMap, setViewMap] = useState(false);

  const handleViewMap = useCallback(() => setViewMap(true), []);

  return viewMap ? <Explore /> : <HomeContent onViewMap={handleViewMap} />;
}
