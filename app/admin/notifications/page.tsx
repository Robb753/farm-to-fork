// app/admin/notifications/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, Inbox, Clock, CheckCircle, XCircle } from "@/utils/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { COLORS, PATHS, TABLES } from "@/lib/config";
import { cn } from "@/lib/utils";
import { useSupabaseWithClerk } from "@/utils/supabase/client";

/**
 * Interface pour les demandes d'accès producteur
 */
interface FarmerRequest {
  id: number;
  user_id: string;
  email: string;

  // Informations personnelles
  first_name: string;
  last_name: string;
  phone?: string;

  // Informations entreprise
  siret: string;

  // Informations ferme
  farm_name: string;
  location: string;
  description?: string;
  products?: string;
  website?: string;

  // Workflow
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at?: string;
}

/**
 * Type pour les statuts de demande
 */
type RequestStatus = FarmerRequest["status"];

/**
 * Interface pour les actions de validation
 */
interface ValidationPayload {
  requestId: number;
  userId: string;
  role: string;
  status: RequestStatus;
}

/**
 * Page d'administration des notifications et demandes producteurs
 *
 * Features:
 * - Gestion des demandes d'accès producteur
 * - Temps réel avec Supabase realtime
 * - ✅ Confirmations avant approbation/rejet
 * - Interface détaillée pour chaque demande
 * - Contrôle d'accès admin
 */
export default function AdminNotificationsPage(): JSX.Element {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const supabase = useSupabaseWithClerk(); 

  const [loading, setLoading] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<FarmerRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<FarmerRequest | null>(
    null
  );

  // ✅ NOUVEAU : États pour les confirmations
  const [confirmingAction, setConfirmingAction] = useState<{
    request: FarmerRequest;
    action: "approve" | "reject";
  } | null>(null);

  /**
   * Vérifie l'accès admin et initialise les données
   */
  useEffect(() => {
    let channel: any = null;

    const checkAccess = async (): Promise<void> => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }

      const userRole = user.publicMetadata?.role;

      if (userRole !== "admin") {
        toast.error("Cette page est réservée aux administrateurs");
        router.push(PATHS.HOME);
        return;
      }

      setIsChecking(false);
      fetchNotifications();

      // ✅ Canal temps réel pour les nouvelles demandes
      channel = supabase
        .channel("admin-notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "farmer_requests",
          },
          (payload) => {
            fetchNotifications();
            toast.info("Nouvelle demande d'accès producteur reçue !");
          }
        )
        .subscribe();
    };

    checkAccess();

    // Cleanup function
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isLoaded, isSignedIn, user, router]);

  /**
   * Récupère toutes les demandes d'accès producteur
   */
  const fetchNotifications = async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("farmer_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setNotifications((data || []) as FarmerRequest[]);
    } catch (error) {
      console.error("Erreur de chargement:", error);
      toast.error("Impossible de charger les notifications");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Affiche les détails d'une demande
   */
  const handleViewDetails = (request: FarmerRequest): void => {
    setSelectedRequest(request);
  };

  /**
   * ✅ NOUVEAU : Demande de confirmation avant action
   */
  const handleRequestAction = (
    request: FarmerRequest,
    action: "approve" | "reject"
  ): void => {
    setConfirmingAction({ request, action });
  };

  /**
   * ✅ MODIFIÉ : Action confirmée
   */
  const handleConfirmedAction = async (): Promise<void> => {
    if (!confirmingAction) return;

    const { request, action } = confirmingAction;
    const status = action === "approve" ? "approved" : "rejected";
    const role = action === "approve" ? "farmer" : "user";

    try {
      const payload: ValidationPayload = {
        requestId: request.id,
        userId: request.user_id,
        role,
        status,
      };

      const response = await fetch("/api/admin/validate-farmer-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur de validation");
      }

      toast.success(
        action === "approve"
          ? "✅ Producteur approuvé avec succès !"
          : "❌ Demande rejetée"
      );

      // Fermer les modals et rafraîchir
      setConfirmingAction(null);
      setSelectedRequest(null);
      fetchNotifications();
    } catch (err) {
      console.error("Erreur d'action:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Action impossible";
      toast.error(`Action impossible: ${errorMessage}`);
    }
  };

  /**
   * Retourne le badge approprié selon le statut
   */
  const getStatusBadge = (status: RequestStatus): JSX.Element => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-300"
          >
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-green-100 text-green-800 border-green-300"
          >
            <CheckCircle className="h-3 w-3" />
            Approuvé
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-red-100 text-red-800 border-red-300"
          >
            <XCircle className="h-3 w-3" />
            Rejeté
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700">
            Inconnu
          </Badge>
        );
    }
  };

  // ✅ Affichage pendant la vérification d'accès
  if (isChecking) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="h-12 w-12 animate-spin"
            style={{ color: COLORS.PRIMARY }}
          />
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            Vérification des accès...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card
        className={cn(
          "border-t-4 shadow-sm hover:shadow transition-shadow duration-300"
        )}
        style={{ borderTopColor: COLORS.PRIMARY }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle
              className="text-2xl font-bold"
              style={{ color: COLORS.PRIMARY_DARK }}
            >
              Centre de notifications
            </CardTitle>
            <CardDescription>
              Gérez les demandes d'accès producteur et autres notifications
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            disabled={loading}
            className={cn(
              "border-2 transition-all duration-200 hover:shadow-sm",
              "focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            )}
            style={{
              borderColor: `${COLORS.PRIMARY}40`,
              color: COLORS.PRIMARY,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY_BG;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Actualiser"
            )}
          </Button>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center my-12">
              <Loader2
                className="h-8 w-8 animate-spin"
                style={{ color: COLORS.PRIMARY }}
              />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Inbox
                className="mx-auto h-12 w-12"
                style={{ color: COLORS.TEXT_MUTED }}
              />
              <h3
                className="mt-2 text-lg font-medium"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Aucune notification
              </h3>
              <p
                className="mt-1 text-sm"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Vous n'avez pas encore reçu de demandes d'accès producteur.
              </p>
            </div>
          ) : (
            <div
              className="rounded-md border"
              style={{ borderColor: COLORS.BORDER }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Ferme</th>
                      <th className="text-left p-4 font-medium">Contact</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Statut</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((notif) => (
                      <tr key={notif.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div
                            className="font-medium"
                            style={{ color: COLORS.TEXT_PRIMARY }}
                          >
                            {notif.farm_name}
                          </div>
                          <p
                            className="text-xs truncate max-w-xs"
                            style={{ color: COLORS.TEXT_MUTED }}
                          >
                            {notif.location}
                          </p>
                        </td>
                        <td className="p-4">
                          <div style={{ color: COLORS.TEXT_SECONDARY }}>
                            {notif.email}
                          </div>
                          {notif.phone && (
                            <p
                              className="text-xs"
                              style={{ color: COLORS.TEXT_MUTED }}
                            >
                              {notif.phone}
                            </p>
                          )}
                        </td>
                        <td
                          className="p-4"
                          style={{ color: COLORS.TEXT_SECONDARY }}
                        >
                          {new Date(notif.created_at).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="p-4">{getStatusBadge(notif.status)}</td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(notif)}
                              className="text-xs"
                            >
                              Détails
                            </Button>
                            {notif.status === "pending" && (
                              <>
                                {/* ✅ Bouton Approuver avec confirmation */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRequestAction(notif, "approve")
                                  }
                                  className="text-xs text-green-600 hover:text-green-700"
                                >
                                  Approuver
                                </Button>
                                {/* ✅ Bouton Rejeter avec confirmation */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRequestAction(notif, "reject")
                                  }
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  Rejeter
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ NOUVEAU : AlertDialog de confirmation d'action */}
      <AlertDialog
        open={!!confirmingAction}
        onOpenChange={() => setConfirmingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle
              style={{
                color:
                  confirmingAction?.action === "approve"
                    ? COLORS.SUCCESS
                    : COLORS.ERROR,
              }}
            >
              {confirmingAction?.action === "approve"
                ? "✅ Approuver cette demande ?"
                : "❌ Rejeter cette demande ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmingAction?.action === "approve" ? (
                <>
                  <strong>
                    {confirmingAction.request.first_name}{" "}
                    {confirmingAction.request.last_name}
                  </strong>{" "}
                  deviendra producteur et pourra créer sa fiche ferme.
                  <br />
                  <br />
                  <strong>Ferme :</strong> {confirmingAction.request.farm_name}
                  <br />
                  <strong>SIRET :</strong> {confirmingAction.request.siret}
                  <br />
                </>
              ) : (
                <>
                  La demande de{" "}
                  <strong>
                    {confirmingAction?.request.first_name}{" "}
                    {confirmingAction?.request.last_name}
                  </strong>{" "}
                  sera rejetée.
                  <br />
                  <br />
                  L'utilisateur recevra un email l'informant du rejet.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedAction}
              style={{
                backgroundColor:
                  confirmingAction?.action === "approve"
                    ? COLORS.SUCCESS
                    : COLORS.ERROR,
                color: COLORS.BG_WHITE,
              }}
              className="hover:opacity-90"
            >
              {confirmingAction?.action === "approve"
                ? "Oui, approuver"
                : "Oui, rejeter"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ Modal de détails (existant) */}
      <AlertDialog
        open={!!selectedRequest}
        onOpenChange={() => setSelectedRequest(null)}
      >
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle
              className="text-xl"
              style={{ color: COLORS.PRIMARY_DARK }}
            >
              Détails de la demande
            </AlertDialogTitle>
            <AlertDialogDescription>
              Demande de{" "}
              <span className="font-medium">
                {selectedRequest?.first_name} {selectedRequest?.last_name}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedRequest && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3
                    className="font-medium"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Nom
                  </h3>
                  <p style={{ color: COLORS.TEXT_SECONDARY }}>
                    {selectedRequest.first_name} {selectedRequest.last_name}
                  </p>
                </div>
                <div>
                  <h3
                    className="font-medium"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Ferme
                  </h3>
                  <p style={{ color: COLORS.TEXT_SECONDARY }}>
                    {selectedRequest.farm_name}
                  </p>
                </div>
                <div>
                  <h3
                    className="font-medium"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Email
                  </h3>
                  <p style={{ color: COLORS.TEXT_SECONDARY }}>
                    {selectedRequest.email}
                  </p>
                </div>
                <div>
                  <h3
                    className="font-medium"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Téléphone
                  </h3>
                  <p style={{ color: COLORS.TEXT_SECONDARY }}>
                    {selectedRequest.phone || "Non renseigné"}
                  </p>
                </div>
                <div>
                  <h3
                    className="font-medium"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    SIRET
                  </h3>
                  <p style={{ color: COLORS.TEXT_SECONDARY }}>
                    {selectedRequest.siret}
                  </p>
                </div>
                <div>
                  <h3
                    className="font-medium"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Localisation
                  </h3>
                  <p style={{ color: COLORS.TEXT_SECONDARY }}>
                    {selectedRequest.location}
                  </p>
                </div>
                <div>
                  <h3
                    className="font-medium"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Site web
                  </h3>
                  <p>
                    {selectedRequest.website ? (
                      <a
                        href={selectedRequest.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "hover:underline transition-colors duration-200",
                          "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
                        )}
                        style={{ color: COLORS.PRIMARY }}
                      >
                        {selectedRequest.website}
                      </a>
                    ) : (
                      <span style={{ color: COLORS.TEXT_SECONDARY }}>
                        Non renseigné
                      </span>
                    )}
                  </p>
                </div>
                <div className="col-span-2">
                  <h3
                    className="font-medium"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Date de demande
                  </h3>
                  <p style={{ color: COLORS.TEXT_SECONDARY }}>
                    {new Date(selectedRequest.created_at).toLocaleDateString(
                      "fr-FR",
                      {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              </div>

              {selectedRequest.description && (
                <div>
                  <h3
                    className="font-medium"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Description
                  </h3>
                  <p
                    className="whitespace-pre-line"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {selectedRequest.description}
                  </p>
                </div>
              )}

              {selectedRequest.products && (
                <div>
                  <h3
                    className="font-medium"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Produits proposés
                  </h3>
                  <p
                    className="whitespace-pre-line"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {selectedRequest.products}
                  </p>
                </div>
              )}

              <div>
                <h3
                  className="font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Statut actuel
                </h3>
                <div className="mt-1">
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Fermer</AlertDialogCancel>
            {selectedRequest?.status === "pending" && (
              <>
                <Button
                  onClick={() => {
                    setSelectedRequest(null);
                    handleRequestAction(selectedRequest, "reject");
                  }}
                  style={{
                    backgroundColor: COLORS.ERROR,
                    color: COLORS.BG_WHITE,
                  }}
                  className="hover:opacity-90"
                >
                  Rejeter
                </Button>
                <Button
                  onClick={() => {
                    setSelectedRequest(null);
                    handleRequestAction(selectedRequest, "approve");
                  }}
                  style={{
                    backgroundColor: COLORS.SUCCESS,
                    color: COLORS.BG_WHITE,
                  }}
                  className="hover:opacity-90"
                >
                  Approuver
                </Button>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
