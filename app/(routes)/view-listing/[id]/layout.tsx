// app/(routes)/view-listing/[id]/layout.tsx
import type { ReactNode } from "react";

/**
 * Props pour le layout ViewListing
 */
interface ViewListingLayoutProps {
  children: ReactNode;
}

/**
 * Layout pour les pages de détail de listing
 * 
 * Ce layout encapsule les pages de détail des listings pour :
 * - Maintenir une structure cohérente
 * - Permettre l'ajout futur de composants partagés
 * - Optimiser le rendu avec React Server Components
 * 
 * @param children - Contenu de la page (page.tsx ou not-found.tsx)
 * @returns JSX.Element - Layout minimal optimisé
 * 
 * @example
 * Structure de fichiers:
 * ```
 * view-listing/[id]/
 * ├── layout.tsx     (ce fichier)
 * ├── page.tsx       (page de détail)
 * └── not-found.tsx  (page 404)
 * ```
 */
export default function ViewListingLayout({ children }: ViewListingLayoutProps): JSX.Element {
  return <>{children}</>;
}