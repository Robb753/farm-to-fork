// app/onboarding/step-1/page.tsx
"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import Link from "next/link";
import { toast } from "sonner";
import { Sprout, MapPin, Loader2 } from "lucide-react";

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
import { ProgressIndicator } from "@/components/ui/progress-indicator";

import AddressAutocompleteMapbox from "@/app/modules/maps/components/shared/AddressAutocompleteMapbox";
import { COLORS } from "@/lib/config";

import { useSupabaseWithClerk } from "@/utils/supabase/client";

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

type Coordinates = { lat: number; lng: number };

export default function Step1Page() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const supabase = useSupabaseWithClerk();

  const [farmName, setFarmName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [siret, setSiret] = useState("");

  // ✅ cinématique “ancienne”
  const [selectedAddress, setSelectedAddress] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    setEmail(user?.primaryEmailAddress?.emailAddress ?? "");
  }, [isLoaded, user]);

  const validateSiret = (value: string): boolean => {
    const cleaned = value.replace(/\s/g, "");
    return /^\d{14}$/.test(cleaned);
  };

  const handleAddressSelect = useCallback((payload: AddressSelectPayload) => {
    try {
      const { label, lat, lng } = payload;

      if (!label || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        toast.error("Adresse invalide sélectionnée");
        return;
      }

      // ✅ on conserve le flow : on set l’adresse (visible) + coords (tech)
      setSelectedAddress(label);
      setCoordinates({ lat, lng });

      toast.success("Adresse enregistrée !");
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement | null;
        activeElement?.blur();
      }, 100);
    } catch (error) {
      console.error("Erreur sélection adresse:", error);
      toast.error("Erreur lors de la sélection de l'adresse");
    }
  }, []);

  // ✅ important: si l’utilisateur retape du texte manuellement après sélection,
  // on invalide les coords pour éviter un mismatch adresse/coords
  useEffect(() => {
    // si l’adresse change mais que ça ne correspond plus à “une sélection”
    // (on ne peut pas le savoir parfaitement), on fait simple :
    // si l’utilisateur modifie le champ => coords reset.
    // Le composant Mapbox rappellera onSelect quand l’utilisateur choisira à nouveau.
    setCoordinates(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddress]);

  const isFormValid = useMemo(() => {
    return (
      farmName.trim().length > 0 &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      email.trim().length > 0 &&
      validateSiret(siret) &&
      selectedAddress.trim().length > 0 &&
      coordinates != null
    );
  }, [
    farmName,
    firstName,
    lastName,
    email,
    siret,
    selectedAddress,
    coordinates,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      if (!isLoaded || !user) {
        toast.error("Vous devez être connecté pour soumettre une demande");
        router.push("/sign-in");
        return;
      }

      if (!validateSiret(siret)) {
        toast.error("Le SIRET doit contenir exactement 14 chiffres");
        return;
      }

      if (!coordinates) {
        toast.error("Veuillez sélectionner une adresse dans la liste");
        return;
      }

      setIsSubmitting(true);

      // ✅ Vérifie juste un pending existant
      const { data: existingRequest, error: existingError } = await supabase
        .from("farmer_requests")
        .select("id,status")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (existingError) {
        console.error("Erreur check existing request:", existingError);
        toast.error("Impossible de vérifier vos demandes. Réessayez.");
        return;
      }

      if (existingRequest) {
        toast.error("Vous avez déjà une demande en cours.");
        router.push("/onboarding/pending");
        return;
      }

      // ✅ POST API (sans département)
      const response = await fetch("/api/onboarding/submit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? email,

          firstName: firstName.trim(),
          lastName: lastName.trim(),
          farmName: farmName.trim(),
          siret: siret.replace(/\s/g, ""),

          // ✅ seulement ce que tu veux remonter
          location: selectedAddress.trim(),
          lat: coordinates.lat,
          lng: coordinates.lng,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        toast.error(result?.message || "Erreur lors de l'envoi de la demande");
        return;
      }

      localStorage.setItem("farmerRequestId", String(result.requestId));
      toast.success(result.message || "Demande envoyée avec succès !");
      router.push("/onboarding/pending");
    } catch (error) {
      console.error("Erreur réseau:", error);
      toast.error("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <div className="space-y-2">
                <Label htmlFor="farmName">Nom de la ferme *</Label>
                <Input
                  id="farmName"
                  type="text"
                  placeholder="Ex: Ferme du Bonheur"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  required
                  className="text-base"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Jean"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
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
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Email récupéré depuis votre compte
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siret">SIRET *</Label>
                <Input
                  id="siret"
                  type="text"
                  placeholder="12345678901234"
                  value={siret}
                  onChange={(e) => setSiret(e.target.value)}
                  required
                  className="text-base"
                  maxLength={14}
                />
                <p className="text-xs text-muted-foreground">
                  14 chiffres pour le SIRET
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin
                    className="h-4 w-4"
                    style={{ color: COLORS.PRIMARY }}
                  />
                  Adresse complète de votre ferme *
                </Label>

                <AddressAutocompleteMapbox
                  value={selectedAddress || ""}
                  onChange={setSelectedAddress}
                  onSelect={handleAddressSelect}
                  placeholder="Numéro, rue, ville (ex : 123 Route des Champs, 67000 Strasbourg)"
                  country="FR"
                />

                {coordinates && (
                  <p className="text-xs" style={{ color: COLORS.SUCCESS }}>
                    ✓ Coordonnées GPS : {coordinates.lat.toFixed(6)},{" "}
                    {coordinates.lng.toFixed(6)}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Cette adresse sera utilisée pour vous localiser sur la carte
                </p>
              </div>

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
