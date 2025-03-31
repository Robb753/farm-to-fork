// FarmerDashboard.jsx
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

      const urlParams = new URLSearchParams(window.location.search);
      const newSignup = urlParams.get("newSignup") === "true";
      const urlRole = urlParams.get("role");

      if (newSignup && urlRole === "farmer") {
        localStorage.setItem("userRole", "farmer");
        localStorage.setItem("isNewFarmer", "true");
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, "", cleanUrl);

        try {
          const response = await fetch("/api/update-user-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              role: "farmer",
              emergency: true,
            }),
          });
          if (response.ok) {
            await client.session.refresh();
            toast.success("Compte agriculteur configuré");
          }
        } catch (error) {
          console.error("Erreur de mise à jour d'urgence:", error);
        }
      }

      const userRole = user.publicMetadata?.role;
      const storedRole = localStorage.getItem("userRole");
      const isNewFarmer = localStorage.getItem("isNewFarmer") === "true";

      if (userRole && userRole !== "farmer") {
        if (storedRole === "farmer" || isNewFarmer) {
          try {
            const response = await fetch("/api/update-user-role", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                role: "farmer",
                emergency: true,
              }),
            });
            if (response.ok) await client.session.refresh();
          } catch (err) {
            toast.error(
              "Redirection... Cette page est réservée aux agriculteurs"
            );
            router.push("/");
            return;
          }
        } else {
          toast.error("Cette page est réservée aux agriculteurs");
          router.push("/");
          return;
        }
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

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800">
            Bienvenue sur votre espace Agriculteur
          </h1>
          <p className="text-gray-600 mt-2">
            Commencez par créer votre première fiche de ferme
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Créer votre ferme</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas encore de ferme enregistrée. Créez votre fiche
              pour apparaître sur la carte.
            </p>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <img
                src="/images/farm-placeholder.jpg"
                alt="Placeholder"
                className="h-48 opacity-50"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild className="bg-green-600 hover:bg-green-700 gap-2">
              <Link href="/add-new-listing">
                <Plus size={16} /> Créer ma ferme
              </Link>
            </Button>
          </CardFooter>
        </Card>
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
