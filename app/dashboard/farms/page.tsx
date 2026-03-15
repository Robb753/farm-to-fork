"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  Loader2,
  Plus,
  Edit,
  Eye,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  Trash2,
  CheckCircle2,
  Sprout,
  Mail,
  XCircle,
} from "@/utils/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { COLORS, TABLES } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { Listing } from "@/lib/types";
import type { Database } from "@/lib/types/database";
type Product = Database["public"]["Tables"]["products"]["Row"];

// 🔒 SÉCURITÉ
import { escapeHTML, sanitizeHTML } from "@/lib/utils/sanitize";
import { useSupabaseWithClerk } from "@/utils/supabase/client";

/**
 * Normalisation minimale côté client
 * (évite les champs manquants qui cassent l'UI)
 */
function normalizeListing(data: any): Listing {
  return {
    ...data,
    active: data?.active ?? true,
    created_at: data?.created_at ?? new Date().toISOString(),
  } as Listing;
}

/**
 * Sécurise une URL entrée utilisateur
 * - force https:// si absent
 * - bloque javascript:
 */
function getSafeWebsiteUrl(raw?: string | null): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;

  const withProto =
    v.startsWith("http://") || v.startsWith("https://") ? v : `https://${v}`;

  // Bloque schémas dangereux (ceinture + bretelles)
  if (withProto.toLowerCase().startsWith("javascript:")) return null;

  return withProto;
}

export default function FarmerDashboard(): JSX.Element {
  const { user, isLoaded, isSignedIn } = useUser();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [farmerRequestStatus, setFarmerRequestStatus] = useState<
    "pending" | "approved" | "rejected" | null
  >(null);
  const [checkingRequest, setCheckingRequest] = useState<boolean>(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const router = useRouter();

  const supabase = useSupabaseWithClerk();

  const email = useMemo(() => {
    return (
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      null
    );
  }, [user]);

  /**
   * 🆕 ÉTAPE 1 : Vérifier le statut de la farmer_request
   */
  useEffect(() => {
    const checkFarmerRequest = async (): Promise<void> => {
      if (!isLoaded || !isSignedIn || !user) return;

      try {
        setCheckingRequest(true);
        const { data, error: requestError } = await supabase
          .from("farmer_requests")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (requestError) {
          console.error("Erreur vérification farmer_request:", requestError);
          setFarmerRequestStatus(null);
          return;
        }

        if (!data) {
          // Cas 1 : Aucune farmer_request
          setFarmerRequestStatus(null);
        } else {
          // Cas 2, 3, 4 : pending, approved, rejected
          setFarmerRequestStatus(data.status as "pending" | "approved" | "rejected");
        }
      } catch (err) {
        console.error("Erreur:", err);
        setFarmerRequestStatus(null);
      } finally {
        setCheckingRequest(false);
      }
    };

    checkFarmerRequest();
  }, [isLoaded, isSignedIn, user, supabase]);

  /**
   * ÉTAPE 2 : Récupérer le listing seulement si approved
   */
  useEffect(() => {
    const fetchListing = async (): Promise<void> => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }

      if (!email) {
        setError("Email non trouvé");
        setLoading(false);
        return;
      }

      // On attend que la vérification de farmer_request soit terminée
      if (checkingRequest) return;

      // Si pas approved, pas besoin de chercher le listing
      if (farmerRequestStatus !== "approved") {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: supabaseError } = await supabase
          .from(TABLES.LISTING)
          .select("*")
          .eq("clerk_user_id", user.id)
          .maybeSingle();

        if (supabaseError) {
          console.error("Erreur Supabase détaillée:", supabaseError);
          setError(
            `Erreur Supabase: ${supabaseError.message || "Erreur inconnue"}`
          );
          setListing(null);
          return;
        }

        setListing(data ? normalizeListing(data) : null);
      } catch (err) {
        console.error("Erreur générale:", err);
        setError("Une erreur inattendue s'est produite");
        setListing(null);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [isLoaded, isSignedIn, email, router, checkingRequest, farmerRequestStatus, user, supabase]);

  useEffect(() => {
    if (!listing) return;
    const fetchProducts = async (): Promise<void> => {
      setProductsLoading(true);
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("listing_id", listing.id)
        .order("created_at", { ascending: false });
      setProducts(data || []);
      setProductsLoading(false);
    };
    fetchProducts();
  }, [listing, supabase]);

  /**
   * Supprime la fiche ferme après confirmation
   * ✅ Sécurisé : delete par id + createdBy
   */
  const handleDelete = async (): Promise<void> => {
    if (!listing) return;

    if (!isLoaded || !isSignedIn || !email) {
      toast.error("Impossible de supprimer : utilisateur non authentifié.");
      return;
    }

    try {
      const { error } = await supabase
        .from(TABLES.LISTING)
        .delete()
        .eq("id", listing.id)
        .eq("clerk_user_id", user.id);

      if (error) {
        console.error("Erreur lors de la suppression :", error);
        toast.error("Erreur lors de la suppression.");
        return;
      }

      toast.success("Fiche supprimée avec succès !");
      setListing(null);
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      toast.error("Une erreur inattendue s'est produite.");
    }
  };

  const handleProductToggle = async (productId: number, currentPublished: boolean): Promise<void> => {
    const { error } = await supabase
      .from("products")
      .update({ is_published: !currentPublished, active: !currentPublished })
      .eq("id", productId);
    if (error) {
      toast.error("Erreur lors de la mise à jour du produit");
      return;
    }
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, is_published: !currentPublished, active: !currentPublished }
          : p
      )
    );
    toast.success(!currentPublished ? "Produit publié" : "Produit dépublié");
  };

  const handleProductDelete = async (productId: number): Promise<void> => {
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) {
      toast.error("Erreur lors de la suppression du produit");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    toast.success("Produit supprimé");
  };

  // ✅ État de chargement global
  if (loading || checkingRequest) {
    return (
      <div
        className="min-h-screen flex justify-center items-center"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <div className="text-center">
          <Loader2
            className="w-8 h-8 animate-spin mx-auto mb-4"
            style={{ color: COLORS.PRIMARY }}
          />
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            Vérification de votre statut...
          </p>
        </div>
      </div>
    );
  }

  // ✅ État d'erreur
  if (error) {
    return (
      <div
        className="min-h-screen flex justify-center items-center"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <div className="text-center">
          <div
            className="border rounded-lg p-6 max-w-md"
            style={{
              backgroundColor: `${COLORS.ERROR}10`,
              borderColor: `${COLORS.ERROR}30`,
            }}
          >
            <p className="mb-4" style={{ color: COLORS.ERROR }}>
              {escapeHTML(error)}
            </p>
            <Button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: COLORS.PRIMARY,
                color: COLORS.BG_WHITE,
              }}
            >
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // CAS 1 : AUCUNE FARMER_REQUEST
  // ========================================
  if (farmerRequestStatus === null) {
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

          <Card className="shadow-lg border-2 text-center">
            <CardHeader className="space-y-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: COLORS.PRIMARY_BG }}
              >
                <Plus
                  className="w-10 h-10"
                  style={{ color: COLORS.PRIMARY }}
                />
              </div>
              <CardTitle className="text-3xl text-balance">
                Devenir producteur
              </CardTitle>
              <CardDescription className="text-base leading-relaxed max-w-2xl mx-auto">
                Vous n'avez pas encore fait de demande pour devenir producteur.
                Créez votre espace ferme et vendez vos produits locaux.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-accent/50 p-6 rounded-lg text-left">
                <h3 className="font-semibold mb-4" style={{ color: COLORS.PRIMARY }}>
                  🌱 Pourquoi devenir producteur ?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      icon: "🗺️",
                      title: "Visibilité",
                      desc: "Apparaissez sur notre carte interactive",
                    },
                    {
                      icon: "🤝",
                      title: "Vente directe",
                      desc: "Vendez directement aux consommateurs",
                    },
                    {
                      icon: "📈",
                      title: "Croissance",
                      desc: "Développez votre clientèle locale",
                    },
                    {
                      icon: "🌍",
                      title: "Impact",
                      desc: "Participez à l'économie circulaire",
                    },
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="text-2xl">{benefit.icon}</div>
                      <div>
                        <div
                          className="font-medium"
                          style={{ color: COLORS.TEXT_PRIMARY }}
                        >
                          {benefit.title}
                        </div>
                        <div
                          className="text-sm"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                        >
                          {benefit.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  size="lg"
                  asChild
                  className="w-full sm:w-auto"
                  style={{
                    backgroundColor: COLORS.PRIMARY,
                    color: COLORS.BG_WHITE,
                  }}
                >
                  <Link href="/become-producer">
                    Créer une demande
                  </Link>
                </Button>

                <p className="text-xs text-muted-foreground">
                  Le processus prend environ 5 minutes et sera validé sous 24-48h
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ========================================
  // CAS 2 : FARMER_REQUEST PENDING
  // ========================================
  if (farmerRequestStatus === "pending") {
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

          <Card className="shadow-lg border-2 text-center">
            <CardHeader className="space-y-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: COLORS.PRIMARY_BG }}
              >
                <Clock
                  className="w-10 h-10"
                  style={{ color: COLORS.PRIMARY }}
                />
              </div>
              <CardTitle className="text-3xl text-balance">
                Demande en attente
              </CardTitle>
              <CardDescription className="text-base leading-relaxed max-w-2xl mx-auto">
                Nous vérifions que vous êtes bien producteur. Vous recevrez un
                email de confirmation sous 24-48h pour compléter votre fiche
                ferme.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-accent/50 p-4 rounded-lg text-left">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">
                    Vérifiez votre boîte mail :
                  </strong>{" "}
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Pensez à vérifier vos spams si vous ne recevez pas d'email dans
                  les prochaines heures.
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/">Retour à l'accueil</Link>
                </Button>

                <p className="text-xs text-muted-foreground">
                  Des questions ? Contactez-nous à{" "}
                  <a
                    href="mailto:support@farm2fork.com"
                    className="text-primary hover:underline font-medium"
                  >
                    support@farm2fork.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ========================================
  // CAS 4 : FARMER_REQUEST REJECTED
  // ========================================
  if (farmerRequestStatus === "rejected") {
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

          <Card className="shadow-lg border-2 text-center border-red-200 bg-red-50/50">
            <CardHeader className="space-y-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{
                  backgroundColor: `${COLORS.ERROR}20`,
                }}
              >
                <XCircle
                  className="w-10 h-10"
                  style={{ color: COLORS.ERROR }}
                />
              </div>
              <CardTitle className="text-3xl text-balance text-red-900">
                Demande non approuvée
              </CardTitle>
              <CardDescription className="text-base leading-relaxed max-w-2xl mx-auto text-red-800">
                Malheureusement, votre demande n'a pas pu être approuvée.
                Vous pouvez refaire une demande ou nous contacter pour plus
                d'informations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white p-6 rounded-lg border-2 border-red-200">
                <h3 className="font-semibold text-lg mb-3 text-red-900">
                  Que faire maintenant ?
                </h3>
                <p className="text-sm text-red-800 mb-4">
                  Vous pouvez soumettre une nouvelle demande avec des
                  informations complémentaires ou nous contacter pour
                  comprendre les raisons du refus.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    size="lg"
                    asChild
                    style={{
                      backgroundColor: COLORS.PRIMARY,
                      color: COLORS.BG_WHITE,
                    }}
                  >
                    <Link href="/become-producer">
                      Refaire une demande
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/">Retour à l'accueil</Link>
                  </Button>
                </div>
              </div>

              <div className="bg-red-100 p-4 rounded-lg text-left border border-red-300">
                <p className="text-sm text-red-900">
                  <Mail className="inline w-4 h-4 mr-2" />
                  <strong>Besoin d'aide ?</strong> Contactez-nous à{" "}
                  <a
                    href="mailto:support@farm2fork.com"
                    className="text-red-700 hover:underline font-medium"
                  >
                    support@farm2fork.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ========================================
  // CAS 3 : FARMER_REQUEST APPROVED
  // ========================================
  // Sous-cas 3a : Pas de listing créé
  if (!listing) {
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

          <Card className="shadow-lg border-2 text-center border-green-200 bg-green-50/50">
            <CardHeader className="space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <CardTitle className="text-3xl text-balance text-green-900">
                ✅ Demande approuvée !
              </CardTitle>
              <CardDescription className="text-base leading-relaxed max-w-2xl mx-auto text-green-800">
                Félicitations ! Vous êtes maintenant producteur. Créez votre
                fiche ferme pour commencer à vendre vos produits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white p-6 rounded-lg border-2 border-green-200">
                <h3 className="font-semibold text-lg mb-3 text-green-900">
                  Prochaine étape : Créer votre ferme
                </h3>
                <p className="text-sm text-green-800 mb-4">
                  Complétez les informations de votre ferme (description,
                  produits, coordonnées, etc.) pour apparaître sur la carte et
                  commencer à vendre.
                </p>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  onClick={() => router.push("/dashboard")}
                >
                  Créer ma ferme →
                </Button>
              </div>

              <div className="bg-green-100 p-4 rounded-lg text-left border border-green-300">
                <p className="text-sm text-green-900">
                  <strong>Un email de confirmation</strong> a été envoyé à{" "}
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Sous-cas 3b : Listing existe - Dashboard complet
  const safeWebsite = getSafeWebsiteUrl((listing as any).website);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: COLORS.PRIMARY_DARK }}
        >
          Tableau de bord producteur
        </h1>
        <p style={{ color: COLORS.TEXT_SECONDARY }}>
          Gérez votre fiche ferme et vos informations
        </p>
      </div>

      <div
        className="rounded-lg shadow-md border overflow-hidden"
        style={{
          backgroundColor: COLORS.BG_WHITE,
          borderColor: COLORS.BORDER,
        }}
      >
        <div
          className="px-6 py-4 border-b"
          style={{
            background: `linear-gradient(to right, ${COLORS.PRIMARY_BG}, ${COLORS.BG_GRAY})`,
            borderBottomColor: COLORS.BORDER,
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2
                className="text-xl font-semibold mb-1"
                style={{ color: COLORS.PRIMARY_DARK }}
              >
                {escapeHTML((listing as any).name || "Ferme sans nom")}
              </h2>
              {(listing as any).address && (
                <div
                  className="flex items-center text-sm"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  <MapPin
                    className="h-4 w-4 mr-2"
                    style={{ color: COLORS.TEXT_MUTED }}
                  />
                  {escapeHTML((listing as any).address)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {listing.active ? (
                <div
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${COLORS.SUCCESS}20`,
                    color: COLORS.SUCCESS,
                  }}
                >
                  <CheckCircle className="h-4 w-4" />
                  Publiée
                </div>
              ) : (
                <div
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${COLORS.WARNING}20`,
                    color: COLORS.WARNING,
                  }}
                >
                  <Clock className="h-4 w-4" />
                  Brouillon
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {(listing as any).description && (
            <div className="mb-6">
              <h3
                className="font-medium mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Description
              </h3>
              <div
                className="text-sm leading-relaxed prose prose-sm max-w-none"
                style={{ color: COLORS.TEXT_SECONDARY }}
                dangerouslySetInnerHTML={{
                  __html: sanitizeHTML(
                    (listing as any).description.length > 200
                      ? `${(listing as any).description.substring(0, 200)}...`
                      : (listing as any).description
                  ),
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {Array.isArray((listing as any).product_type) &&
              (listing as any).product_type.length > 0 && (
                <div>
                  <h3
                    className="font-medium mb-2"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Types de produits
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(listing as any).product_type.map(
                      (type: string, index: number) => (
                        <span
                          key={`${type}-${index}`}
                          className="px-2 py-1 text-xs rounded-md border"
                          style={{
                            backgroundColor: `${COLORS.PRIMARY}10`,
                            color: COLORS.PRIMARY,
                            borderColor: `${COLORS.PRIMARY}30`,
                          }}
                        >
                          {escapeHTML(type)}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

            {((listing as any).email ||
              (listing as any).phoneNumber ||
              safeWebsite) && (
              <div>
                <h3
                  className="font-medium mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Contact
                </h3>
                <div
                  className="space-y-1 text-sm"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {(listing as any).email && (
                    <p>📧 {escapeHTML((listing as any).email)}</p>
                  )}
                  {(listing as any).phoneNumber && (
                    <p>📞 {escapeHTML((listing as any).phoneNumber)}</p>
                  )}

                  {safeWebsite && (
                    <p>
                      🌐{" "}
                      <a
                        href={safeWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "hover:underline transition-colors duration-200",
                          "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
                        )}
                        style={{ color: COLORS.PRIMARY }}
                      >
                        Site web
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div
            className="text-xs mb-6 space-y-1"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            {(listing as any).created_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Créée le :{" "}
                {new Date((listing as any).created_at).toLocaleDateString(
                  "fr-FR",
                  {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </div>
            )}

            {(listing as any).published_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Publiée le :{" "}
                {new Date((listing as any).published_at).toLocaleDateString(
                  "fr-FR",
                  {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </div>
            )}

            {(listing as any).modified_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Modifiée le :{" "}
                {new Date((listing as any).modified_at).toLocaleDateString(
                  "fr-FR",
                  {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </div>
            )}
          </div>

          <div
            className="flex flex-wrap gap-3 pt-4"
            style={{ borderTopColor: COLORS.BORDER, borderTopWidth: "1px" }}
          >
            <Button
              asChild
              variant="outline"
              className={cn(
                "flex items-center gap-2 border-2",
                "focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              )}
              style={{ borderColor: COLORS.PRIMARY, color: COLORS.PRIMARY }}
            >
              <Link href={`/edit-listing/${listing.id}`}>
                <Edit className="h-4 w-4" />
                Modifier la fiche
              </Link>
            </Button>

            {listing.active && (
              <Button
                asChild
                variant="outline"
                className={cn(
                  "flex items-center gap-2 border-2",
                  "focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                )}
                style={{ borderColor: COLORS.INFO, color: COLORS.INFO }}
              >
                <Link href={`/farm/${listing.id}`}>
                  <Eye className="h-4 w-4" />
                  Voir la fiche publique
                </Link>
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className={cn(
                    "flex items-center gap-2",
                    "focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  )}
                  style={{
                    backgroundColor: COLORS.ERROR,
                    color: COLORS.BG_WHITE,
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer la fiche
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle style={{ color: COLORS.ERROR }}>
                    Supprimer cette fiche ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est définitive. Tous les produits et images
                    liés à cette fiche seront également supprimés.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    style={{
                      backgroundColor: COLORS.ERROR,
                      color: COLORS.BG_WHITE,
                    }}
                  >
                    Confirmer la suppression
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Mes produits */}
      <div
        className="mt-6 rounded-lg shadow-md border overflow-hidden"
        style={{ backgroundColor: COLORS.BG_WHITE, borderColor: COLORS.BORDER }}
      >
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            background: `linear-gradient(to right, ${COLORS.PRIMARY_BG}, ${COLORS.BG_GRAY})`,
            borderBottomColor: COLORS.BORDER,
          }}
        >
          <div>
            <h2 className="text-xl font-semibold" style={{ color: COLORS.PRIMARY_DARK }}>
              Mes produits{products.length > 0 && ` (${products.length})`}
            </h2>
            <p className="text-sm mt-1" style={{ color: COLORS.TEXT_SECONDARY }}>
              Gérez votre catalogue produits
            </p>
          </div>
          <Button asChild style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.BG_WHITE }}>
            <Link href={`/add-product/${listing.id}`}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un produit
            </Link>
          </Button>
        </div>

        {productsLoading ? (
          <div className="p-6 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: COLORS.PRIMARY }} />
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <p className="mb-4" style={{ color: COLORS.TEXT_MUTED }}>
              Vous n&apos;avez pas encore de produits.
            </p>
            <Button asChild style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.BG_WHITE }}>
              <Link href={`/add-product/${listing.id}`}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter mon premier produit
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: COLORS.BORDER }}>
            {products.map((product) => (
              <li key={product.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: COLORS.TEXT_PRIMARY }}>
                    {product.name}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: COLORS.TEXT_SECONDARY }}>
                    {product.price != null
                      ? `${product.price} € / ${product.unit ?? "unité"}`
                      : "Prix non défini"}
                    {" · "}
                    <span
                      style={{
                        color:
                          product.stock_status === "in_stock"
                            ? COLORS.SUCCESS
                            : product.stock_status === "low_stock"
                            ? COLORS.WARNING
                            : COLORS.ERROR,
                      }}
                    >
                      {product.stock_status === "in_stock"
                        ? "En stock"
                        : product.stock_status === "low_stock"
                        ? "Stock faible"
                        : "Épuisé"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      product.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {product.is_published ? "Publié" : "Brouillon"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleProductToggle(product.id, product.is_published)}
                  >
                    {product.is_published ? "Dépublier" : "Publier"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        style={{ borderColor: COLORS.ERROR, color: COLORS.ERROR }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle style={{ color: COLORS.ERROR }}>
                          Supprimer ce produit ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est définitive. Le produit &quot;{product.name}&quot; sera supprimé.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleProductDelete(product.id)}
                          style={{ backgroundColor: COLORS.ERROR, color: COLORS.BG_WHITE }}
                        >
                          Confirmer la suppression
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
