// app/explore/page.tsx
import { Suspense } from "react";
import Explore from "@/app/_components/layout/Explore";

/**
 * Page d'exploration des producteurs et fermes
 *
 * Cette page sert de wrapper serveur pour le composant client <Explore />,
 * qui contient toute la logique (useSearchParams, filtres, carte, etc.).
 */
export default function ExplorePage(): JSX.Element {
  return (
    <Suspense fallback={<div>Chargement de la page d'exploration...</div>}>
      <Explore />
    </Suspense>
  );
}
