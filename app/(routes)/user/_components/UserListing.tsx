// app/_components/UserListing.tsx
"use client";

import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { useUser } from "@clerk/nextjs";
import { Globe, MapPin } from "@/utils/icons";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import type { Database } from "@/lib/types/database";

/**
 * Type pour un listing avec ses images associées
 */
type ListingWithImages = Database["public"]["Tables"]["listing"]["Row"] & {
  listingImages: Database["public"]["Tables"]["listingImages"]["Row"][];
};

/**
 * États de chargement possibles
 */
type LoadingState = "loading" | "success" | "error" | "idle";

/**
 * Composant de gestion des listings utilisateur
 * 
 * Permet à un utilisateur de :
 * - Voir tous ses listings
 * - Modifier un listing
 * - Supprimer un listing
 * - Voir les détails d'un listing
 * 
 * Features:
 * - Chargement automatique des données utilisateur
 * - Interface responsive avec grid adaptatif
 * - Actions CRUD avec confirmations
 * - Gestion des états de chargement et d'erreur
 * - Images avec fallback placeholder
 * - Badges de statut (Published/Draft)
 * 
 * @returns JSX.Element - Interface de gestion des listings
 */
export default function UserListing(): JSX.Element {
  const { user, isLoaded } = useUser();
  
  // États du composant avec types stricts
  const [listings, setListings] = useState<ListingWithImages[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  /**
   * Effet pour charger les listings quand l'utilisateur est prêt
   */
  useEffect(() => {
    if (isLoaded && user) {
      getUserListings();
    }
  }, [user, isLoaded]);

  /**
   * Récupère les listings de l'utilisateur depuis Supabase
   */
  const getUserListings = async (): Promise<void> => {
    if (!user?.id) {
      setError("Utilisateur non connecté");
      return;
    }

    setLoadingState("loading");
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from("listing")
        .select(`*, listingImages(url, listing_id)`)
        .eq("createdBy", user.id); // ✅ Utiliser user.id au lieu de l'email

      if (supabaseError) {
        throw new Error(`Erreur Supabase: ${supabaseError.message}`);
      }

      setListings(data as ListingWithImages[] || []);
      setLoadingState("success");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement";
      console.error("[UserListing] Erreur:", err);
      setError(errorMessage);
      setLoadingState("error");
    }
  };

  /**
   * Supprime un listing avec confirmation
   */
  const handleDelete = async (id: number): Promise<void> => {
    const confirmDelete = window.confirm(
      "Êtes-vous sûr de vouloir supprimer ce listing ?"
    );
    
    if (!confirmDelete) return;

    try {
      const { error: deleteError } = await supabase
        .from("listing")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw new Error(`Erreur lors de la suppression: ${deleteError.message}`);
      }

      // Mise à jour optimiste de l'état local
      setListings(prevListings => 
        prevListings.filter(item => item.id !== id)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la suppression";
      console.error("[UserListing] Erreur suppression:", err);
      alert(`Erreur: ${errorMessage}`);
    }
  };

  /**
   * Obtient l'URL de l'image principale ou le placeholder
   */
  const getListingImageUrl = (listing: ListingWithImages): string => {
    return listing.listingImages?.[0]?.url || "/placeholder.png";
  };

  /**
   * Formate le statut du listing pour l'affichage
   */
  const getStatusLabel = (active: boolean): string => {
    return active ? "Publié" : "Brouillon";
  };

  /**
   * Rendu conditionnel selon l'état de chargement
   */
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Vous devez être connecté pour voir vos listings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec action */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-2xl">Gérer vos Listings</h2>
        <Link href="/add-listing">
          <Button variant="default">
            + Nouveau Listing
          </Button>
        </Link>
      </div>

      {/* État de chargement */}
      {loadingState === "loading" && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
          <p className="text-gray-500">Chargement de vos listings...</p>
        </div>
      )}

      {/* État d'erreur */}
      {loadingState === "error" && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Erreur: {error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={getUserListings}
            className="mt-2"
          >
            Réessayer
          </Button>
        </div>
      )}

      {/* Aucun listing */}
      {loadingState === "success" && listings.length === 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">Vous n'avez pas encore de listings.</p>
          <Link href="/add-listing">
            <Button variant="default">
              Créer votre premier listing
            </Button>
          </Link>
        </div>
      )}

      {/* Grid des listings */}
      {loadingState === "success" && listings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="group relative bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
            >
              {/* Badge de statut */}
              <div className="absolute top-3 left-3 z-10">
                <span 
                  className={`px-2 py-1 text-xs font-medium rounded-md ${
                    listing.active 
                      ? "bg-green-500 text-white" 
                      : "bg-yellow-500 text-white"
                  }`}
                >
                  {getStatusLabel(listing.active)}
                </span>
              </div>

              {/* Image */}
              <div className="relative h-48 w-full">
                <Image
                  src={getListingImageUrl(listing)}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                  alt={listing.name || "Image du listing"}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

              {/* Contenu */}
              <div className="p-4 space-y-3">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg line-clamp-1">
                    {listing.name || "Listing sans nom"}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="line-clamp-1">{listing.address || "Adresse non définie"}</span>
                  </div>
                </div>

                {/* Tags informatifs */}
                <div className="flex flex-wrap gap-2">
                  {listing.product_type && (
                    <span className="inline-flex items-center gap-1 text-xs bg-slate-100 rounded-md px-2 py-1 text-gray-600">
                      <Globe className="h-3 w-3" />
                      {listing.product_type}
                    </span>
                  )}
                  {listing.certifications && (
                    <span className="inline-flex items-center gap-1 text-xs bg-slate-100 rounded-md px-2 py-1 text-gray-600">
                      <Globe className="h-3 w-3" />
                      {listing.certifications}
                    </span>
                  )}
                  {listing.purchase_mode && (
                    <span className="inline-flex items-center gap-1 text-xs bg-slate-100 rounded-md px-2 py-1 text-gray-600">
                      <Globe className="h-3 w-3" />
                      {listing.purchase_mode}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/view-listing/${listing.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">
                      Voir
                    </Button>
                  </Link>
                  <Link href={`/edit-listing/${listing.id}`} className="flex-1">
                    <Button size="sm" variant="default" className="w-full">
                      Modifier
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDelete(listing.id)}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}