"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase/client";

const FarmInfoWindow = ({ item, onClose }) => {
  const imageUrl = item?.listingImages?.[0]?.url || "/default-farm-image.jpg";
  const isOpen = item?.availability === "open";
  const router = useRouter();
  const { user } = useUser();
  const { openSignUp } = useClerk();

  const [isFavorited, setIsFavorited] = useState(false);

  // Charger l'état initial des favoris
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user) return;
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("favorites")
        .eq("user_id", user.id)
        .single();
      if (!error && profile?.favorites?.includes(item.id)) {
        setIsFavorited(true);
      }
    };
    checkFavorite();
  }, [user, item.id]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/view-listing/${item.id}`);
  };

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast("Connectez-vous pour ajouter aux favoris");
      openSignUp({ redirectUrl: "/signup" });
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("favorites")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      const currentFavorites = profile?.favorites || [];
      const alreadyFavorited = currentFavorites.includes(item.id);
      const updatedFavorites = alreadyFavorited
        ? currentFavorites.filter((id) => id !== item.id)
        : [...currentFavorites, item.id];

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ favorites: updatedFavorites })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setIsFavorited(!alreadyFavorited);
      toast.success(
        alreadyFavorited
          ? "Retiré des favoris"
          : "Ajouté aux favoris avec succès"
      );
    } catch (err) {
      console.error("Erreur favoris :", err.message);
      toast.error("Erreur lors de la mise à jour des favoris");
    }
  };

  return (
    <div className="farm-info-card w-full max-w-[250px]">
      <div className="relative w-full h-[130px] rounded-t-lg overflow-hidden">
        <Image
          src={imageUrl}
          alt={item?.name || "Ferme"}
          fill
          className="object-cover"
          sizes="250px"
          priority={true}
        />
        <div
          className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium shadow-sm ${
            isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {isOpen ? "Ouvert" : "Fermé"}
        </div>
      </div>

      <div className="p-3 bg-white rounded-b-lg">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-medium text-sm text-gray-900 truncate flex-1">
            {item?.name || "Sans nom"}
          </h3>
        </div>

        <p className="text-xs text-gray-500 mb-2 truncate">
          {item?.address || "Adresse non disponible"}
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleClick}
            className="flex-grow py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
          >
            Voir détails
          </button>

          <button
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 p-1.5 bg-white bg-opacity-90 rounded-full shadow-sm hover:bg-white transition-colors"
            aria-label="Ajouter aux favoris"
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorited ? "text-red-500 fill-red-500" : "text-gray-400"
              }`}
            />
          </button>

          <button
            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            aria-label="Fermer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onClose) onClose();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmInfoWindow;
