"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Sprout, MapPin, Loader2, Info } from "lucide-react";

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

import AddressAutocompleteMapbox from "@/app/modules/maps/components/shared/AddressAutocompleteMapbox";
import { COLORS } from "@/lib/config";

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

const schema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  phone: z.string().optional(),
  farmName: z.string().min(1, "Nom de la ferme requis"),
  siret: z
    .string()
    .regex(/^\d{14}$/, "Le SIRET doit contenir exactement 14 chiffres"),
});

type FormValues = z.infer<typeof schema>;

export default function BecomeProducerPage(): JSX.Element | null {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();

  const [checkingExisting, setCheckingExisting] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const lastSelectedLabelRef = useRef<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      farmName: "",
      siret: "",
    },
  });

  // Pre-fill name from Clerk
  useEffect(() => {
    if (!isLoaded || !user) return;
    if (user.firstName) setValue("firstName", user.firstName);
    if (user.lastName) setValue("lastName", user.lastName);
  }, [isLoaded, user, setValue]);

  // Guard: redirect if not signed in, already farmer, or already submitted a request
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace("/sign-in?redirect=/become-producer");
      return;
    }

    const role = user?.publicMetadata?.role as string | undefined;
    if (role === "farmer") {
      router.replace("/dashboard");
      return;
    }

    const checkExisting = async () => {
      try {
        const res = await fetch("/api/onboarding/check-status");
        if (res.ok) {
          const { status } = await res.json();
          if (status !== "none") {
            router.replace("/become-producer/pending");
            return;
          }
        }
      } catch (err) {
        console.error("Erreur vérification requête existante:", err);
      } finally {
        setCheckingExisting(false);
      }
    };

    checkExisting();
  }, [isLoaded, isSignedIn, user, router]);

  const handleAddressChange = (newValue: string) => {
    setSelectedAddress(newValue);
    if (
      coordinates &&
      newValue.trim() !== lastSelectedLabelRef.current.trim()
    ) {
      setCoordinates(null);
    }
  };

  const handleAddressSelect = useCallback(
    (payload: AddressSelectPayload) => {
      const { label, lat, lng } = payload;
      if (!label || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        toast.error("Adresse invalide sélectionnée");
        return;
      }
      lastSelectedLabelRef.current = label;
      setSelectedAddress(label);
      setCoordinates({ lat, lng });
      toast.success("Adresse enregistrée !");
    },
    []
  );

  const isFormValid = useMemo(
    () => selectedAddress.trim().length > 0 && coordinates != null,
    [selectedAddress, coordinates]
  );

  const onSubmit = async (data: FormValues) => {
    if (!isLoaded || !user || !isSignedIn) {
      toast.error("Vous devez être connecté");
      router.push("/sign-in");
      return;
    }

    if (!coordinates) {
      toast.error("Veuillez sélectionner une adresse dans la liste");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/producer-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "create",
          email: user.primaryEmailAddress?.emailAddress ?? "",
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          phone: data.phone?.trim() || undefined,
          farmName: data.farmName.trim(),
          siret: data.siret.replace(/\s/g, ""),
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

      if (result.requestId) {
        localStorage.setItem("farmerRequestId", String(result.requestId));
      }

      toast.success("Demande envoyée avec succès !");
      router.push("/become-producer/pending");
    } catch (err) {
      console.error("Erreur réseau:", err);
      toast.error("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || checkingExisting) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <div className="text-center">
          <Loader2
            className="w-8 h-8 animate-spin mx-auto mb-3"
            style={{ color: COLORS.PRIMARY }}
          />
          <p style={{ color: COLORS.TEXT_SECONDARY }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) return null;

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{ backgroundColor: COLORS.BG_GRAY }}
    >
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity"
          style={{ color: COLORS.PRIMARY }}
        >
          <Sprout className="w-6 h-6" />
          <span className="font-semibold text-lg">Farm2Fork</span>
        </Link>

        <Card className="shadow-lg border-2">
          <CardHeader>
            <CardTitle className="text-3xl">
              Devenir producteur
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Remplissez ce formulaire pour soumettre votre demande d&apos;accès
              producteur. Notre équipe la validera sous 24-48h.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    placeholder="Jean"
                    {...register("firstName")}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    placeholder="Dupont"
                    {...register("lastName")}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  {...register("phone")}
                />
              </div>

              {/* Farm name */}
              <div className="space-y-1.5">
                <Label htmlFor="farmName">Nom de la ferme *</Label>
                <Input
                  id="farmName"
                  placeholder="Ex : Ferme du Bonheur"
                  {...register("farmName")}
                />
                {errors.farmName && (
                  <p className="text-xs text-red-500">
                    {errors.farmName.message}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="address"
                  className="flex items-center gap-1.5"
                >
                  <MapPin
                    className="h-4 w-4"
                    style={{ color: COLORS.PRIMARY }}
                  />
                  Adresse de la ferme *
                </Label>
                <AddressAutocompleteMapbox
                  value={selectedAddress}
                  onChange={handleAddressChange}
                  onSelect={handleAddressSelect}
                  placeholder="Ex : 123 Route des Champs, 67000 Strasbourg"
                  country="FR"
                />
                {coordinates && (
                  <p className="text-xs" style={{ color: COLORS.SUCCESS }}>
                    ✓ Coordonnées GPS enregistrées
                  </p>
                )}
                {!coordinates && selectedAddress.length > 0 && (
                  <p className="text-xs" style={{ color: COLORS.WARNING }}>
                    Sélectionnez une adresse dans la liste déroulante
                  </p>
                )}
              </div>

              {/* SIRET */}
              <div className="space-y-1.5">
                <Label htmlFor="siret" className="flex items-center gap-1.5">
                  SIRET *
                  <span
                    className="inline-flex items-center gap-1 text-xs font-normal px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: COLORS.BG_GRAY,
                      color: COLORS.TEXT_MUTED,
                    }}
                    title="Numéro d'identification de votre exploitation agricole. Composé de 14 chiffres, disponible sur votre extrait Kbis ou avis de situation INSEE."
                  >
                    <Info className="h-3 w-3" />
                    14 chiffres
                  </span>
                </Label>
                <Input
                  id="siret"
                  placeholder="12345678901234"
                  maxLength={14}
                  {...register("siret")}
                />
                {errors.siret && (
                  <p className="text-xs text-red-500">{errors.siret.message}</p>
                )}
                <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                  Disponible sur votre extrait Kbis ou avis de situation INSEE.
                </p>
              </div>

              {/* Reassurance banner */}
              <div
                className="flex items-start gap-3 p-4 rounded-lg border"
                style={{
                  backgroundColor: COLORS.PRIMARY_BG,
                  borderColor: `${COLORS.PRIMARY}30`,
                }}
              >
                <Sprout
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  style={{ color: COLORS.PRIMARY }}
                />
                <p className="text-sm" style={{ color: COLORS.PRIMARY_DARK }}>
                  Votre demande sera examinée sous 24-48h. Vous recevrez un
                  email dès validation.
                </p>
              </div>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={!isFormValid || isSubmitting}
                  className="flex-1 font-semibold"
                  style={{
                    backgroundColor:
                      !isFormValid || isSubmitting
                        ? undefined
                        : COLORS.PRIMARY,
                    color: !isFormValid || isSubmitting ? undefined : COLORS.BG_WHITE,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer ma demande"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  asChild
                  className="sm:w-auto"
                >
                  <Link href="/">Annuler</Link>
                </Button>
              </div>

              <p
                className="text-xs text-center"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                * Champs obligatoires
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
