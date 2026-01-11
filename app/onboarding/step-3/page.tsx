"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { Sprout, Eye, Edit, MapPin, Mail, Loader2 } from "lucide-react";

import { useSupabaseWithClerk } from "@/utils/supabase/client";

const steps = [
  { number: 1, label: "Demande" },
  { number: 2, label: "Votre ferme" },
  { number: 3, label: "Activation" },
];

type ListingRow = {
  id: number;
  clerk_user_id: string | null;
  active: boolean | null;
  name: string | null;
  description: string | null;
  address: string | null;
  email: string | null;
  phoneNumber: string | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
  published_at: string | null;
  modified_at: string | null;
  updated_at: string | null;

  // ✅ dans ton schéma
  orders_enabled: boolean;
  delivery_available: boolean;
};

type ProfileRow = {
  role: "user" | "farmer" | "admin";
  farm_id: number | null;
};

export default function Step3Page() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const supabase = useSupabaseWithClerk();

  const [listing, setListing] = useState<ListingRow | null>(null);
  const [enableOrders, setEnableOrders] = useState(false);
  const [publishFarm, setPublishFarm] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      toast.error("Vous devez être connecté");
      router.replace("/sign-in");
      return;
    }

    const load = async () => {
      setChecking(true);
      try {
        // ✅ rôle en DB
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role,farm_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        const role = (profile as ProfileRow | null)?.role;
        if (role !== "farmer" && role !== "admin") {
          toast.error("Votre demande n'a pas encore été approuvée");
          router.replace("/onboarding/pending");
          return;
        }

        // ✅ listing via clerk_user_id (aligné RLS + triggers)
        const { data, error } = await supabase
          .from("listing")
          .select(
            `
            id,
            clerk_user_id,
            active,
            name,
            description,
            address,
            email,
            phoneNumber,
            website,
            lat,
            lng,
            published_at,
            modified_at,
            updated_at,
            orders_enabled,
            delivery_available
          `
          )
          .eq("clerk_user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          toast.error("Aucune fiche ferme trouvée. Reprenez l’étape 2.");
          router.replace("/onboarding/step-2");
          return;
        }

        const row = data as ListingRow;
        setListing(row);

        // ✅ prefill toggles depuis DB
        setPublishFarm(Boolean(row.active));
        setEnableOrders(Boolean(row.orders_enabled));
      } catch (e: any) {
        console.error("Erreur load listing:", e);
        toast.error(e?.message || "Erreur lors du chargement");
      } finally {
        setChecking(false);
      }
    };

    load();
  }, [isLoaded, user, router, supabase]);

  const handlePublish = async () => {
    if (!listing) return;

    if (!publishFarm) {
      toast.error("Veuillez cocher 'Publier ma ferme' pour continuer");
      return;
    }

    if (listing.lat == null || listing.lng == null) {
      toast.error("Coordonnées GPS manquantes. Reprenez l’étape 2.");
      router.push("/onboarding/step-2");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/onboarding/create-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          enableOrders,
          publishFarm: true,
        }),
      });

      type ApiOk = { success: true; listingId: number; message?: string };
      type ApiErr = { success: false; error?: string; message?: string };
      type ApiResult = ApiOk | ApiErr;

      const result: ApiResult = await response.json();

      if (!response.ok) {
        const msg = !result.success
          ? result.message || result.error || "Erreur publication"
          : "Erreur publication";
        throw new Error(msg);
      }

      if (!result.success) {
        throw new Error(result.message || result.error || "Erreur publication");
      }

      toast.success(result.message ?? "✅ Ferme publiée avec succès !");
      router.push("/onboarding/success");
    } catch (e: any) {
      console.error("Erreur publish via API:", e);
      toast.error(e?.message || "Erreur lors de la publication");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!listing) return;

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("listing")
        .update({
          active: false, // ✅ brouillon
          orders_enabled: enableOrders,
          modified_at: now,
          updated_at: now,
          // published_at : on ne touche pas (on évite de “publier” sans le vouloir)
        })
        .eq("id", listing.id);

      if (error) throw error;

      toast.success("✅ Brouillon enregistré");
      router.push("/dashboard/farms");
    } catch (e: any) {
      console.error("Erreur save draft:", e);
      toast.error(e?.message || "Erreur lors de l'enregistrement du brouillon");
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!isLoaded || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="min-h-screen bg-background p-4 py-12">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="flex items-center gap-2 mb-8 text-primary hover:text-primary/80 transition-colors w-fit"
        >
          <Sprout className="w-6 h-6" />
          <span className="font-semibold text-lg">Farm2Fork</span>
        </Link>

        <ProgressIndicator currentStep={3} steps={steps} />

        <div className="space-y-6">
          <Card className="shadow-lg border-2">
            <CardHeader>
              <CardTitle className="text-3xl text-balance">
                Validation & Activation
              </CardTitle>
              <CardDescription className="text-base leading-relaxed mt-2">
                Vérifiez votre fiche et publiez-la pour apparaître sur la carte.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* ✅ PATCH: bouton Retour vers step-2 */}
          <div className="flex">
            <Button
              variant="outline"
              onClick={() => router.push("/onboarding/step-2")}
            >
              ← Retour à l'étape 2
            </Button>
          </div>

          <Card className="shadow-md border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Aperçu public</CardTitle>
                <Button variant="outline" size="sm" disabled>
                  <Eye className="w-4 h-4 mr-2" />
                  Voir comme un client
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  {listing.name ?? "Nom à compléter"}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {listing.description || "Description à compléter"}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{listing.address || "Adresse à compléter"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>{listing.email || "Email manquant"}</span>
                </div>
              </div>

              <Button
                variant="link"
                className="p-0 h-auto text-primary"
                asChild
              >
                <Link href="/onboarding/step-2">
                  Modifier ma fiche <Edit className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md border">
            <CardHeader>
              <CardTitle className="text-xl">Activation</CardTitle>
              <CardDescription>
                Choisissez comment vous souhaitez être visible
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Checkbox
                    id="enableOrders"
                    checked={enableOrders}
                    onCheckedChange={(checked) =>
                      setEnableOrders(Boolean(checked))
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="enableOrders"
                      className="text-base font-semibold cursor-pointer"
                    >
                      Activer les commandes
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Active <code>orders_enabled</code> (colonne dédiée).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Checkbox
                    id="publishFarm"
                    checked={publishFarm}
                    onCheckedChange={(checked) =>
                      setPublishFarm(Boolean(checked))
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="publishFarm"
                      className="text-base font-semibold cursor-pointer"
                    >
                      Publier ma ferme
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Votre ferme sera visible sur la carte et dans les
                      recherches.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={handlePublish}
                  disabled={!publishFarm || isSubmitting}
                  className="flex-1 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publication...
                    </>
                  ) : (
                    "Publier ma ferme"
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="sm:w-auto bg-transparent"
                  disabled={isSubmitting}
                  onClick={handleSaveDraft}
                >
                  Enregistrer pour plus tard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
