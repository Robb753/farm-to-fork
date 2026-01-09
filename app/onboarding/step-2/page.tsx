// app/onboarding/step-2/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Loader2, Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/utils/supabase/client";
import { COLORS } from "@/lib/config";
import { cn } from "@/lib/utils";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import Link from "next/link";
import { Sprout } from "lucide-react";

const steps = [
  { number: 1, label: "Demande" },
  { number: 2, label: "Votre ferme" },
  { number: 3, label: "Activation" },
];

const PRODUCT_OPTIONS = [
  "Fruits",
  "Légumes",
  "Produits laitiers",
  "Viande",
  "Œufs",
  "Miel",
  "Céréales",
  "Pain",
  "Autres",
];

interface Step2FormData {
  description: string;
  products: string;
  website: string;
  phone: string;
}

interface FarmerRequest {
  id: number;
  user_id: string;
  status: string;
  first_name: string;
  last_name: string;
  farm_name: string;
  email: string;
  location: string;
  lat?: number | null;
  lng?: number | null;
}

export default function OnboardingStep2Page() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [formData, setFormData] = useState<Step2FormData>({
    description: "",
    products: "",
    website: "",
    phone: "",
  });

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const [farmerRequest, setFarmerRequest] = useState<FarmerRequest | null>(
    null
  );

  // ✅ FIX : Flag pour éviter les vérifications multiples
  const hasChecked = useRef(false);

  /**
   * ✅ Vérifier UNE SEULE FOIS que l'utilisateur a une demande approuvée
   */
  useEffect(() => {
    // ✅ Bloquer si déjà vérifié
    if (hasChecked.current) return;
    if (!isLoaded) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }

    const checkApprovalStatus = async () => {
      hasChecked.current = true; // ✅ Marquer comme vérifié

      try {
        const { data, error } = await supabase
          .from("farmer_requests")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .maybeSingle(); // ✅ maybeSingle au lieu de single

        if (error) {
          console.error("Erreur Supabase:", error);
          toast.error("Erreur lors de la vérification");
          router.replace("/onboarding/step-1");
          return;
        }

        if (!data) {
          toast.error("Vous devez d'abord être approuvé par un administrateur");
          router.replace("/onboarding/pending");
          return;
        }

        // ✅ Cast vers le type étendu
        const requestData = data as any;

        setFarmerRequest({
          id: requestData.id,
          user_id: requestData.user_id,
          status: requestData.status,
          first_name: requestData.first_name,
          last_name: requestData.last_name,
          farm_name: requestData.farm_name,
          email: requestData.email,
          location: requestData.location || "",
          lat: requestData.lat || null,
          lng: requestData.lng || null,
        });

        if (!requestData.lat || !requestData.lng) {
          toast.warning(
            "⚠️ Adresse incomplète. Veuillez contacter l'administrateur."
          );
        }

        // Pré-remplir le formulaire
        if (requestData.description) {
          setFormData((prev) => ({
            ...prev,
            description: requestData.description || "",
          }));
        }
        if (requestData.products) {
          setFormData((prev) => ({
            ...prev,
            products: requestData.products || "",
          }));
          const existingProducts = requestData.products.split(", ");
          setSelectedProducts(existingProducts);
        }
        if (requestData.website) {
          setFormData((prev) => ({
            ...prev,
            website: requestData.website || "",
          }));
        }
        if (requestData.phone) {
          setFormData((prev) => ({ ...prev, phone: requestData.phone || "" }));
        }
      } catch (err) {
        console.error("Erreur vérification statut:", err);
        toast.error("Erreur lors de la vérification");
        router.replace("/onboarding/step-1");
      } finally {
        setChecking(false);
      }
    };

    checkApprovalStatus();
  }, [isLoaded, user, router]);

  const toggleProduct = (product: string) => {
    setSelectedProducts((prev) =>
      prev.includes(product)
        ? prev.filter((p) => p !== product)
        : [...prev, product]
    );
  };

  const isFormValid = (): boolean => {
    return Boolean(
      formData.description.trim().length >= 50 && selectedProducts.length > 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid() || loading || !farmerRequest) return;

    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from("farmer_requests")
        .update({
          description: formData.description.trim(),
          products: selectedProducts.join(", "),
          website: formData.website.trim() || null,
          phone: formData.phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", farmerRequest.id);

      if (updateError) throw updateError;

      const { error: listingError } = await supabase.from("listing").insert([
        {
          createdBy: farmerRequest.email,
          email: farmerRequest.email,
          name: farmerRequest.farm_name,
          fullName: `${farmerRequest.first_name} ${farmerRequest.last_name}`,
          address: farmerRequest.location,
          lat: farmerRequest.lat ?? 0,
          lng: farmerRequest.lng ?? 0,
          description: formData.description.trim(),
          product_type: JSON.stringify(selectedProducts),
          phoneNumber: formData.phone.trim() || null,
          website: formData.website.trim() || null,
          active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ] as any);

      if (listingError) {
        if (listingError.code === "23505") {
          const { error: updateListingError } = await supabase
            .from("listing")
            .update({
              name: farmerRequest.farm_name,
              fullName: `${farmerRequest.first_name} ${farmerRequest.last_name}`,
              address: farmerRequest.location,
              lat: farmerRequest.lat ?? 0,
              lng: farmerRequest.lng ?? 0,
              description: formData.description.trim(),
              product_type: JSON.stringify(selectedProducts),
              phoneNumber: formData.phone.trim() || null,
              website: formData.website.trim() || null,
              updated_at: new Date().toISOString(),
            } as any)
            .eq("createdBy", farmerRequest.email);

          if (updateListingError) throw updateListingError;
        } else {
          throw listingError;
        }
      }

      toast.success("✅ Informations enregistrées avec succès !");
      router.push("/onboarding/step-3");
    } catch (error) {
      console.error("=== ERREUR STEP 2 ===", error);

      let errorMessage = "Erreur lors de l'enregistrement";
      if (error && typeof error === "object") {
        const err = error as any;
        if (err.message) errorMessage = err.message;
        if (err.code) errorMessage += ` (Code: ${err.code})`;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="h-12 w-12 animate-spin"
            style={{ color: COLORS.PRIMARY }}
          />
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            Vérification de votre statut...
          </p>
        </div>
      </div>
    );
  }

  // ✅ Bloquer le rendu si pas de farmerRequest
  if (!farmerRequest) {
    return null;
  }

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

        <ProgressIndicator currentStep={2} steps={steps} />

        {/* Reste du formulaire */}
        <Card className="shadow-lg border-2">
          <CardHeader>
            <CardTitle
              className="text-2xl flex items-center gap-2"
              style={{ color: COLORS.PRIMARY_DARK }}
            >
              <Building2 className="h-6 w-6" />
              Informations de votre ferme
            </CardTitle>
            <CardDescription>
              Complétez les informations pour créer votre fiche producteur
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Adresse en lecture seule */}
              {farmerRequest && (
                <div
                  className={`space-y-2 border rounded-lg p-4 ${
                    farmerRequest.lat && farmerRequest.lng
                      ? "bg-green-50 border-green-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <Label className="flex items-center gap-2">
                    <MapPin
                      className="h-4 w-4"
                      style={{
                        color:
                          farmerRequest.lat && farmerRequest.lng
                            ? COLORS.SUCCESS
                            : COLORS.WARNING,
                      }}
                    />
                    Adresse de votre ferme (déjà enregistrée)
                  </Label>
                  <p className="text-sm font-medium">
                    {farmerRequest.location || "Adresse non définie"}
                  </p>
                  {farmerRequest.lat && farmerRequest.lng ? (
                    <p className="text-xs" style={{ color: COLORS.SUCCESS }}>
                      ✓ Coordonnées GPS : {farmerRequest.lat.toFixed(6)},{" "}
                      {farmerRequest.lng.toFixed(6)}
                    </p>
                  ) : (
                    <p className="text-xs" style={{ color: COLORS.WARNING }}>
                      ⚠️ Coordonnées GPS manquantes
                    </p>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description de votre ferme * (minimum 50 caractères)
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Décrivez votre ferme, vos méthodes de production, votre histoire..."
                  className="min-h-32"
                  maxLength={500}
                />
                <p
                  className="text-xs"
                  style={{
                    color:
                      formData.description.length >= 50
                        ? COLORS.SUCCESS
                        : COLORS.TEXT_MUTED,
                  }}
                >
                  {formData.description.length} / 500 caractères
                  {formData.description.length < 50 &&
                    ` (encore ${50 - formData.description.length} minimum)`}
                </p>
              </div>

              {/* Types de produits */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Types de produits proposés *
                  {selectedProducts.length > 0 && (
                    <span
                      className="ml-auto text-xs font-normal"
                      style={{ color: COLORS.SUCCESS }}
                    >
                      {selectedProducts.length} sélectionné
                      {selectedProducts.length > 1 ? "s" : ""}
                    </span>
                  )}
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PRODUCT_OPTIONS.map((product) => (
                    <button
                      key={product}
                      type="button"
                      onClick={() => toggleProduct(product)}
                      className={cn(
                        "px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium",
                        selectedProducts.includes(product)
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-green-300"
                      )}
                    >
                      {selectedProducts.includes(product) && "✓ "}
                      {product}
                    </button>
                  ))}
                </div>
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone (optionnel)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^\d+\s]/g, "");
                    setFormData((prev) => ({ ...prev, phone: cleaned }));
                  }}
                  placeholder="06 12 34 56 78"
                  maxLength={20}
                />
              </div>

              {/* Site web */}
              <div className="space-y-2">
                <Label htmlFor="website">Site web (optionnel)</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
                  }
                  placeholder="https://maferme.fr"
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Retour
              </Button>

              <Button
                type="submit"
                disabled={!isFormValid() || loading}
                style={{
                  backgroundColor: isFormValid()
                    ? COLORS.PRIMARY
                    : COLORS.BG_GRAY,
                  color: COLORS.TEXT_WHITE,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Continuer →"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
