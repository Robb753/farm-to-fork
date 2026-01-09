// app/_components/OnboardingStatus.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  Loader2,
  Building2,
} from "@/utils/icons";
import { COLORS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Interface pour une demande producteur
 */
interface FarmerRequest {
  id: number;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  farm_name: string;
  siret: string;
  department: string;
  location: string;
  status: "pending" | "approved" | "rejected";
  description?: string;
  products?: string;
  phone?: string;
  website?: string;
  created_at: string;
  approved_by_admin_at?: string;
  admin_reason?: string;
}

/**
 * Composant d'affichage du statut de la demande producteur
 *
 * Affiche 4 états possibles :
 * 1. Aucune demande (bouton "Devenir producteur")
 * 2. Demande en attente (pending)
 * 3. Demande approuvée (approved) + bouton Step 2
 * 4. Demande rejetée (rejected) + raison
 *
 * Features:
 * - Chargement automatique du statut depuis Supabase
 * - Affichage conditionnel selon le statut
 * - Timeline visuelle de progression
 * - Actions rapides (continuer, nouvelle demande)
 * - Design moderne avec icônes et couleurs
 */
export default function OnboardingStatus() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [request, setRequest] = useState<FarmerRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge le statut de la demande producteur
   */
  useEffect(() => {
    const fetchRequest = async () => {
      if (!isLoaded || !user) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error: supabaseError } = await supabase
          .from("farmer_requests")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (supabaseError) throw supabaseError;

        setRequest(data as FarmerRequest | null);
      } catch (err) {
        console.error("Erreur chargement statut:", err);
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [user, isLoaded]);

  /**
   * Obtient l'icône selon le statut
   */
  const getStatusIcon = (status: FarmerRequest["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Clock className="h-12 w-12" style={{ color: COLORS.WARNING }} />
        );
      case "approved":
        return (
          <CheckCircle
            className="h-12 w-12"
            style={{ color: COLORS.SUCCESS }}
          />
        );
      case "rejected":
        return (
          <XCircle className="h-12 w-12" style={{ color: COLORS.ERROR }} />
        );
    }
  };

  /**
   * Obtient le titre selon le statut
   */
  const getStatusTitle = (status: FarmerRequest["status"]) => {
    switch (status) {
      case "pending":
        return "⏳ Demande en attente de validation";
      case "approved":
        return "✅ Demande approuvée !";
      case "rejected":
        return "❌ Demande refusée";
    }
  };

  /**
   * Obtient la description selon le statut
   */
  const getStatusDescription = (status: FarmerRequest["status"]) => {
    switch (status) {
      case "pending":
        return "Votre demande d'accès producteur est en cours d'examen par notre équipe. Nous vous notifierons par email dès qu'elle sera traitée.";
      case "approved":
        return "Félicitations ! Votre demande a été approuvée. Vous pouvez maintenant compléter votre profil de producteur.";
      case "rejected":
        return "Malheureusement, votre demande n'a pas pu être approuvée pour le moment.";
    }
  };

  // États de chargement
  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="h-12 w-12 animate-spin"
            style={{ color: COLORS.PRIMARY }}
          />
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            Chargement de votre statut...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Erreur : {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cas 1 : Aucune demande
  if (!request) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Building2
                className="h-16 w-16"
                style={{ color: COLORS.PRIMARY }}
              />
            </div>
            <CardTitle style={{ color: COLORS.PRIMARY_DARK }}>
              Devenir producteur
            </CardTitle>
            <CardDescription>
              Rejoignez notre communauté de producteurs locaux
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p style={{ color: COLORS.TEXT_SECONDARY }}>
                Vous n'avez pas encore soumis de demande d'accès producteur.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">
                  🌱 Avantages producteur :
                </h4>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>✓ Créez votre fiche ferme</li>
                  <li>✓ Vendez en direct aux consommateurs</li>
                  <li>✓ Apparaissez sur la carte interactive</li>
                  <li>✓ Développez votre clientèle locale</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => router.push("/onboarding/step-1")}
              className="w-full"
              style={{
                backgroundColor: COLORS.PRIMARY,
                color: COLORS.BG_WHITE,
              }}
            >
              Commencer ma demande
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Cas 2-4 : Demande existante
  return (
    <div className="p-6 space-y-6">
      {/* Card principale du statut */}
      <Card
        className={cn(
          "border-t-4",
          request.status === "pending" && "border-t-yellow-500",
          request.status === "approved" && "border-t-green-500",
          request.status === "rejected" && "border-t-red-500"
        )}
      >
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">{getStatusIcon(request.status)}</div>
          <CardTitle className="text-2xl">
            {getStatusTitle(request.status)}
          </CardTitle>
          <CardDescription>
            {getStatusDescription(request.status)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informations de la demande */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Nom de la ferme
              </p>
              <p
                className="font-semibold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {request.farm_name}
              </p>
            </div>
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Département
              </p>
              <p
                className="font-semibold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {request.department}
              </p>
            </div>
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Date de demande
              </p>
              <p
                className="font-semibold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {new Date(request.created_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            {request.approved_by_admin_at && (
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Date d'approbation
                </p>
                <p
                  className="font-semibold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {new Date(request.approved_by_admin_at).toLocaleDateString(
                    "fr-FR",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Raison du rejet */}
          {request.status === "rejected" && request.admin_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">
                Raison du refus :
              </h4>
              <p className="text-sm text-red-700">{request.admin_reason}</p>
            </div>
          )}

          {/* Timeline de progression (approved uniquement) */}
          {request.status === "approved" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-4">
                📋 Prochaines étapes :
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">
                      Demande approuvée ✅
                    </p>
                    <p className="text-sm text-green-600">
                      Votre accès producteur est activé
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                      request.description ? "bg-green-500" : "bg-gray-300"
                    )}
                  >
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">
                      Compléter votre profil {request.description && "✅"}
                    </p>
                    <p className="text-sm text-green-600">
                      Adresse, description, produits
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">
                      Activer votre fiche
                    </p>
                    <p className="text-sm text-green-600">
                      Rendre votre ferme visible sur la carte
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-3">
          {request.status === "approved" && (
            <Button
              onClick={() => router.push("/onboarding/step-2")}
              className="flex-1"
              style={{
                backgroundColor: COLORS.SUCCESS,
                color: COLORS.BG_WHITE,
              }}
            >
              Continuer l'inscription
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {request.status === "rejected" && (
            <Button
              onClick={() => router.push("/onboarding/step-1")}
              variant="outline"
              className="flex-1"
            >
              Soumettre une nouvelle demande
            </Button>
          )}

          {request.status === "pending" && (
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex-1"
            >
              Actualiser le statut
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
