"use client";

import React from "react";
import EditListing from "../_components/EditListing";
import FarmerOnlySection from "@/app/modules/farmer/components/FarmerOnlySection";

/**
 * Interface pour les paramètres de route
 */
interface EditListingPageParams {
  /** ID du listing à éditer */
  id: string;
}

/**
 * Props du composant page EditListingPage
 */
interface EditListingPageProps {
  /** Paramètres de route Next.js */
  params: EditListingPageParams;
}

/**
 * Page d'édition de listing
 *
 * Cette page sert de wrapper pour le composant EditListing.
 * Elle reçoit l'ID du listing depuis les paramètres de route Next.js
 * et le transmet au composant EditListing pour l'édition.
 *
 * Route: /edit-listing/[id]
 *
 * @param props - Props contenant les paramètres de route
 * @returns Page d'édition de listing
 */
const EditListingPage: React.FC<EditListingPageProps> = ({ params }) => {
  // Validation des paramètres
  if (!params?.id) {
    console.error(
      "EditListingPage: ID du listing manquant dans les paramètres"
    );
    return (
      <FarmerOnlySection>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-600">
              Erreur de paramètres
            </h1>
            <p className="text-gray-600">
              L'ID du listing est manquant dans l'URL
            </p>
            <p className="text-sm text-gray-500">
              Veuillez vérifier l'URL et réessayer
            </p>
          </div>
        </div>
      </FarmerOnlySection>
    );
  }

  return (
    <FarmerOnlySection>
      <EditListing params={params} />
    </FarmerOnlySection>
  );
};

export default EditListingPage;

/**
 * Export des types pour utilisation externe
 */
export type { EditListingPageProps, EditListingPageParams };
