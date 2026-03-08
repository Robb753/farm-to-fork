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

type ClaimStatus = "pending" | "approved" | "rejected";

interface ClaimRequest {
  id: number;
  listing_id: number;
  user_id: string;
  user_email: string;
  user_name: string | null;
  message: string | null;
  status: ClaimStatus;
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

function statusBadgeVariant(status: ClaimStatus) {
  if (status === "pending") return "warning" as const;
  if (status === "approved") return "success" as const;
  return "error" as const;
}

function statusLabel(status: ClaimStatus) {
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminClaimsPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});

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

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/claims?status=${filter}`);
      const json = await res.json();
      if (json.success) {
        setClaims(json.claims);
      } else {
        toast.error("Impossible de charger les demandes");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isLoaded && user?.publicMetadata?.role === "admin") {
      void fetchClaims();
    }
  }, [fetchClaims, isLoaded, user]);

  const handleAction = async (claimId: number, action: "approve" | "reject") => {
    setActioningId(claimId);
    try {
      const res = await fetch(`/api/admin/claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          admin_note: adminNotes[claimId]?.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message);
        setClaims((prev) => prev.filter((c) => c.id !== claimId));
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
            Demandes de revendication
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les demandes de revendication de fermes OSM.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchClaims} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s === "pending" && <Clock className="h-3.5 w-3.5 mr-1.5" />}
            {s === "approved" && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
            {s === "rejected" && <XCircle className="h-3.5 w-3.5 mr-1.5" />}
            {s === "pending" ? "En attente" : s === "approved" ? "Approuvées" : s === "rejected" ? "Rejetées" : "Toutes"}
          </Button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : claims.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Aucune demande{filter !== "all" ? ` ${statusLabel(filter as ClaimStatus).toLowerCase()}` : ""}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <Card key={claim.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-base">
                      {claim.listing?.name ?? "Ferme sans nom"}
                    </CardTitle>
                    {claim.listing?.address && (
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        {claim.listing.address}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={statusBadgeVariant(claim.status)} size="sm">
                    {statusLabel(claim.status)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">Demandeur : </span>
                    {claim.user_name ?? "—"} ({claim.user_email})
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Soumis le : </span>
                    {formatDate(claim.created_at)}
                  </div>
                  {claim.listing?.osm_id && (
                    <div>
                      <span className="font-medium text-foreground">OSM ID : </span>
                      {claim.listing.osm_id}
                    </div>
                  )}
                  {claim.reviewed_at && (
                    <div>
                      <span className="font-medium text-foreground">Traité le : </span>
                      {formatDate(claim.reviewed_at)}
                    </div>
                  )}
                </div>

                {claim.message && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="font-medium text-foreground mb-1">Message du demandeur :</p>
                    <p className="text-muted-foreground">{claim.message}</p>
                  </div>
                )}

                {claim.admin_note && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="font-medium text-foreground mb-1">Note admin :</p>
                    <p className="text-muted-foreground">{claim.admin_note}</p>
                  </div>
                )}

                {/* Note admin (uniquement pour demandes en attente) */}
                {claim.status === "pending" && (
                  <div>
                    <label
                      htmlFor={`note-${claim.id}`}
                      className="text-xs font-medium text-muted-foreground block mb-1"
                    >
                      Note admin (optionnel)
                    </label>
                    <textarea
                      id={`note-${claim.id}`}
                      rows={2}
                      value={adminNotes[claim.id] ?? ""}
                      onChange={(e) =>
                        setAdminNotes((prev) => ({ ...prev, [claim.id]: e.target.value }))
                      }
                      placeholder="Raison du refus, remarques..."
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </div>
                )}
              </CardContent>

              {claim.status === "pending" && (
                <CardFooter className="gap-3 pt-0">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={actioningId === claim.id}
                    onClick={() => handleAction(claim.id, "approve")}
                  >
                    {actioningId === claim.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={actioningId === claim.id}
                    onClick={() => handleAction(claim.id, "reject")}
                  >
                    {actioningId === claim.id ? (
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
