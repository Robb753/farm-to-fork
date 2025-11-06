"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";

/**
 * Interfaces TypeScript pour AddNewListing
 */
interface AddNewListingProps {
  /** Classe CSS personnalisée */
  className?: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface AddressSelectPayload {
  place_name: string;
  label: string;
  lng: number;
  lat: number;
  bbox?: [number, number, number, number];
  address: {
    line1: string;
    city: string;
    postcode: string;
    region: string;
    country: string;
  };
}

interface ListingPayload {
  address: string;
  lat: number;
  lng: number;
  createdBy: string;
  active: boolean;
  updated_at: string;
  name: string | null;
  email: string;
  description: string | null;
  website: string | null;
  phoneNumber: string | null;
  profileImage: string | null;
  fullName: string | null;
  product_type: string[];
  purchase_mode: string[];
  production_method: string[];
  certifications: string[];
  availability: string[];
  additional_services: string[];
}

interface ExistingListing {
  id: string;
}

type UserRole = "farmer" | "admin" | "user";

/**
 * Hook pour la gestion de l'authentification et des permissions
 */
const useAuthCheck = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      const redirectTo = "/add-new-listing";
      router.replace(`/sign-in?redirect=${encodeURIComponent(redirectTo)}`);
      return;
    }

    const role = user?.publicMetadata?.role as UserRole;
    if (role && role !== "farmer") {
      toast.error("Cette page est réservée aux agriculteurs.");
      router.replace("/");
      return;
    }

    setIsChecking(false);
  }, [isLoaded, isSignedIn, user, router]);

  return { user, isChecking, isAuthenticated: isSignedIn && !isChecking };
};

/**
 * Hook pour la gestion des données de listing
 */
const useListingData = () => {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleAddressSelect = useCallback(
    (payload: AddressSelectPayload): void => {
      try {
        const { label, lat, lng } = payload;

        if (!label || !Number.isFinite(lat) || !Number.isFinite(lng)) {
          toast.error("Adresse invalide sélectionnée");
          return;
        }

        setSelectedAddress(label);
        setCoordinates({ lat, lng });
        console.debug("Adresse sélectionnée:", { label, lat, lng });
      } catch (error) {
        console.error("Erreur lors de la sélection d'adresse:", error);
        toast.error("Erreur lors de la sélection de l'adresse");
      }
    },
    []
  );

  const resetData = useCallback((): void => {
    setSelectedAddress(null);
    setCoordinates(null);
  }, []);

  return {
    selectedAddress,
    coordinates,
    loading,
    setLoading,
    setSelectedAddress,
    handleAddressSelect,
    resetData,
    isValid: Boolean(selectedAddress && coordinates),
  };
};

/**
 * Composant de validation et feedback visuel
 */
interface AddressValidationProps {
  selectedAddress: string | null;
  coordinates: Coordinates | null;
}

const AddressValidation: React.FC<AddressValidationProps> = ({
  selectedAddress,
  coordinates,
}) => {
  if (!selectedAddress || !coordinates) return null;

  return (
    <div
      className="p-3 border rounded-md text-sm"
      style={{
        backgroundColor: COLORS.SUCCESS_BG,
        borderColor: COLORS.SUCCESS + "30",
        color: COLORS.SUCCESS,
      }}
    >
      <strong>Adresse sélectionnée :</strong> {selectedAddress}
      <br />
      <small>
        Coordonnées : {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
      </small>
    </div>
  );
};

/**
 * Composant de chargement avec design system
 */
const LoadingScreen: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="flex flex-col items-center gap-4">
      <div
        className="animate-spin h-12 w-12 rounded-full border-t-2 border-b-2"
        style={{ borderColor: COLORS.PRIMARY }}
      />
      <p style={{ color: COLORS.TEXT_SECONDARY }}>Vérification des accès...</p>
    </div>
  </div>
);

/**
 * Service pour les opérations Supabase
 */
class ListingService {
  static async checkExistingListing(
    email: string
  ): Promise<ExistingListing | null> {
    try {
      const { data, error } = await supabase
        .from("listing")
        .select("id")
        .eq("createdBy", email)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(
        "Erreur lors de la vérification du listing existant:",
        error
      );
      throw error;
    }
  }

  static async createListing(payload: ListingPayload): Promise<{ id: string }> {
    try {
      const { data, error } = await supabase
        .from("listing")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error("Aucun ID retourné lors de la création");

      return data;
    } catch (error) {
      console.error("Erreur lors de la création du listing:", error);
      throw error;
    }
  }

  static async updateListing(
    id: string,
    payload: ListingPayload
  ): Promise<{ id: string }> {
    try {
      const { data, error } = await supabase
        .from("listing")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du listing:", error);
      throw error;
    }
  }
}

/**
 * Composant AddNewListing principal
 *
 * Features:
 * - Vérification d'authentification et de rôle
 * - Autocomplétion d'adresse Mapbox intégrée
 * - Gestion Supabase avec création/mise à jour
 * - Design system cohérent
 * - Gestion d'erreurs robuste
 * - Loading states optimisés
 * - Validation des données
 * - Navigation intelligente
 *
 * @param props - Configuration du composant
 * @returns Composant de création de listing
 */
const AddNewListing: React.FC<AddNewListingProps> = ({ className = "" }) => {
  const { user, isChecking, isAuthenticated } = useAuthCheck();
  const {
    selectedAddress,
    coordinates,
    loading,
    setLoading,
    setSelectedAddress,
    handleAddressSelect,
    isValid,
  } = useListingData();

  const router = useRouter();

  /**
   * Gestion de la soumission du formulaire
   */
  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!isValid || loading || !user) return;

    setLoading(true);

    try {
      const email =
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress;

      if (!email) {
        throw new Error("Email utilisateur introuvable");
      }

      // Vérifier si une fiche existe déjà
      const existingListing = await ListingService.checkExistingListing(email);

      // Préparer le payload
      const payload: ListingPayload = {
        address: selectedAddress!,
        lat: parseFloat(coordinates!.lat.toString()),
        lng: parseFloat(coordinates!.lng.toString()),
        createdBy: email,
        active: false,
        updated_at: new Date().toISOString(),
        name: null,
        email,
        description: null,
        website: null,
        phoneNumber: null,
        profileImage: null,
        fullName: user.fullName || null,
        product_type: [],
        purchase_mode: [],
        production_method: [],
        certifications: [],
        availability: [],
        additional_services: [],
      };

      if (existingListing) {
        // Mise à jour du listing existant
        await ListingService.updateListing(existingListing.id, payload);
        toast.success("Adresse mise à jour avec succès !");
        router.push(`/edit-listing/${existingListing.id}`);
      } else {
        // Création d'un nouveau listing
        const newListing = await ListingService.createListing(payload);
        toast.success("Nouvelle adresse ajoutée !");
        router.push(`/edit-listing/${newListing.id}`);
      }
    } catch (error) {
      console.error("Erreur complète:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";

      if (errorMessage.includes("permission")) {
        toast.error("Erreur de permissions. Vérifiez vos droits d'accès.");
      } else if (errorMessage.includes("constraint")) {
        toast.error("Erreur de contrainte de base de données.");
      } else if (errorMessage.includes("network")) {
        toast.error("Erreur de connexion. Vérifiez votre connexion Internet.");
      } else {
        toast.error(`Erreur: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, [
    isValid,
    loading,
    user,
    selectedAddress,
    coordinates,
    router,
    setLoading,
  ]);

  // État de chargement initial
  if (isChecking) {
    return <LoadingScreen />;
  }

  // Utilisateur non authentifié ou sans permissions
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={cn("container max-w-2xl mx-auto py-12 px-4", className)}>
      <Card
        className="border-t-4 shadow-sm hover:shadow transition-shadow duration-300"
        style={{ borderTopColor: COLORS.PRIMARY }}
      >
        <CardHeader>
          <CardTitle
            className="text-2xl font-bold"
            style={{ color: COLORS.PRIMARY }}
          >
            Ajouter votre ferme
          </CardTitle>
          <CardDescription style={{ color: COLORS.TEXT_SECONDARY }}>
            Indiquez l'adresse exacte de votre ferme ou lieu de production.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Section d'information */}
          <div className="flex flex-col items-center text-center gap-4 mb-4">
            <MapPin className="h-8 w-8" style={{ color: COLORS.PRIMARY }} />
            <p style={{ color: COLORS.TEXT_SECONDARY }}>
              Cette information est importante pour les acheteurs locaux.
            </p>
          </div>

          {/* Champ d'adresse */}
          <div className="space-y-2">
            <label
              className="block text-sm font-medium"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Adresse complète de votre ferme *
            </label>
            <AddressAutocompleteMapbox
              value={selectedAddress || ""}
              onChange={setSelectedAddress}
              onSelect={handleAddressSelect}
              placeholder="Numéro, rue, ville (ex : 123 Route des Champs, 67000 Strasbourg)"
              country="FR"
            />
          </div>

          {/* Validation de l'adresse */}
          <AddressValidation
            selectedAddress={selectedAddress}
            coordinates={coordinates}
          />
        </CardContent>

        <CardFooter
          className="border-t pt-6 flex justify-between"
          style={{ borderColor: COLORS.BORDER }}
        >
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Retour
          </Button>

          <Button
            disabled={!isValid || loading}
            onClick={handleSubmit}
            className="transition-colors"
            style={{
              backgroundColor: isValid ? COLORS.PRIMARY : COLORS.BG_GRAY,
              color: COLORS.TEXT_WHITE,
            }}
            onMouseEnter={(e) => {
              if (isValid && !loading) {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
              }
            }}
            onMouseLeave={(e) => {
              if (isValid) {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
              }
            }}
          >
            {loading ? (
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
};

export default AddNewListing;

/**
 * Export des types pour utilisation externe
 */
export type {
  AddNewListingProps,
  Coordinates,
  AddressSelectPayload,
  ListingPayload,
};
