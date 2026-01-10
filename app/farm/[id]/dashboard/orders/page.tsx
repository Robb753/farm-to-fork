"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Package,
  Calendar,
  User,
  MapPin,
  Truck,
  Check,
  X,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

/**
 * Interface pour une commande farmer
 */
interface FarmerOrder {
  id: number;
  user_id: string;
  farm_id: number;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    unit: string;
  }>;
  total_price: number;
  delivery_mode: "pickup" | "delivery";
  delivery_day: string;
  delivery_address?: {
    street: string;
    city: string;
    postalCode: string;
  };
  customer_notes?: string;
  status: "pending" | "confirmed" | "ready" | "delivered" | "cancelled";
  payment_status: "unpaid" | "paid" | "refunded";
  created_at: string;

  user?: {
    email: string;
  };
}

/**
 * Page Dashboard Farmer - Gestion des commandes d'une ferme spécifique
 * Route: /farm/[id]/dashboard/orders
 */
export default function FarmDashboardOrdersPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const farmId = params.id ? Number(params.id) : NaN;

  const [farmName, setFarmName] = useState("");
  const [orders, setOrders] = useState<FarmerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "confirmed" | "ready"
  >("all");

  useEffect(() => {
    if (Number.isNaN(farmId)) {
      router.push("/explore");
      return;
    }

    async function loadOrders() {
      try {
        setIsLoading(true);

        // Vérifier l'auth et le rôle
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Vous devez être connecté");
          router.push("/login");
          return;
        }

        // Vérifier que c'est bien le farmer de CETTE ferme
        const { data: listing } = await supabase
          .from("listing")
          .select("id, name, createdBy")
          .eq("id", farmId)
          .single();

        if (!listing) {
          toast.error("Ferme introuvable");
          router.push("/explore");
          return;
        }

        // Vérifier que l'utilisateur est bien le propriétaire de la ferme
        if (listing.createdBy !== user.id) {
          toast.error(
            "Accès non autorisé - Cette ferme ne vous appartient pas"
          );
          router.push("/");
          return;
        }

        setFarmName(listing.name);

        // Charger les commandes de CETTE ferme
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select(
            "id, user_id, farm_id, items, total_price, delivery_mode, delivery_day, delivery_address, customer_notes, status, payment_status, created_at"
          )
          .eq("farm_id", farmId)
          .order("created_at", { ascending: false });

        if (ordersError) {
          console.error("Error fetching orders:", ordersError);
          throw ordersError;
        }

        if (!ordersData || ordersData.length === 0) {
          setOrders([]);
          return;
        }

        // Récupérer les emails des utilisateurs depuis la table profiles
        const userIds = [...new Set(ordersData.map((order) => order.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, email")
          .in("user_id", userIds);

        // Créer un map user_id -> email pour un accès rapide
        const userEmailMap = new Map<string, string>();
        if (profiles) {
          profiles.forEach((profile) => {
            userEmailMap.set(profile.user_id, profile.email);
          });
        }

        // Mapper les données avec les emails réels
        const ordersWithUsers: FarmerOrder[] = ordersData.map((order: any) => ({
          id: order.id,
          user_id: order.user_id,
          farm_id: order.farm_id,
          items: order.items || [],
          total_price: order.total_price || 0,
          delivery_mode: order.delivery_mode,
          delivery_day: order.delivery_day || "",
          delivery_address: order.delivery_address || undefined,
          customer_notes: order.customer_notes || undefined,
          status: order.status,
          payment_status: order.payment_status,
          created_at: order.created_at,
          user: { email: userEmailMap.get(order.user_id) || order.user_id },
        }));

        setOrders(ordersWithUsers);
      } catch (error) {
        console.error("Erreur chargement commandes:", error);
        toast.error("Impossible de charger les commandes");
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, [farmId, router]);

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: `${COLORS.PRIMARY} ${COLORS.PRIMARY} ${COLORS.PRIMARY} transparent`,
            }}
          />
          <p style={{ color: COLORS.TEXT_SECONDARY }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.BG_GRAY }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link
          href={`/farm/${farmId}`}
          className="inline-flex items-center gap-2 mb-6 text-sm hover:underline"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à ma ferme
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            📦 Gestion des commandes
          </h1>
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            Commandes de <span className="font-semibold">{farmName}</span>
          </p>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2 mb-6">
          <FilterButton
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label={`Toutes (${orders.length})`}
          />
          <FilterButton
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
            label={`En attente (${orders.filter((o) => o.status === "pending").length})`}
          />
          <FilterButton
            active={filter === "confirmed"}
            onClick={() => setFilter("confirmed")}
            label={`Confirmées (${orders.filter((o) => o.status === "confirmed").length})`}
          />
          <FilterButton
            active={filter === "ready"}
            onClick={() => setFilter("ready")}
            label={`Prêtes (${orders.filter((o) => o.status === "ready").length})`}
          />
        </div>

        {/* Liste des commandes */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <Package
              className="w-20 h-20 mx-auto mb-4"
              style={{ color: COLORS.TEXT_MUTED }}
            />
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Aucune commande
            </h2>
            <p style={{ color: COLORS.TEXT_SECONDARY }}>
              {filter === "all"
                ? "Vous n'avez pas encore reçu de commande"
                : `Aucune commande ${filter}`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <FarmerOrderCard
                key={order.id}
                order={order}
                onStatusChange={() => window.location.reload()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-all",
        active ? "shadow-sm" : "hover:shadow-sm"
      )}
      style={{
        backgroundColor: active ? COLORS.PRIMARY : COLORS.BG_WHITE,
        color: active ? COLORS.BG_WHITE : COLORS.TEXT_SECONDARY,
        border: `1px solid ${active ? COLORS.PRIMARY : COLORS.BORDER}`,
      }}
    >
      {label}
    </button>
  );
}

function FarmerOrderCard({
  order,
  onStatusChange,
}: {
  order: FarmerOrder;
  onStatusChange: () => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const orderNumber = `FM2K-${String(order.id).padStart(6, "0")}`;

  const handleStatusChange = async (newStatus: FarmerOrder["status"]) => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);

      if (error) throw error;

      toast.success(
        `Commande ${newStatus === "confirmed" ? "confirmée" : newStatus === "ready" ? "marquée prête" : "mise à jour"}`
      );
      onStatusChange();
    } catch (error) {
      console.error("Erreur mise à jour statut:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="p-6 rounded-xl border"
      style={{ backgroundColor: COLORS.BG_WHITE, borderColor: COLORS.BORDER }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-4 mb-4 pb-4 border-b"
        style={{ borderColor: COLORS.BORDER }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-5 h-5" style={{ color: COLORS.PRIMARY }} />
            <h3
              className="font-bold text-lg"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {orderNumber}
            </h3>
          </div>
          <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
            Commandée le{" "}
            {new Date(order.created_at).toLocaleDateString("fr-FR")}
          </p>
        </div>

        <div className="text-right">
          <p className="font-bold text-xl" style={{ color: COLORS.PRIMARY }}>
            {order.total_price.toFixed(2)} €
          </p>
          <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>
            {order.payment_status === "paid" ? "✅ Payé" : "⏳ Non payé"}
          </p>
        </div>
      </div>

      {/* Client & Livraison */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <User
              className="w-4 h-4"
              style={{ color: COLORS.TEXT_SECONDARY }}
            />
            <p
              className="text-sm font-semibold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Client
            </p>
          </div>
          <p
            className="text-sm truncate"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            {order.user?.email}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            {order.delivery_mode === "pickup" ? (
              <MapPin
                className="w-4 h-4"
                style={{ color: COLORS.TEXT_SECONDARY }}
              />
            ) : (
              <Truck
                className="w-4 h-4"
                style={{ color: COLORS.TEXT_SECONDARY }}
              />
            )}
            <p
              className="text-sm font-semibold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {order.delivery_mode === "pickup" ? "Retrait" : "Livraison"}
            </p>
          </div>
          <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
            {new Date(order.delivery_day).toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>

      {/* Produits */}
      <div className="mb-4">
        <p
          className="text-sm font-semibold mb-2"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          Produits
        </p>
        <div className="space-y-1">
          {order.items.map((item, idx) => (
            <p
              key={idx}
              className="text-sm"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              {item.quantity}x {item.productName} ({item.price.toFixed(2)} € /{" "}
              {item.unit})
            </p>
          ))}
        </div>
      </div>

      {order.customer_notes && (
        <div
          className="mb-4 p-3 rounded-lg"
          style={{ backgroundColor: COLORS.PRIMARY_BG }}
        >
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            💬 Notes du client
          </p>
          <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
            {order.customer_notes}
          </p>
        </div>
      )}

      {/* Actions */}
      <div
        className="flex items-center gap-3 pt-4 border-t"
        style={{ borderColor: COLORS.BORDER }}
      >
        {order.status === "pending" && (
          <button
            onClick={() => handleStatusChange("confirmed")}
            disabled={isUpdating}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all disabled:opacity-50"
            style={{ backgroundColor: COLORS.SUCCESS, color: COLORS.BG_WHITE }}
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Confirmer
          </button>
        )}

        {order.status === "confirmed" && (
          <button
            onClick={() => handleStatusChange("ready")}
            disabled={isUpdating}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all disabled:opacity-50"
            style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.BG_WHITE }}
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Package className="w-4 h-4" />
            )}
            Marquer prête
          </button>
        )}

        {order.status === "ready" && (
          <button
            onClick={() => handleStatusChange("delivered")}
            disabled={isUpdating}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all disabled:opacity-50"
            style={{ backgroundColor: COLORS.SUCCESS, color: COLORS.BG_WHITE }}
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Marquer livrée
          </button>
        )}

        {order.status === "delivered" && (
          <div
            className="flex-1 text-center text-sm font-semibold"
            style={{ color: COLORS.SUCCESS }}
          >
            ✅ Livrée
          </div>
        )}

        {order.status === "cancelled" && (
          <div
            className="flex-1 text-center text-sm font-semibold"
            style={{ color: COLORS.ERROR }}
          >
            ❌ Annulée
          </div>
        )}
      </div>
    </div>
  );
}
