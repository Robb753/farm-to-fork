"use client";

import { UserButton, UserProfile } from "@clerk/nextjs";
import { Building2, Heart } from "@/utils/icons";
import React from "react";
import UserListing from "../_components/UserListing";
import FavoriteListings from "../_components/FavoriteListings";

function User() {
  return (
    <div className="my-6 md:px-10 lg:px-32 w-full">
      <UserProfile routing="hash">
        {/* Fiche(s) Ferme(s) */}
        <UserButton.UserProfilePage
          label="My Listing"
          labelIcon={<Building2 className="h-5 w-5" />}
          url="my-listing"
        >
          <UserListing />
        </UserButton.UserProfilePage>

        {/* Favoris */}
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

export default User;
