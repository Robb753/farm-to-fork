"use client";

import React, { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase/client";
import { Loader, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function FarmerDashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { client } = useClerk();
  const [isChecking, setIsChecking] = useState(true);
  const [listing, setListing] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkUserAndListing = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }

      try {
        const email =
          user?.primaryEmailAddress?.emailAddress ||
          user?.emailAddresses[0]?.emailAddress;

        if (email) {
          const { data, error } = await supabase
            .from("listing")
            .select("*, listingImages(url)")
            .eq("createdBy", email)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (error) throw error;

          setListing(data);
        }
      } catch (error) {
        console.error("Erreur listing:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkUserAndListing();
  }, [isLoaded, isSignedIn, user, router, client]);

  const handleDeleteListing = async () => {
    if (!listing) return;

    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette ferme ?"
    );
    if (!confirmed) return;

    try {
      const listingId = listing.id;

      if (listing.listingImages && listing.listingImages.length > 0) {
        const pathsToDelete = listing.listingImages.map((img) => {
          const fullUrl = img.url;
          const path = fullUrl.split("/storage/v1/object/public/")[1];
          return path;
        });

        const { error: storageError } = await supabase.storage
          .from("listingImages")
          .remove(pathsToDelete);

        if (storageError) {
          console.error("Erreur suppression image storage:", storageError);
          toast.error("Erreur suppression images");
          return;
        }

        const { error: dbImgError } = await supabase
          .from("listingImages")
          .delete()
          .eq("listing_id", listingId);

        if (dbImgError) {
          console.error("Erreur suppression DB images:", dbImgError);
          toast.error("Erreur suppression images associées");
          return;
        }
      }

      const { error: deleteListingError } = await supabase
        .from("listing")
        .delete()
        .eq("id", listingId);

      if (deleteListingError) {
        console.error("Erreur suppression listing:", deleteListingError);
        toast.error("Erreur suppression ferme");
        return;
      }

      toast.success("Ferme supprimée avec succès");
      router.push("/dashboard/farms");
      router.refresh();
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      toast.error("Erreur pendant la suppression");
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!listing || !listing.coordinates) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-green-800">
            Bienvenue sur votre espace Agriculteur
          </h1>
          <p className="text-gray-600 mt-3 text-lg">
            Commencez par créer votre première fiche de ferme
          </p>
        </div>

        <div className="border border-gray-200 shadow-sm rounded-lg overflow-hidden bg-white">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-2xl font-medium text-green-800">
              Créer votre ferme
            </h2>
          </div>

          <div className="py-5 px-6">
            <p className="text-gray-700 mb-6">
              Vous n'avez pas encore de ferme enregistrée. Créez votre fiche
              pour apparaître sur la carte.
            </p>

            <div className="border border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-8 aspect-video bg-gray-50">
              <img
                src="/placeholder.jpg"
                alt="Placeholder"
                className="h-24 w-24 opacity-25"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 px-6 py-4 flex justify-center">
            <Button
              asChild
              className="bg-green-600 hover:bg-green-700 rounded-md font-medium py-3 px-4"
            >
              <Link href="/add-new-listing" className="flex items-center gap-2">
                <Plus className="w-5 h-5" /> Créer ma ferme
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-800">
          Tableau de bord de votre ferme
        </h1>
        <p className="text-gray-600 mt-2">
          Gérez les informations et paramètres de votre ferme
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{listing.name || "Votre ferme"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0 w-full md:w-1/3">
                {listing.listingImages && listing.listingImages.length > 0 ? (
                  <img
                    src={listing.listingImages[0].url}
                    alt={listing.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Aucune image</p>
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Adresse</h3>
                  <p className="text-gray-800">
                    {listing.address || "Aucune adresse"}
                  </p>
                </div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Statut</h3>
                  <div
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      listing.active
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {listing.active ? "Publié" : "Brouillon"}
                  </div>
                </div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    Description
                  </h3>
                  <p className="text-gray-800 line-clamp-3">
                    {listing.description || "Aucune description"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button variant="outline" className="text-gray-700" asChild>
              <Link href={`/view-listing/${listing.id}`}>Voir</Link>
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" asChild>
              <Link href={`/edit-listing/${listing.id}`}>Modifier</Link>
            </Button>
            <Button variant="destructive" onClick={handleDeleteListing}>
              Supprimer
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Vues</h3>
                <p className="text-2xl font-bold">0</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Favoris</h3>
                <p className="text-2xl font-bold">0</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Contacts</h3>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}