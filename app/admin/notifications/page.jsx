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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/utils/supabase/client";
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

export default function AdminNotificationsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [selectRequest, setSelectRequest] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }

      const userRole = user.publicMetadata?.role;

      if (userRole !== "admin") {
        toast.error("Cette page est réservée aux administrateurs");
        router.push("/");
        return;
      }

      setIsChecking(false);
      fetchNotifications();

      // Établir un canal en temps réel pour les notifications
      const channel = supabase
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

      return () => {
        supabase.removeChannel(channel);
      };
    };

    checkAccess();
  }, [isLoaded, isSignedIn, user, router]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("farmer_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error("Erreur de chargement:", error);
      toast.error("Impossible de charger les notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectRequest(request);
  };

  const handleAction = async (requestId, userId, role, status) => {
    try {
      const res = await fetch("/api/validate-farmer-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, userId, role, status }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur de validation");
      }

      toast.success(
        status === "approved" ? "Producteur approuvé" : "Demande rejetée"
      );

      // Fermer le modal et rafraîchir les données
      setSelectRequest(null);
      fetchNotifications();
    } catch (err) {
      console.error("Erreur d'action:", err);
      toast.error("Action impossible: " + err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approuvé
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeté
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100">
            Inconnu
          </Badge>
        );
    }
  };

  // Afficher un spinner pendant la vérification
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-green-500" />
          <p className="text-gray-600">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="border-t-4 border-t-green-600 shadow-sm hover:shadow transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold text-green-700">
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
            className="text-green-600 border-green-200 hover:bg-green-50"
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
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Aucune notification
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Vous n'avez pas encore reçu de demandes d'accès producteur.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ferme</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notif) => (
                    <TableRow key={notif.id}>
                      <TableCell className="font-medium">
                        {notif.farm_name}
                        <p className="text-xs text-gray-500 truncate max-w-xs">
                          {notif.location}
                        </p>
                      </TableCell>
                      <TableCell>
                        {notif.email}
                        {notif.phone && (
                          <p className="text-xs text-gray-500">{notif.phone}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(notif.created_at).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(notif.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Menu</span>
                              {/* Trois points verticaux */}
                              <span>•••</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(notif)}
                            >
                              Voir les détails
                            </DropdownMenuItem>
                            {notif.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  className="text-green-600"
                                  onClick={() =>
                                    handleAction(
                                      notif.id,
                                      notif.user_id,
                                      "farmer",
                                      "approved"
                                    )
                                  }
                                >
                                  Approuver
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() =>
                                    handleAction(
                                      notif.id,
                                      notif.user_id,
                                      "user",
                                      "rejected"
                                    )
                                  }
                                >
                                  Rejeter
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de détails */}
      <AlertDialog
        open={!!selectRequest}
        onOpenChange={() => setSelectRequest(null)}
      >
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-green-700">
              Détails de la demande
            </AlertDialogTitle>
            <AlertDialogDescription>
              Demande de{" "}
              <span className="font-medium">{selectRequest?.farm_name}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectRequest && (
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Nom de la ferme</h3>
                  <p>{selectRequest.farm_name}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Localisation</h3>
                  <p>{selectRequest.location}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Email</h3>
                  <p>{selectRequest.email}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Téléphone</h3>
                  <p>{selectRequest.phone || "Non renseigné"}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Site web</h3>
                  <p>
                    {selectRequest.website ? (
                      <a
                        href={selectRequest.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {selectRequest.website}
                      </a>
                    ) : (
                      "Non renseigné"
                    )}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Date de demande</h3>
                  <p>
                    {new Date(selectRequest.created_at).toLocaleDateString(
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

              <div className="col-span-2">
                <h3 className="font-medium text-gray-900">Description</h3>
                <p className="whitespace-pre-line">
                  {selectRequest.description}
                </p>
              </div>

              {selectRequest.products && (
                <div className="col-span-2">
                  <h3 className="font-medium text-gray-900">
                    Produits proposés
                  </h3>
                  <p className="whitespace-pre-line">
                    {selectRequest.products}
                  </p>
                </div>
              )}

              <div className="col-span-2">
                <h3 className="font-medium text-gray-900">Statut actuel</h3>
                <div className="mt-1">
                  {getStatusBadge(selectRequest.status)}
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Fermer</AlertDialogCancel>
            {selectRequest?.status === "pending" && (
              <>
                <AlertDialogAction
                  onClick={() =>
                    handleAction(
                      selectRequest.id,
                      selectRequest.user_id,
                      "user",
                      "rejected"
                    )
                  }
                  className="bg-red-600 hover:bg-red-700"
                >
                  Rejeter
                </AlertDialogAction>
                <AlertDialogAction
                  onClick={() =>
                    handleAction(
                      selectRequest.id,
                      selectRequest.user_id,
                      "farmer",
                      "approved"
                    )
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approuver
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
