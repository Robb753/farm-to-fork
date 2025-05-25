"use client";

import GoogleAddressSearch from "@/app/modules/maps/components/shared/ExploreMapSearch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { useUser } from "@clerk/nextjs";
import { Loader2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

function AddNewListing() {
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const { user, isLoaded, isSignedIn } = useUser();
  const [loader, setLoader] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  // Vérifier l'authentification et le rôle de l'utilisateur
  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoaded) return;

      // Rediriger si non connecté
      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }

      // Vérifier si l'utilisateur est un agriculteur
      const userRole = user.publicMetadata?.role;

      // Si le rôle est défini et n'est pas "farmer", rediriger
      if (userRole && userRole !== "farmer") {
        toast.error("Cette page est réservée aux agriculteurs");
        router.push("/");
      }

      setIsChecking(false);
    };

    checkAccess();
  }, [isLoaded, isSignedIn, user, router]);

  const nexthandler = async () => {
    if (!selectedAddress || !coordinates || loader) return;

    setLoader(true);

    try {
      const email =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses[0]?.emailAddress;

      if (!email) {
        throw new Error("Email non trouvé");
      }

      // Vérifier si un listing existe déjà pour cet utilisateur
      const { data: existingListing } = await supabase
        .from("listing")
        .select("id")
        .eq("createdBy", email)
        .maybeSingle();

      if (existingListing) {
        // Mettre à jour le listing existant
        const { data, error } = await supabase
          .from("listing")
          .update({
            address: selectedAddress.formatted_address,
            coordinates: coordinates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingListing.id)
          .select()
          .single();

        if (error) throw error;

        toast.success("Adresse mise à jour avec succès!");

        setTimeout(() => {
          router.push(`/edit-listing/${existingListing.id}`);
        }, 500);
      } else {
        // Créer un nouveau listing
        const { data, error } = await supabase
          .from("listing")
          .insert([
            {
              address: selectedAddress.formatted_address,
              coordinates: coordinates,
              createdBy: email,
              active: false,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;

        if (data?.id) {
          toast.success("Nouvelle adresse ajoutée avec succès!");

          setTimeout(() => {
            router.push(`/edit-listing/${data.id}`);
          }, 500);
        } else {
          toast.error("Erreur inattendue, aucun ID retourné.");
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur serveur, veuillez réessayer.");
    } finally {
      setLoader(false);
    }
  };

  // Afficher un spinner pendant la vérification
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <p className="text-gray-600">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card className="border-t-4 border-t-green-600 shadow-sm hover:shadow transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-green-700">
            Ajouter votre ferme
          </CardTitle>
          <CardDescription>
            Commencez par indiquer l'adresse de votre ferme ou lieu de
            production
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center text-center gap-4 mb-4">
            <MapPin className="h-8 w-8 text-green-600" />
            <p className="text-gray-600">
              Renseignez l'adresse exacte où se situe votre exploitation. Cette
              information est importante pour les acheteurs locaux.
            </p>
          </div>

          <div className="rounded-lg border p-4 bg-gray-50">
            <GoogleAddressSearch
              selectedAddress={(value) => setSelectedAddress(value)}
              setCoordinates={(value) => setCoordinates(value)}
            />
          </div>

          {selectedAddress && (
            <div className="p-3 bg-green-50 border border-green-100 rounded-md text-sm text-green-800">
              <strong>Adresse sélectionnée :</strong>{" "}
              {selectedAddress.formatted_address}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Retour
          </Button>
          <Button
            disabled={!selectedAddress || !coordinates || loader}
            onClick={nexthandler}
            className="bg-green-600 hover:bg-green-700"
          >
            {loader ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement...
              </>
            ) : (
              "Continuer"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default AddNewListing;
