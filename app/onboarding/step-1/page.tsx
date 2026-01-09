// app/onboarding/step-1/page.tsx
"use client";

import type React from "react";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sprout, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import AddressAutocompleteMapbox from "@/app/modules/maps/components/shared/AddressAutocompleteMapbox";
import { COLORS } from "@/lib/config";
import supabase from "@/utils/supabase/client";

const steps = [
  { number: 1, label: "Demande" },
  { number: 2, label: "Votre ferme" },
  { number: 3, label: "Activation" },
];

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

interface Coordinates {
  lat: number;
  lng: number;
}

export default function Step1Page() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [formData, setFormData] = useState({
    farmName: "",
    firstName: "",
    lastName: "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    siret: "",
    address: "",
    coordinates: null as Coordinates | null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Gestion de la sélection d'adresse
   */
  const handleAddressSelect = useCallback(
    (payload: AddressSelectPayload): void => {
      try {
        const { label, lat, lng, address } = payload;

        if (!label || !Number.isFinite(lat) || !Number.isFinite(lng)) {
          toast.error("Adresse invalide sélectionnée");
          return;
        }

        setFormData((prev) => ({
          ...prev,
          address: label,
          coordinates: { lat, lng },
        }));

        toast.success("Adresse enregistrée !");
        console.debug("Adresse sélectionnée:", { label, lat, lng, address });

        // ✅ Fermer le dropdown en retirant le focus
        setTimeout(() => {
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement) {
            activeElement.blur();
          }
        }, 100);
      } catch (error) {
        console.error("Erreur sélection adresse:", error);
        toast.error("Erreur lors de la sélection de l'adresse");
      }
    },
    []
  );

  /**
   * Extraire le département du code postal
   */
  const extractDepartment = (address: string): string => {
    // Chercher le code postal (5 chiffres)
    const postcodeMatch = address.match(/\b(\d{5})\b/);
    if (postcodeMatch) {
      const postcode = postcodeMatch[1];
      // Extraire les 2 premiers chiffres
      const dept = postcode.substring(0, 2);
      return dept;
    }
    return "00"; // Fallback si pas trouvé
  };

  /**
   * Validation du SIRET
   */
  const validateSiret = (siret: string): boolean => {
    const cleaned = siret.replace(/\s/g, "");
    return /^\d{14}$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Vérifier que l'utilisateur est connecté
      if (!isLoaded || !user) {
        toast.error("Vous devez être connecté pour soumettre une demande");
        router.push("/sign-in");
        return;
      }

      // Validation SIRET
      if (!validateSiret(formData.siret)) {
        toast.error("Le SIRET doit contenir exactement 14 chiffres");
        setIsSubmitting(false);
        return;
      }

      // Validation coordonnées
      if (!formData.coordinates) {
        toast.error("Veuillez sélectionner une adresse valide");
        setIsSubmitting(false);
        return;
      }

      // ✅ Extraire le département automatiquement
      const department = extractDepartment(formData.address);

      // ✅ Vérifier si un listing existe déjà (comme AddNewListing)
      const { data: existingRequest } = await supabase
        .from("farmer_requests")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingRequest) {
        toast.error(
          "Vous avez déjà soumis une demande. Veuillez attendre la validation."
        );
        router.push("/onboarding/pending");
        return;
      }

      const response = await fetch("/api/onboarding/submit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          farmName: formData.farmName.trim(),
          siret: formData.siret.replace(/\s/g, ""),
          department: department,

          // ✅ Adresse et coordonnées (comme AddNewListing)
          location: formData.address,
          lat: formData.coordinates.lat,
          lng: formData.coordinates.lng,
        }),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("farmerRequestId", result.requestId.toString());
        toast.success(result.message || "Demande envoyée avec succès !");
        router.push("/onboarding/pending");
      } else {
        toast.error(result.message || "Erreur lors de l'envoi de la demande");
      }
    } catch (error) {
      console.error("Erreur réseau:", error);
      toast.error("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.farmName.trim() &&
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.email &&
    formData.siret &&
    formData.address &&
    formData.coordinates;

  return (
    <div className="min-h-screen bg-background p-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 mb-8 text-primary hover:text-primary/80 transition-colors w-fit"
        >
          <Sprout className="w-6 h-6" />
          <span className="font-semibold text-lg">Farm2Fork</span>
        </Link>

        <ProgressIndicator currentStep={1} steps={steps} />

        <Card className="shadow-lg border-2">
          <CardHeader>
            <CardTitle className="text-3xl text-balance">
              Demande d'accès producteur
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Vérifiez que vous êtes bien producteur. Simple et rapide, vous
              pourrez compléter votre fiche ensuite.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom de la ferme */}
              <div className="space-y-2">
                <Label htmlFor="farmName">Nom de la ferme *</Label>
                <Input
                  id="farmName"
                  type="text"
                  placeholder="Ex: Ferme du Bonheur"
                  value={formData.farmName}
                  onChange={(e) =>
                    setFormData({ ...formData, farmName: e.target.value })
                  }
                  required
                  className="text-base"
                />
              </div>

              {/* Prénom & Nom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                    className="text-base"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean.dupont@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="text-base"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Email récupéré depuis votre compte
                </p>
              </div>

              {/* SIRET */}
              <div className="space-y-2">
                <Label htmlFor="siret">SIRET *</Label>
                <Input
                  id="siret"
                  type="text"
                  placeholder="12345678901234"
                  value={formData.siret}
                  onChange={(e) =>
                    setFormData({ ...formData, siret: e.target.value })
                  }
                  required
                  className="text-base"
                  maxLength={14}
                />
                <p className="text-xs text-muted-foreground">
                  14 chiffres pour le SIRET
                </p>
              </div>

              {/* ✅ ADRESSE MAPBOX */}
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin
                    className="h-4 w-4"
                    style={{ color: COLORS.PRIMARY }}
                  />
                  Adresse complète de votre ferme *
                </Label>
                <AddressAutocompleteMapbox
                  value={formData.address}
                  onChange={(text) =>
                    setFormData((prev) => ({ ...prev, address: text }))
                  }
                  onSelect={handleAddressSelect}
                  placeholder="123 Route des Champs, 67000 Strasbourg"
                  country="FR"
                />
                {formData.coordinates && (
                  <p className="text-xs" style={{ color: COLORS.SUCCESS }}>
                    ✓ Coordonnées GPS : {formData.coordinates.lat.toFixed(6)},{" "}
                    {formData.coordinates.lng.toFixed(6)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Cette adresse sera utilisée pour vous localiser sur la carte
                </p>
              </div>

              {/* Boutons */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  size="lg"
                  disabled={!isFormValid || isSubmitting}
                  className="flex-1 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer la demande"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  asChild
                  className="sm:w-auto bg-transparent"
                >
                  <Link href="/">Annuler</Link>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                * Champs obligatoires
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
