"use client";
import GoogleAddressSearch from "@/app/_components/GoogleAddressSearch";
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
  const router = useRouter();

  // Rediriger vers la page de sign-in si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  const nexthandler = async () => {
    if (!selectedAddress || !coordinates || loader) return; // Empêcher les requêtes multiples

    setLoader(true);
    console.log(
      "Selected Address:",
      selectedAddress,
      "Coordinates:",
      coordinates
    );

    try {
      const { data, error } = await supabase
        .from("listing")
        .insert([
          {
            address: selectedAddress.formatted_address,
            coordinates: coordinates,
            createdBy:
              user?.primaryEmailAddress?.emailAddress ||
              user?.emailAddresses[0]?.emailAddress, // Vérification multiple
            active: false, // L’annonce est un brouillon par défaut
          },
        ])
        .select()
        .single(); // 🔥 Assurer qu'on récupère un seul enregistrement

      if (error) {
        throw error;
      }

      if (data?.id) {
        console.log("New data added:", data);
        toast.success("New Address added for listing!");

        // 🔥 Ajoute un léger délai avant la redirection
        setTimeout(() => {
          router.push(`/edit-listing/${data.id}`);
        }, 500);
      } else {
        toast.error("Unexpected error, no ID returned.");
      }
    } catch (error) {
      console.error("Error inserting data:", error);
      toast.error("Server error, please try again.");
    } finally {
      setLoader(false);
    }
  };

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
          >
            {loader ? <Loader className="animate-spin" /> : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AddNewListing;
