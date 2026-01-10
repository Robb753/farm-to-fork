import React from "react";

/**
 * Interface pour le layout AddNewListing
 */
interface AddNewListingLayoutProps {
  /** Composants enfants à afficher */
  children: React.ReactNode;
}

/**
 * Layout pour la page d'ajout de listing
 * 
 * Ce layout simple passe directement les enfants sans modification.
 * Il peut être étendu à l'avenir pour ajouter des éléments communs
 * comme des breadcrumbs, un header spécifique, etc.
 * 
 * @param props - Props du layout
 * @returns Layout transparent pour les enfants
 */
const AddNewListingLayout: React.FC<AddNewListingLayoutProps> = ({ children }) => {
  return <>{children}</>;
};

export default AddNewListingLayout;

/**
 * Export du type pour utilisation externe
 */
export type { AddNewListingLayoutProps };