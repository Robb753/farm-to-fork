"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ArrowRight, Calendar, MapPin, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

/**
 * Interface pour une commande dans la liste
 */
interface OrderListItem {
  id: number;
  farm_id: number;
  total_price: number;
  delivery_mode: "pickup" | "delivery";
  delivery_day: string;
  status: "pending" | "confirmed" | "ready" | "delivered" | "cancelled";
  payment_status: "unpaid" | "paid" | "refunded";
  created_at: string;
  items: Array<{
    productName: string;
    quantity: number;
  }>;

  farm?: {
    name: string;
  };
}

/**
 * Page de liste des commandes utilisateur (TOUTES FERMES)
 * Route: /orders
 */
export default function MyOrdersPage(): JSX.Element {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        setIsLoading(true);

        // Vérifier l'auth
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Vous devez être connecté");
          router.push("/login");
          return;
        }

        // Charger TOUTES les commandes de l'utilisateur (toutes fermes)
        const response = await supabase
          .from("orders")
          .select(
            "id, user_id, farm_id, items, total_price, delivery_mode, delivery_day, status, payment_status, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        // ✅ Cast as any pour éviter les erreurs de types Supabase
        const ordersData = response.data as any;
        const ordersError = response.error;

        if (ordersError) throw ordersError;

        if (!ordersData || ordersData.length === 0) {
          setOrders([]);
          return;
        }

        // Charger les infos des fermes
        const farmIds = Array.from(
          new Set(ordersData.map((o: any) => Number(o.farm_id)))
        );
        const { data: farmsData } = await supabase
          .from("listing")
          .select("id, name")
          .in("id", farmIds as number[]);

        const farmsMap = new Map(farmsData?.map((f) => [f.id, f]) || []);

        // Mapper avec type safety
        const mappedOrders: OrderListItem[] = ordersData.map((order: any) => ({
          id: order.id,
          farm_id: order.farm_id,
          total_price: order.total_price || 0,
          delivery_mode: order.delivery_mode,
          delivery_day: order.delivery_day || "",
          status: order.status,
          payment_status: order.payment_status,
          created_at: order.created_at,
          items: order.items || [],
          farm: farmsMap.get(order.farm_id),
        }));

        setOrders(mappedOrders);
      } catch (error) {
        console.error("Erreur chargement commandes:", error);
        toast.error("Impossible de charger vos commandes");
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, [router]);

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
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            Chargement de vos commandes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.BG_GRAY }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            📦 Toutes mes commandes
          </h1>
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            Retrouvez toutes vos commandes, toutes fermes confondues
          </p>
        </div>

        {/* Liste des commandes */}
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package
              className="w-20 h-20 mx-auto mb-4"
              style={{ color: COLORS.TEXT_MUTED }}
            />
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Aucune commande
            </h2>
            <p className="mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
              Vous n'avez pas encore passé de commande
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium"
              style={{
                backgroundColor: COLORS.PRIMARY,
                color: COLORS.BG_WHITE,
              }}
            >
              Découvrir les fermes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Carte de commande
 */
function OrderCard({ order }: { order: OrderListItem }): JSX.Element {
  const orderNumber = `FM2K-${String(order.id).padStart(6, "0")}`;

  const statusConfig = {
    pending: { emoji: "⏳", label: "En attente", color: COLORS.WARNING },
    confirmed: { emoji: "✅", label: "Confirmée", color: COLORS.SUCCESS },
    ready: { emoji: "📦", label: "Prête", color: COLORS.PRIMARY },
    delivered: { emoji: "🎉", label: "Livrée", color: COLORS.SUCCESS },
    cancelled: { emoji: "❌", label: "Annulée", color: COLORS.ERROR },
  };

  const status = statusConfig[order.status];
  const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href={`/farm/${order.farm_id}/orders/${order.id}`}
      className={cn(
        "block p-6 rounded-xl border transition-all duration-200",
        "hover:shadow-lg hover:border-2"
      )}
      style={{ backgroundColor: COLORS.BG_WHITE, borderColor: COLORS.BORDER }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-5 h-5" style={{ color: COLORS.PRIMARY }} />
            <h3 className="font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
              {orderNumber}
            </h3>
          </div>
          {/* ✅ Afficher le nom de la ferme */}
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: COLORS.PRIMARY }}
          >
            🧑‍🌾 {order.farm?.name || "Ferme"}
          </p>
          <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
            Commandée le{" "}
            {new Date(order.created_at).toLocaleDateString("fr-FR")}
          </p>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <span>{status.emoji}</span>
            <span
              className="font-semibold text-sm"
              style={{ color: status.color }}
            >
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Détails */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
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
          <span className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
            {order.delivery_mode === "pickup" ? "Retrait" : "Livraison"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar
            className="w-4 h-4"
            style={{ color: COLORS.TEXT_SECONDARY }}
          />
          <span className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
            {new Date(order.delivery_day).toLocaleDateString("fr-FR")}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-4 border-t"
        style={{ borderColor: COLORS.BORDER }}
      >
        <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
          {itemsCount} article{itemsCount > 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-3">
          <p className="font-bold text-lg" style={{ color: COLORS.PRIMARY }}>
            {order.total_price.toFixed(2)} €
          </p>
          <ArrowRight
            className="w-5 h-5"
            style={{ color: COLORS.TEXT_SECONDARY }}
          />
        </div>
      </div>
    </Link>
  );
}
