"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
   * Récupère la fiche ferme de l'utilisateur connecté
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
  }, [isLoaded, isSignedIn, email, router]);

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

  // ✅ État de chargement
  if (loading) {
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
            Chargement de votre espace...
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

  // ✅ Cas 1: Aucune fiche ferme créée
  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <h1
            className="text-4xl font-bold mb-4"
            style={{ color: COLORS.PRIMARY_DARK }}
          >
            Bienvenue sur votre espace Producteur
          </h1>
          <p className="text-lg" style={{ color: COLORS.TEXT_SECONDARY }}>
            Commencez par créer votre première fiche de ferme pour rejoindre
            notre communauté
          </p>
        </div>

        <div
          className="rounded-lg shadow-md border overflow-hidden"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.BORDER,
          }}
        >
          <div className="p-8">
            <div className="text-center">
              <h2
                className="text-2xl font-semibold mb-4"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Créer votre ferme
              </h2>
              <p className="mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                Étape 1 : Ajoutez votre ferme pour commencer à vendre vos
                produits
              </p>
              <p className="mb-8" style={{ color: COLORS.TEXT_SECONDARY }}>
                Vous n'avez pas encore de ferme enregistrée. Créez votre fiche
                pour apparaître sur la carte et proposer vos produits locaux.
              </p>

              <div
                className="w-full h-64 rounded-lg mb-8 flex items-center justify-center"
                style={{ backgroundColor: COLORS.BG_GRAY }}
              >
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: COLORS.BORDER }}
                  >
                    <Plus
                      className="w-8 h-8"
                      style={{ color: COLORS.TEXT_MUTED }}
                    />
                  </div>
                  <p style={{ color: COLORS.TEXT_MUTED }}>
                    Ajoutez votre première ferme
                  </p>
                </div>
              </div>

              <Button
                asChild
                size="lg"
                className={cn(
                  "font-semibold transition-all duration-200 hover:shadow-md",
                  "focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                )}
                style={{
                  backgroundColor: COLORS.PRIMARY,
                  color: COLORS.BG_WHITE,
                }}
              >
                <Link
                  href="/onboarding/step-1"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Créer ma ferme
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div
          className="mt-8 p-6 rounded-lg border"
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderColor: `${COLORS.PRIMARY}20`,
          }}
        >
          <h3 className="font-semibold mb-4" style={{ color: COLORS.PRIMARY }}>
            🌱 Pourquoi créer votre fiche ferme ?
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
      </div>
    );
  }

  const safeWebsite = getSafeWebsiteUrl((listing as any).website);

  // ✅ Cas 2: Fiche ferme existante
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
    </div>
  );
}
