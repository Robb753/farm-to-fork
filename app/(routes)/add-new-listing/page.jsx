"use client";

import GoogleAddressSearch from "@/app/modules/maps/components/shared/ExploreMapSearch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { useUser } from "@clerk/nextjs";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="mt-10 md:mx-56 lg:mx-80">
      <div className="p-10 flex flex-col gap-5 items-center justify-center">
        <h2 className="font-bold text-2xl">Add New Listing</h2>
        <div className="p-10 rounded-lg shadow-lg flex flex-col gap-5 w-full">
          <h2 className="text-center text-gray-500">
            Enter Address which you want to list
          </h2>
          <GoogleAddressSearch
            selectedAddress={(value) => setSelectedAddress(value)}
            setCoordinates={(value) => setCoordinates(value)}
          />
          <Button
            disabled={!selectedAddress || !coordinates || loader}
            onClick={nexthandler}
            className="bg-green-600 hover:bg-green-700"
          >
            {loader ? <Loader className="animate-spin" /> : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AddNewListing;
