// app/explore/page.tsx
"use client";

import Explore from "@/app/_components/layout/Explore";

/**
 * Page d'exploration des producteurs et fermes
 * 
 * Cette page sert de wrapper pour le composant Explore qui contient
 * toute la logique d'affichage des fermes, filtres, carte, etc.
 * 
 * @returns JSX.Element - Page d'exploration complète
 */
export default function ExplorePage(): JSX.Element {
  return <Explore />;
}