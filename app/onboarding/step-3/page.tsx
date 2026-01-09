"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
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
import { Badge } from "@/components/ui/badge";
import { Sprout, Eye, Edit, MapPin, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ProgressIndicator } from "@/components/ui/progress-indicator";

const steps = [
  { number: 1, label: "Demande" },
  { number: 2, label: "Votre ferme" },
  { number: 3, label: "Activation" },
];

// Type pour le profil généré
interface GeneratedProfile {
  farmProfile: {
    name: string;
    description: string;
    location: string;
    contact: string;
  };
  products: Array<{
    id: number;
    name: string;
    category?: string;
    price: number;
    unit?: string;
    status: string;
  }>;
}

export default function Step3Page() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [enableOrders, setEnableOrders] = useState(false);
  const [publishFarm, setPublishFarm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [generatedData, setGeneratedData] = useState<GeneratedProfile | null>(
    null
  );
  const [products, setProducts] = useState<GeneratedProfile["products"]>([]);

  // Charger les données du step 2
  useEffect(() => {
    const storedRequestId = localStorage.getItem("farmerRequestId");
    const storedProfile = localStorage.getItem("generatedProfile");

    if (!storedRequestId || !storedProfile) {
      toast.error("Données manquantes. Veuillez recommencer depuis l'étape 1.");
      router.push("/onboarding/step-1");
      return;
    }

    try {
      const profile: GeneratedProfile = JSON.parse(storedProfile);
      setRequestId(parseInt(storedRequestId, 10));
      setGeneratedData(profile);
      setProducts(profile.products || []);
    } catch (error) {
      console.error("Erreur parsing profil:", error);
      toast.error("Erreur de chargement du profil");
      router.push("/onboarding/step-2");
    }
  }, [router]);

  // Vérifier que l'utilisateur est connecté et est farmer
  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      toast.error("Vous devez être connecté");
      router.push("/sign-in");
      return;
    }

    const userRole = user.publicMetadata?.role as string;
    if (userRole !== "farmer") {
      toast.error("Votre demande n'a pas encore été approuvée");
      router.push("/onboarding/pending");
      return;
    }
  }, [isLoaded, user, router]);

  const updateProductPrice = (id: number, newPrice: string) => {
    setProducts(
      products.map((p) =>
        p.id === id ? { ...p, price: parseFloat(newPrice) || 0 } : p
      )
    );
  };

  const updateProductStatus = (id: number, newStatus: string) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
  };

  const handlePublish = async () => {
    if (!publishFarm) {
      toast.error("Veuillez cocher 'Publier ma ferme' pour continuer");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!requestId || !generatedData) {
        toast.error("Données manquantes");
        return;
      }

      // Appel à l'API create-listing
      const response = await fetch("/api/onboarding/create-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          userId: user?.id,
          email: user?.primaryEmailAddress?.emailAddress,
          farmProfile: generatedData.farmProfile,
          products: products,
          enableOrders,
          publishFarm,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Nettoyer le localStorage
        localStorage.removeItem("farmerRequestId");
        localStorage.removeItem("generatedProfile");

        toast.success(result.message || "Ferme publiée avec succès !");
        router.push("/onboarding/success");
      } else {
        toast.error(result.message || "Erreur lors de la publication");
      }
    } catch (error) {
      console.error("Erreur réseau:", error);
      toast.error("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge className="bg-primary text-primary-foreground">
            Disponible
          </Badge>
        );
      case "limited":
        return <Badge variant="secondary">Limité</Badge>;
      case "order":
        return <Badge variant="outline">Sur commande</Badge>;
      default:
        return null;
    }
  };

  // Afficher un loader pendant le chargement
  if (!requestId || !generatedData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

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
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl text-balance">
                    Validation & Activation
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed mt-2">
                    Votre fiche a été générée automatiquement. Vérifiez et
                    activez votre profil !
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

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
                  {generatedData.farmProfile.name}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {generatedData.farmProfile.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{generatedData.farmProfile.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>{generatedData.farmProfile.contact}</span>
                </div>
              </div>

              <Button
                variant="link"
                className="p-0 h-auto text-primary"
                asChild
              >
                <Link href="/onboarding/step-2">
                  Modifier la description <Edit className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md border">
            <CardHeader>
              <CardTitle className="text-xl">Mes produits</CardTitle>
              <CardDescription>
                Ajustez les prix et la disponibilité. Pas besoin de gérer des
                stocks précis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      {product.category && (
                        <p className="text-xs text-muted-foreground">
                          {product.category}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">
                          Prix :
                        </Label>
                        <input
                          type="number"
                          step="0.1"
                          value={product.price}
                          onChange={(e) =>
                            updateProductPrice(product.id, e.target.value)
                          }
                          className="w-20 px-2 py-1 border rounded text-sm bg-background"
                        />
                        <span className="text-sm">
                          €/{product.unit || "kg"}
                        </span>
                      </div>

                      <select
                        value={product.status}
                        onChange={(e) =>
                          updateProductStatus(product.id, e.target.value)
                        }
                        className="px-3 py-1 border rounded text-sm bg-background"
                      >
                        <option value="available">Disponible</option>
                        <option value="limited">Limité</option>
                        <option value="order">Sur commande</option>
                      </select>

                      {getStatusBadge(product.status)}
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-4 bg-transparent">
                + Ajouter un produit
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
                      setEnableOrders(checked as boolean)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="enableOrders"
                      className="text-base font-semibold cursor-pointer"
                    >
                      Activer les commandes sur ma ferme
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Vous recevrez les demandes par email. Le paiement en ligne
                      peut être activé plus tard.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Checkbox
                    id="publishFarm"
                    checked={publishFarm}
                    onCheckedChange={(checked) =>
                      setPublishFarm(checked as boolean)
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
                      Publication en cours...
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
                >
                  Enregistrer pour plus tard
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Vous pourrez modifier ces paramètres à tout moment depuis votre
                tableau de bord.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
