"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";
import AddressAutocompleteMapbox from "@/app/modules/maps/components/shared/AddressAutocompleteMapbox";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function AddNewListing() {
  const [selectedAddress, setSelectedAddress] = useState(null); // string (label)
  const [coordinates, setCoordinates] = useState(null); // { lat, lng }
  const [loader, setLoader] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // Vérification des accès
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      // redirection douce + retour vers cette page
      const redirectTo = "/add-new-listing";
      router.replace(`/sign-in?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }

    const role = user?.publicMetadata?.role;
    if (role && role !== "farmer") {
      toast.error("Cette page est réservée aux agriculteurs.");
      router.replace("/");
      return;
    }

    setIsChecking(false);
  }, [isLoaded, isSignedIn, user, router]);

  // Mapbox: payload = { label, place_name, lng, lat, bbox?, address: { line1, city, postcode, region, country } }
  const handleAddressSelect = (payload) => {
    const { label, lat, lng } = payload || {};
    setSelectedAddress(label || null);
    setCoordinates(
      Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
    );
  };

  const nexthandler = async () => {
    if (!selectedAddress || !coordinates || loader) return;

    setLoader(true);

    try {
      const email =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress;

      if (!email) throw new Error("Email introuvable.");

      // Vérifier si une fiche existe déjà
      const { data: existingListing, error: fetchError } = await supabase
        .from("listing")
        .select("id")
        .eq("createdBy", email)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      // Préparer le payload selon ton schéma
      const payload = {
        address: selectedAddress,
        lat: parseFloat(coordinates.lat),
        lng: parseFloat(coordinates.lng),
        createdBy: email,
        active: false,
        updated_at: new Date().toISOString(),
        // Initialiser champs
        name: null,
        email: email,
        description: null,
        website: null,
        phoneNumber: null,
        profileImage: null,
        fullName: user?.fullName || null,
        product_type: [],
        purchase_mode: [],
        production_method: [],
        certifications: [],
        availability: [],
        additional_services: [],
      };

      if (existingListing) {
        // Mise à jour
        const { data, error } = await supabase
          .from("listing")
          .update(payload)
          .eq("id", existingListing.id)
          .select()
          .single();

        if (error) throw error;

        toast.success("Adresse mise à jour avec succès !");
        router.push(`/edit-listing/${existingListing.id}`);
      } else {
        // Création
        const { data, error } = await supabase
          .from("listing")
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        if (data?.id) {
          toast.success("Nouvelle adresse ajoutée !");
          // ✅ route normalisée en minuscules
          router.push(`/edit-listing/${data.id}`);
        } else {
          toast.error("Erreur inattendue : aucun ID retourné.");
        }
      }
    } catch (error) {
      console.error("Erreur complète:", error);

      const msg =
        (error && (error.message || error.error_description)) ||
        "Erreur inconnue";
      if (msg.includes("permission")) {
        toast.error("Erreur de permissions. Vérifiez vos droits d'accès.");
      } else if (msg.includes("constraint")) {
        toast.error("Erreur de contrainte de base de données.");
      } else if (msg.includes("network")) {
        toast.error("Erreur de connexion. Vérifiez votre connexion Internet.");
      } else {
        toast.error(`Erreur: ${msg}`);
      }
    } finally {
      setLoader(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-12 w-12 rounded-full border-t-2 border-b-2 border-green-500" />
          <p className="text-gray-600">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card className="border-t-4 border-green-600 shadow-sm hover:shadow transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-green-700">
            Ajouter votre ferme
          </CardTitle>
          <CardDescription>
            Indiquez l'adresse exacte de votre ferme ou lieu de production.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col items-center text-center gap-4 mb-4">
            <MapPin className="h-8 w-8 text-green-600" />
            <p className="text-gray-600">
              Cette information est importante pour les acheteurs locaux.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Adresse complète de votre ferme *
            </label>
            <AddressAutocompleteMapbox
              value={selectedAddress ?? ""}
              onChange={setSelectedAddress}
              onSelect={handleAddressSelect}
              placeholder="Numéro, rue, ville (ex : 123 Route des Champs, 67000 Strasbourg)"
              country="FR"
            />
          </div>

          {selectedAddress && coordinates && (
            <div className="p-3 bg-green-50 border border-green-100 rounded-md text-sm text-green-800">
              <strong>Adresse sélectionnée :</strong> {selectedAddress}
              <br />
              <small>
                Coordonnées : {coordinates.lat.toFixed(6)},{" "}
                {coordinates.lng.toFixed(6)}
              </small>
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
