"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Loader2, Building2, MapPin, Sprout } from "lucide-react";

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

import { COLORS } from "@/lib/config";
import { cn } from "@/lib/utils";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import Link from "next/link";

// ✅ Hook Clerk-aware Supabase
import { useSupabaseWithClerk } from "@/utils/supabase/client";

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
] as const;

type ProductUiLabel = (typeof PRODUCT_OPTIONS)[number];

// Option A (enum DB = labels FR exacts)
const PRODUCT_ENUM_VALUE: Record<ProductUiLabel, string> = {
  Fruits: "Fruits",
  Légumes: "Légumes",
  "Produits laitiers": "Produits laitiers",
  Viande: "Viande",
  Œufs: "Œufs",
  Miel: "Miel",
  Céréales: "Céréales",
  Pain: "Pain",
  Autres: "Autres",
};

interface Step2FormData {
  description: string;
  website: string;
  phone: string;
}

interface FarmerRequest {
  id: number;
  user_id: string;
  status: "approved";
  first_name: string | null;
  last_name: string | null;
  farm_name: string;
  email: string;
  location: string;
  lat: number | null;
  lng: number | null;
  description: string | null;
  products: string | null;
  website: string | null;
  phoneNumber: string | null;
}

type RequestStatus = "approved" | "pending" | "rejected";

export default function OnboardingStep2Page() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  // ✅ 1) client supabase ici
  const supabase = useSupabaseWithClerk();

  const [formData, setFormData] = useState<Step2FormData>({
    description: "",
    website: "",
    phone: "",
  });

  const [selectedProducts, setSelectedProducts] = useState<ProductUiLabel[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [farmerRequest, setFarmerRequest] = useState<FarmerRequest | null>(
    null
  );

  const hasChecked = useRef(false);

  const toggleProduct = useCallback((product: ProductUiLabel) => {
    setSelectedProducts((prev) =>
      prev.includes(product)
        ? prev.filter((p) => p !== product)
        : [...prev, product]
    );
  }, []);

  const isFormValid =
    formData.description.trim().length >= 50 && selectedProducts.length > 0;

  // ✅ Vérifie que l’utilisateur est APPROVED (sinon -> pending)
  useEffect(() => {
    if (hasChecked.current) return;
    if (!isLoaded) return;

    if (!user) {
      router.replace("/sign-in");
      return;
    }

    const run = async () => {
      hasChecked.current = true;

      try {
        // On récupère la demande (peu importe status) pour router correctement
        const { data, error } = await supabase
          .from("farmer_requests")
          .select(
            "id,user_id,status,first_name,last_name,farm_name,email,location,lat,lng,description,products,website,phoneNumber"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Erreur Supabase:", error);
          toast.error("Erreur lors de la vérification");
          router.replace("/onboarding/step-1");
          return;
        }

        if (!data) {
          // Pas de demande -> step-1
          router.replace("/onboarding/step-1");
          return;
        }

        const status = data.status as RequestStatus;

        if (status !== "approved") {
          // pending ou rejected -> page pending qui gère les variantes
          router.replace("/onboarding/pending");
          return;
        }

        const req = data as FarmerRequest;
        setFarmerRequest(req);

        // Prefill champs
        setFormData((prev) => ({
          ...prev,
          description: req.description ?? prev.description,
          website: req.website ?? prev.website,
          phone: req.phoneNumber ?? prev.phone,
        }));

        // Prefill produits (string "A, B, C")
        if (req.products) {
          const parsed = String(req.products)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

          const safe = parsed.filter((p): p is ProductUiLabel =>
            (PRODUCT_OPTIONS as readonly string[]).includes(p)
          );
          setSelectedProducts(safe);
        }

        // Warn coords
        if (req.lat == null || req.lng == null) {
          toast.warning("⚠️ Coordonnées GPS manquantes. Reprenez l'étape 1.");
        }
      } catch (err) {
        console.error("Erreur vérification statut:", err);
        toast.error("Erreur lors de la vérification");
        router.replace("/onboarding/step-1");
      } finally {
        setChecking(false);
      }
    };

    run();
  }, [isLoaded, user, router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || loading || !farmerRequest) return;

    if (!user) {
      toast.error("Vous devez être connecté");
      router.replace("/sign-in");
      return;
    }

    // Refuser si coords manquantes
    if (farmerRequest.lat == null || farmerRequest.lng == null) {
      toast.error("Coordonnées GPS manquantes. Reprenez l'étape 1.");
      router.replace("/onboarding/step-1");
      return;
    }

    setLoading(true);

    try {
      // 1) Update farmer_requests (Step2 data)
      const { error: updateReqError } = await supabase
        .from("farmer_requests")
        .update({
          description: formData.description.trim(),
          products: selectedProducts.join(", "),
          website: formData.website.trim() || null,
          phoneNumber: formData.phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", farmerRequest.id);

      if (updateReqError) throw updateReqError;

      // 2) Update/Upsert listing lié à l'utilisateur (trigger l’a peut-être déjà créé)
      const productEnumArray = selectedProducts.map(
        (p) => PRODUCT_ENUM_VALUE[p]
      );

      // ✅ IMPORTANT : on aligne avec ta DB/RLS : listing.clerk_user_id = Clerk userId
      const listingPayload = {
        clerk_user_id: user.id,
        active: false, // Step-3 décidera publication

        name: farmerRequest.farm_name,
        email: farmerRequest.email,
        address: farmerRequest.location,

        lat: farmerRequest.lat, // number (pas null ici)
        lng: farmerRequest.lng,

        description: formData.description.trim(),
        website: formData.website.trim() || null,
        phoneNumber: formData.phone.trim() || null,

        // ⚠️ selon ton type DB, ça peut être Json / text[] / enum[]
        // si ton schema TS le refuse, garde le "as any"
        product_type: productEnumArray as any,

        modified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // ✅ upsert sur clerk_user_id (1 user = 1 listing)
      const { error: upsertListingError } = await supabase
        .from("listing")
        .upsert([listingPayload], { onConflict: "clerk_user_id" });

      if (upsertListingError) throw upsertListingError;

      toast.success("✅ Étape 2 enregistrée. Passage à l'activation !");
      router.push("/onboarding/step-3");
    } catch (error: any) {
      console.error("=== ERREUR STEP 2 ===", error);
      toast.error(error?.message || "Erreur lors de l'enregistrement");
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

  if (!farmerRequest) return null;

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
              Complétez les informations pour finaliser votre fiche producteur
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div
                className={`space-y-2 border rounded-lg p-4 ${
                  farmerRequest.lat != null && farmerRequest.lng != null
                    ? "bg-green-50 border-green-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <Label className="flex items-center gap-2">
                  <MapPin
                    className="h-4 w-4"
                    style={{
                      color:
                        farmerRequest.lat != null && farmerRequest.lng != null
                          ? COLORS.SUCCESS
                          : COLORS.WARNING,
                    }}
                  />
                  Adresse de votre ferme (déjà enregistrée)
                </Label>

                <p className="text-sm font-medium">
                  {farmerRequest.location || "Adresse non définie"}
                </p>

                {farmerRequest.lat != null && farmerRequest.lng != null ? (
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

              <Button type="submit" disabled={!isFormValid || loading}>
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
