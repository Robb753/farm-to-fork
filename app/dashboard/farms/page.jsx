"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function FarmerDashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchListing = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }

      try {
        const email =
          user?.primaryEmailAddress?.emailAddress ||
          user?.emailAddresses?.[0]?.emailAddress;

        if (!email) {
          setError("Email non trouvé");
          setLoading(false);
          return;
        }

        console.log("Tentative de récupération des données pour:", email);

        const { data, error: supabaseError } = await supabase
          .from("listing")
          .select("*")
          .eq("createdBy", email)
          .maybeSingle();

        console.log("Résultat Supabase:", { data, error: supabaseError });

        if (supabaseError) {
          console.error("Erreur Supabase détaillée:", supabaseError);
          setError(
            `Erreur Supabase: ${supabaseError.message || "Erreur inconnue"}`
          );
        } else {
          console.log("Données récupérées avec succès:", data);
          setListing(data);
        }
      } catch (err) {
        console.error("Erreur générale:", err);
        setError("Une erreur inattendue s'est produite");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [isLoaded, isSignedIn, user, router]);

  // États de chargement et d'erreur
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Réessayer</Button>
          </div>
        </div>
      </div>
    );
  }

  // Cas 1: Aucune fiche ferme créée
  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-green-700 mb-4">
            Bienvenue sur votre espace Producteur
          </h1>
          <p className="text-gray-600 text-lg">
            Commencez par créer votre première fiche de ferme
          </p>
        </div>

        {/* Card principale */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Créer votre ferme
              </h2>
              <p className="text-gray-600 mb-2">
                Étape 1 : Ajoutez votre ferme pour commencer à vendre vos
                produits
              </p>
              <p className="text-gray-700 mb-8">
                Vous n'avez pas encore de ferme enregistrée. Créez votre fiche
                pour apparaître sur la carte et proposer vos produits.
              </p>

              {/* Placeholder image */}
              <div className="w-full h-64 bg-gray-100 rounded-lg mb-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Ajoutez votre première ferme</p>
                </div>
              </div>

              <Button
                asChild
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <Link
                  href="/add-new-listing"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Créer ma ferme
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    const confirmDelete = confirm(
      "Êtes-vous sûr de vouloir supprimer cette fiche ? Cette action est irréversible."
    );
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("listing")
      .delete()
      .eq("id", listing.id);

    if (error) {
      console.error("Erreur lors de la suppression :", error);
      toast.error("Erreur lors de la suppression.");
    } else {
      toast.success("Fiche supprimée avec succès !");
      router.push("/dashboard/farms"); // ou autre page si besoin
    }
  };

  // Cas 2: Fiche ferme existante
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-800 mb-2">
          Tableau de bord producteur
        </h1>
        <p className="text-gray-600">
          Gérez votre fiche ferme et vos informations
        </p>
      </div>

      {/* Fiche ferme */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {/* En-tête de la fiche */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-green-800 mb-1">
                {listing.name || "Ferme sans nom"}
              </h2>
              {listing.address && (
                <div className="flex items-center text-gray-600 text-sm">
                  <MapPin className="h-10 w-10 text-gray-300" />
                  {listing.address}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {listing.active ? (
                <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Publiée
                </div>
              ) : (
                <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  Brouillon
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenu de la fiche */}
        <div className="p-6">
          {/* Description */}
          {listing.description && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-800 mb-2">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {listing.description.length > 200
                  ? `${listing.description.substring(0, 200)}...`
                  : listing.description}
              </p>
            </div>
          )}

          {/* Informations complémentaires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Types de produits */}
            {listing.product_type &&
              Array.isArray(listing.product_type) &&
              listing.product_type.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">
                    Types de produits
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.product_type.map((type, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md border border-green-200"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Contact */}
            {(listing.email || listing.phoneNumber) && (
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Contact</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {listing.email && <p>📧 {listing.email}</p>}
                  {listing.phoneNumber && <p>📞 {listing.phoneNumber}</p>}
                  {listing.website && (
                    <p>
                      🌐{" "}
                      <a
                        href={listing.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline"
                      >
                        Site web
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Date de mise à jour */}
          <div className="text-xs text-gray-500 mb-6 space-y-1">
            {listing.created_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Créée le :{" "}
                {new Date(listing.created_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}

            {listing.published_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Publiée le :{" "}
                {new Date(listing.published_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}

            {listing.modified_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Modifiée le :{" "}
                {new Date(listing.modified_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button
              asChild
              variant="outline"
              className="flex items-center gap-2"
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
                className="flex items-center gap-2"
              >
                <Link href={`/view-listing/${listing.id}`}>
                  <Eye className="h-4 w-4" />
                  Voir la fiche publique
                </Link>
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 flex items-center gap-2">
                  <Trash2 className="h-4 w-4" /> Supprimer la fiche
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-600">
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
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleDelete}
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
