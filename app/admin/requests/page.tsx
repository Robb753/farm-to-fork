"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Loader2,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Building2,
  TreePine,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestStatus = "pending" | "approved" | "rejected";
type RequestType = "create" | "claim";
type StatusFilter = RequestStatus | "all";
type TypeFilter = RequestType | "all";

interface ProducerRequest {
  id: string;
  type: RequestType;
  user_id: string;
  user_email: string;
  user_name: string | null;
  farm_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  siret: string | null;
  location: string | null;
  listing_id: number | null;
  status: RequestStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  listing: {
    id: number;
    name: string | null;
    address: string | null;
    osm_id: number | null;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadgeVariant(status: RequestStatus) {
  if (status === "pending") return "warning" as const;
  if (status === "approved") return "success" as const;
  return "error" as const;
}

function statusLabel(status: RequestStatus) {
  if (status === "pending") return "En attente";
  if (status === "approved") return "Approuvée";
  return "Rejetée";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function farmLabel(req: ProducerRequest): string {
  if (req.type === "create") return req.farm_name ?? "Ferme sans nom";
  return req.listing?.name ?? "Ferme OSM sans nom";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminRequestsPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [requests, setRequests] = useState<ProducerRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  // Guard admin
  useEffect(() => {
    if (!isLoaded) return;
    const role = user?.publicMetadata?.role as string | undefined;
    if (!user) {
      router.replace("/sign-in");
      return;
    }
    if (role !== "admin") {
      toast.error("Accès refusé");
      router.replace("/");
    }
  }, [isLoaded, user, router]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter, type: typeFilter });
      const res = await fetch(`/api/admin/producer-requests?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setRequests(json.requests);
      } else {
        toast.error("Impossible de charger les demandes");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.role === "admin") {
      void fetchRequests();
    }
  }, [fetchRequests, isLoaded, user]);

  const handleAction = async (
    requestId: string,
    status: "approved" | "rejected"
  ) => {
    setActioningId(requestId);
    try {
      const res = await fetch(`/api/admin/producer-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNote: adminNotes[requestId]?.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        toast.error(json.message ?? "Une erreur est survenue");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setActioningId(null);
    }
  };

  if (!isLoaded || (isLoaded && user?.publicMetadata?.role !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Demandes producteur
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les demandes de création et de revendication de fermes.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRequests}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s === "pending" && <Clock className="h-3.5 w-3.5 mr-1.5" />}
            {s === "approved" && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
            {s === "rejected" && <XCircle className="h-3.5 w-3.5 mr-1.5" />}
            {s === "pending"
              ? "En attente"
              : s === "approved"
              ? "Approuvées"
              : s === "rejected"
              ? "Rejetées"
              : "Toutes"}
          </Button>
        ))}
      </div>

      {/* Type filters */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "create", "claim"] as const).map((t) => (
          <Button
            key={t}
            variant={typeFilter === t ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setTypeFilter(t)}
          >
            {t === "create" && <Building2 className="h-3.5 w-3.5 mr-1.5" />}
            {t === "claim" && <TreePine className="h-3.5 w-3.5 mr-1.5" />}
            {t === "all"
              ? "Tous types"
              : t === "create"
              ? "Nouvelle ferme"
              : "Réclamation"}
          </Button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Aucune demande
            {statusFilter !== "all"
              ? ` ${statusLabel(statusFilter as RequestStatus).toLowerCase()}`
              : ""}
            .
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={req.type === "create" ? "outline" : "secondary"}
                        size="sm"
                      >
                        {req.type === "create" ? (
                          <>
                            <Building2 className="h-3 w-3 mr-1" />
                            Nouvelle ferme
                          </>
                        ) : (
                          <>
                            <TreePine className="h-3 w-3 mr-1" />
                            Réclamation
                          </>
                        )}
                      </Badge>
                      <Badge variant={statusBadgeVariant(req.status)} size="sm">
                        {statusLabel(req.status)}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{farmLabel(req)}</CardTitle>
                    {req.type === "claim" && req.listing?.address && (
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        {req.listing.address}
                      </CardDescription>
                    )}
                    {req.type === "create" && req.location && (
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        {req.location}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">
                      Demandeur :{" "}
                    </span>
                    {req.user_name ?? "—"} ({req.user_email})
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      Soumis le :{" "}
                    </span>
                    {formatDate(req.created_at)}
                  </div>
                  {req.type === "create" && req.siret && (
                    <div>
                      <span className="font-medium text-foreground">
                        SIRET :{" "}
                      </span>
                      {req.siret}
                    </div>
                  )}
                  {req.type === "create" && req.phone && (
                    <div>
                      <span className="font-medium text-foreground">
                        Téléphone :{" "}
                      </span>
                      {req.phone}
                    </div>
                  )}
                  {req.type === "claim" && req.listing?.osm_id && (
                    <div>
                      <span className="font-medium text-foreground">
                        OSM ID :{" "}
                      </span>
                      {req.listing.osm_id}
                    </div>
                  )}
                  {req.reviewed_at && (
                    <div>
                      <span className="font-medium text-foreground">
                        Traité le :{" "}
                      </span>
                      {formatDate(req.reviewed_at)}
                    </div>
                  )}
                </div>

                {req.admin_note && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="font-medium text-foreground mb-1">
                      Note admin :
                    </p>
                    <p className="text-muted-foreground">{req.admin_note}</p>
                  </div>
                )}

                {req.status === "pending" && (
                  <div>
                    <label
                      htmlFor={`note-${req.id}`}
                      className="text-xs font-medium text-muted-foreground block mb-1"
                    >
                      Note admin (optionnel)
                    </label>
                    <textarea
                      id={`note-${req.id}`}
                      rows={2}
                      value={adminNotes[req.id] ?? ""}
                      onChange={(e) =>
                        setAdminNotes((prev) => ({
                          ...prev,
                          [req.id]: e.target.value,
                        }))
                      }
                      placeholder="Raison du refus, remarques..."
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                )}
              </CardContent>

              {req.status === "pending" && (
                <CardFooter className="gap-3 pt-0">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={actioningId === req.id}
                    onClick={() => handleAction(req.id, "approved")}
                  >
                    {actioningId === req.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={actioningId === req.id}
                    onClick={() => handleAction(req.id, "rejected")}
                  >
                    {actioningId === req.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Rejeter
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
