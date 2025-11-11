// app/user/page.tsx
"use client";

import { UserButton, UserProfile } from "@clerk/nextjs";
import { Building2, Heart } from "@/utils/icons";
import React from "react";
import UserListing from "../_components/UserListing";
import FavoriteListings from "../_components/FavoriteListings";

/**
 * Page de profil utilisateur avec onglets personnalisés Clerk
 * 
 * Cette page utilise le système UserProfile de Clerk pour créer
 * des onglets personnalisés permettant à l'utilisateur de :
 * - Gérer ses informations personnelles (onglet par défaut Clerk)
 * - Voir et modifier ses listings de ferme
 * - Gérer ses favoris
 * 
 * Features:
 * - Intégration UserProfile Clerk avec routing hash
 * - Onglets personnalisés avec icônes
 * - Responsive design avec marges adaptatives
 * - Composants modulaires pour chaque section
 * 
 * @returns JSX.Element - Page de profil utilisateur complète
 */
export default function UserPage(): JSX.Element {
  return (
    <div className="my-6 md:px-10 lg:px-32 w-full">
      <UserProfile routing="hash">
        {/* 🏪 Onglet - Fiche(s) Ferme(s) */}
        <UserButton.UserProfilePage
          label="My Listing"
          labelIcon={<Building2 className="h-5 w-5" />}
          url="my-listing"
        >
          <UserListing />
        </UserButton.UserProfilePage>

        {/* ❤️ Onglet - Favoris */}
        <UserButton.UserProfilePage
          label="Mes favoris"
          labelIcon={<Heart className="h-5 w-5 text-red-500" />}
          url="favorites"
        >
          <FavoriteListings />
        </UserButton.UserProfilePage>
      </UserProfile>
    </div>
  );
}