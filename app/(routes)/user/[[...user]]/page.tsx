// app/user/page.tsx
"use client";

import { UserProfile } from "@clerk/nextjs";
import { Building2, Heart, Clock } from "@/utils/icons";
import React from "react";
import UserListing from "../_components/UserListing";
import FavoriteListings from "../_components/FavoriteListings";
import OnboardingStatus from "@/app/_components/OnboardingStatus";

/**
 * Page de profil utilisateur avec onglets personnalisés Clerk
 *
 * Cette page utilise le système UserProfile de Clerk pour créer
 * des onglets personnalisés permettant à l'utilisateur de :
 * - Gérer ses informations personnelles (onglet par défaut Clerk)
 * - Voir le statut de sa demande producteur (si applicable)
 * - Voir et modifier ses listings de ferme (farmers uniquement)
 * - Gérer ses favoris
 *
 * Features:
 * - Intégration UserProfile Clerk avec routing hash
 * - Onglets personnalisés avec icônes
 * - Onglet conditionnel pour le statut onboarding
 * - Responsive design avec marges adaptatives
 * - Composants modulaires pour chaque section
 *
 * @returns JSX.Element - Page de profil utilisateur complète
 */
export default function UserPage(): JSX.Element {
  return (
    <div className="my-6 md:px-10 lg:px-32 w-full">
      <UserProfile routing="hash">
        {/* ⏳ Onglet - Statut de ma demande (pour tous les users) */}
        <UserProfile.Page
          label="Statut de ma demande"
          labelIcon={<Clock className="h-5 w-5" />}
          url="onboarding-status"
        >
          <OnboardingStatus />
        </UserProfile.Page>

        {/* 🏪 Onglet - Mes Fiches Fermes (farmers uniquement) */}
        <UserProfile.Page
          label="Mes Fiches"
          labelIcon={<Building2 className="h-5 w-5" />}
          url="my-listing"
        >
          <UserListing />
        </UserProfile.Page>

        {/* ❤️ Onglet - Favoris */}
        <UserProfile.Page
          label="Mes favoris"
          labelIcon={<Heart className="h-5 w-5 text-red-500" />}
          url="favorites"
        >
          <FavoriteListings />
        </UserProfile.Page>
      </UserProfile>
    </div>
  );
}
