"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useSupabaseWithClerk } from "@/utils/supabase/client";

/**
 * Interface pour une commande
 */
interface Order {
  id: number;
  order_number: string;
  user_id: string;
  user_name?: string;
  delivery_mode: "pickup" | "delivery";
  delivery_day?: string;
  total_price: number;
  status: "pending" | "confirmed" | "ready" | "delivered" | "cancelled";
  items: Array<{
    product_name: string;
    quantity: number;
    unit: string;
  }>;
  created_at: string;
}

/**
 * Dashboard Ferme - Étape 7
 *
 * Features:
 * - Liste des commandes à préparer
 * - Actions : Accepter, Refuser, Marquer comme prête, Remise effectuée
 * - Design simple comme Leclerc/Carrefour
 */
export default function FarmerOrdersPage(): JSX.Element {
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [farmId, setFarmId] = useState<number | null>(null);

  const supabase = useSupabaseWithClerk();

  // Charger l'ID de la ferme de l'utilisateur
  useEffect(() => {
    async function loadFarmId() {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("listing")
          .select("id")
          .eq("createdBy", user.id)
          .single();

        if (error) throw error;
        setFarmId(data.id);
      } catch (error) {
        console.error("Erreur chargement ferme:", error);
      }
    }

    loadFarmId();
  }, [user?.id]);

  // Charger les commandes
  useEffect(() => {
    async function loadOrders() {
      if (!farmId) return;

      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("farm_id", farmId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const transformedOrders: Order[] = (data || []).map((order: any) => ({
          ...order,
          order_number: `FDP-${String(order.id).padStart(4, "0")}`,
          user_name: order.user_name || "Client",
        }));

        setOrders(transformedOrders);
      } catch (error) {
        console.error("Erreur chargement commandes:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (farmId) {
      loadOrders();
    }
  }, [farmId]);

  // Actions sur les commandes
  const handleAccept = async (orderId: number) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "confirmed" } : order
        )
      );

      toast.success("Commande acceptée");
    } catch (error) {
      console.error("Erreur acceptation commande:", error);
      toast.error("Erreur lors de l'acceptation");
    }
  };

  const handleReject = async (orderId: number) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "cancelled" } : order
        )
      );

      toast.success("Commande refusée");
    } catch (error) {
      console.error("Erreur refus commande:", error);
      toast.error("Erreur lors du refus");
    }
  };

  const handleMarkReady = async (orderId: number) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "ready" })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "ready" } : order
        )
      );

      toast.success("Commande marquée comme prête");
    } catch (error) {
      console.error("Erreur marquage prête:", error);
      toast.error("Erreur lors du marquage");
    }
  };

  const handleMarkDelivered = async (orderId: number) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "delivered" })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "delivered" } : order
        )
      );

      toast.success("Remise effectuée");
    } catch (error) {
      console.error("Erreur marquage livrée:", error);
      toast.error("Erreur lors du marquage");
    }
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.BG_GRAY }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: `${COLORS.PRIMARY} ${COLORS.PRIMARY} ${COLORS.PRIMARY} transparent`
            }}
          />
          <p style={{ color: COLORS.TEXT_SECONDARY }}>Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  // Séparer les commandes par statut
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const completedOrders = orders.filter(
    (o) => o.status === "delivered" || o.status === "cancelled"
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.BG_GRAY }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
            📦 Commandes à préparer
          </h1>
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            Gérez vos commandes en toute simplicité
          </p>
        </div>

        {/* État vide */}
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-20 h-20 mx-auto mb-4" style={{ color: COLORS.TEXT_MUTED }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
              Aucune commande
            </h2>
            <p style={{ color: COLORS.TEXT_SECONDARY }}>
              Vous n'avez pas encore reçu de commande
            </p>
          </div>
        ) : (
          <>
            {/* Nouvelles commandes */}
            {pendingOrders.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.TEXT_PRIMARY }}>
                  🆕 Nouvelles commandes ({pendingOrders.length})
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {pendingOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      onMarkReady={handleMarkReady}
                      onMarkDelivered={handleMarkDelivered}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Commandes confirmées */}
            {confirmedOrders.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.TEXT_PRIMARY }}>
                  ✅ En préparation ({confirmedOrders.length})
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {confirmedOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      onMarkReady={handleMarkReady}
                      onMarkDelivered={handleMarkDelivered}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Commandes prêtes */}
            {readyOrders.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.TEXT_PRIMARY }}>
                  📦 Prêtes ({readyOrders.length})
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {readyOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      onMarkReady={handleMarkReady}
                      onMarkDelivered={handleMarkDelivered}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Commandes terminées */}
            {completedOrders.length > 0 && (
              <details className="mb-8">
                <summary
                  className="text-lg font-semibold cursor-pointer mb-4"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Historique ({completedOrders.length})
                </summary>
                <div className="grid grid-cols-1 gap-4">
                  {completedOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      onMarkReady={handleMarkReady}
                      onMarkDelivered={handleMarkDelivered}
                    />
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Carte de commande
 */
function OrderCard({
  order,
  onAccept,
  onReject,
  onMarkReady,
  onMarkDelivered,
}: {
  order: Order;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  onMarkReady: (id: number) => void;
  onMarkDelivered: (id: number) => void;
}): JSX.Element {
  const statusColors = {
    pending: COLORS.WARNING,
    confirmed: COLORS.INFO,
    ready: COLORS.SUCCESS,
    delivered: COLORS.TEXT_MUTED,
    cancelled: COLORS.ERROR,
  };

  const statusLabels = {
    pending: "À préparer",
    confirmed: "En préparation",
    ready: "Prête",
    delivered: "Livrée",
    cancelled: "Annulée",
  };

  const statusIcons = {
    pending: "🟡",
    confirmed: "🔵",
    ready: "🟢",
    delivered: "✅",
    cancelled: "❌",
  };

  return (
    <div
      className="p-6 rounded-xl border"
      style={{
        backgroundColor: COLORS.BG_WHITE,
        borderColor: COLORS.BORDER,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-lg" style={{ color: COLORS.TEXT_PRIMARY }}>
              #{order.order_number}
            </h3>
            <span
              className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
              style={{
                backgroundColor: `${statusColors[order.status]}20`,
                color: statusColors[order.status],
              }}
            >
              {statusIcons[order.status]} {statusLabels[order.status]}
            </span>
          </div>

          <p className="text-sm mb-1" style={{ color: COLORS.TEXT_SECONDARY }}>
            {order.user_name || "Client"} • {order.delivery_mode === "delivery" ? "Livraison" : "Retrait"}{" "}
            {order.delivery_day || ""}
          </p>

          <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
            Commandé le {new Date(order.created_at).toLocaleDateString("fr-FR")}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
            {order.items.length} article{order.items.length > 1 ? "s" : ""}
          </p>
          <p className="font-bold text-xl" style={{ color: COLORS.PRIMARY }}>
            {order.total_price.toFixed(2)} €
          </p>
        </div>
      </div>

      {/* Liste des produits */}
      <div
        className="p-3 rounded-lg mb-4"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        {order.items.map((item, index) => (
          <div key={index} className="text-sm mb-1 last:mb-0">
            <span style={{ color: COLORS.TEXT_PRIMARY }}>
              • {item.quantity} {item.unit} {item.product_name}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {order.status === "pending" && (
          <>
            <button
              onClick={() => onAccept(order.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm",
                "transition-all duration-200 hover:shadow-md"
              )}
              style={{
                backgroundColor: COLORS.SUCCESS,
                color: COLORS.BG_WHITE,
              }}
            >
              <Check className="w-4 h-4" />
              Accepter
            </button>

            <button
              onClick={() => onReject(order.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm border",
                "transition-all duration-200 hover:shadow-md"
              )}
              style={{
                borderColor: COLORS.ERROR,
                color: COLORS.ERROR,
                backgroundColor: "transparent",
              }}
            >
              <X className="w-4 h-4" />
              Refuser
            </button>
          </>
        )}

        {order.status === "confirmed" && (
          <button
            onClick={() => onMarkReady(order.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm",
              "transition-all duration-200 hover:shadow-md"
            )}
            style={{
              backgroundColor: COLORS.SUCCESS,
              color: COLORS.BG_WHITE,
            }}
          >
            <Check className="w-4 h-4" />
            Marquer comme prête
          </button>
        )}

        {order.status === "ready" && (
          <button
            onClick={() => onMarkDelivered(order.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm",
              "transition-all duration-200 hover:shadow-md"
            )}
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
          >
            <Check className="w-4 h-4" />
            Remise effectuée
          </button>
        )}
      </div>
    </div>
  );
}
