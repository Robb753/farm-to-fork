"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Package,
  ArrowRight,
  Calendar,
  MapPin,
  Truck,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import { toast } from "sonner";
import { useSupabaseWithClerk } from "@/utils/supabase/client";

/**
 * Interface pour une commande (UI)
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
}

/**
 * Type local "SELECT orders" pour éviter les soucis de types Supabase pas à jour
 */
type OrdersSelectRow = {
  id: number;
  farm_id: number;
  items: unknown; // jsonb
  total_price: number | string | null;
  delivery_mode: "pickup" | "delivery";
  delivery_day: string | null;
  status: "pending" | "confirmed" | "ready" | "delivered" | "cancelled";
  payment_status: "unpaid" | "paid" | "refunded" | null;
  created_at: string;
};

/**
 * Type local listing
 */
type ListingNameRow = {
  name: string | null;
};

/**
 * Page de liste des commandes d'une ferme spécifique
 * Route: /farm/[id]/orders
 */
export default function FarmOrdersPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const farmId = params.id ? Number(params.id) : NaN;

  const supabase = useSupabaseWithClerk();

  const [farmName, setFarmName] = useState<string>("");
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (Number.isNaN(farmId)) {
      router.push("/explore");
      return;
    }

    let mounted = true;

    async function loadOrders() {
      try {
        setIsLoading(true);

        // ✅ Vérifier l'auth
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          toast.error("Vous devez être connecté");
          router.push("/login");
          return;
        }

        // ✅ Charger le nom de la ferme
        const { data: farmData, error: farmError } = await supabase
          .from("listing")
          .select("name")
          .eq("id", farmId)
          .single<ListingNameRow>();

        if (farmError) throw farmError;

        if (mounted) {
          // ✅ FIX: name peut être null -> fallback
          setFarmName(farmData?.name ?? "Ma ferme");
        }

        // ✅ Charger les commandes de l'utilisateur POUR CETTE FERME
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select(
            "id, farm_id, items, total_price, delivery_mode, delivery_day, status, payment_status, created_at"
          )
          .eq("user_id", user.id)
          .eq("farm_id", farmId)
          .order("created_at", { ascending: false })
          .returns<OrdersSelectRow[]>();

        if (ordersError) throw ordersError;

        const mappedOrders: OrderListItem[] = (ordersData ?? []).map((o) => ({
          id: Number(o.id),
          farm_id: Number(o.farm_id),
          total_price: Number(o.total_price ?? 0),
          delivery_mode: o.delivery_mode,
          delivery_day: o.delivery_day ?? "",
          status: o.status,
          payment_status: (o.payment_status ??
            "unpaid") as OrderListItem["payment_status"],
          created_at: o.created_at,
          items: Array.isArray(o.items)
            ? (o.items as OrderListItem["items"])
            : [],
        }));

        if (mounted) setOrders(mappedOrders);
      } catch (error) {
        console.error("Erreur chargement commandes:", error);
        toast.error("Impossible de charger vos commandes");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadOrders();

    return () => {
      mounted = false;
    };
  }, [farmId, router, supabase]);

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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link
          href={`/farm/${farmId}`}
          className="inline-flex items-center gap-2 mb-6 text-sm hover:underline"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la ferme
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            📦 Mes commandes
          </h1>
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            Vos commandes chez <span className="font-semibold">{farmName}</span>
          </p>
        </div>

        {/* Lien vers toutes les commandes */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-lg border hover:shadow-md transition-all"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.BORDER,
            color: COLORS.TEXT_SECONDARY,
          }}
        >
          Voir toutes mes commandes (toutes fermes)
          <ArrowRight className="w-4 h-4" />
        </Link>

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
              Vous n'avez pas encore commandé chez cette ferme
            </p>
            <Link
              href={`/farm/${farmId}/shop`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium"
              style={{
                backgroundColor: COLORS.PRIMARY,
                color: COLORS.BG_WHITE,
              }}
            >
              Découvrir la boutique
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} farmId={farmId} />
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
function OrderCard({
  order,
  farmId,
}: {
  order: OrderListItem;
  farmId: number;
}): JSX.Element {
  const orderNumber = `FM2K-${String(order.id).padStart(6, "0")}`;

  const statusConfig = {
    pending: { emoji: "⏳", label: "En attente", color: COLORS.WARNING },
    confirmed: { emoji: "✅", label: "Confirmée", color: COLORS.SUCCESS },
    ready: { emoji: "📦", label: "Prête", color: COLORS.PRIMARY },
    delivered: { emoji: "🎉", label: "Livrée", color: COLORS.SUCCESS },
    cancelled: { emoji: "❌", label: "Annulée", color: COLORS.ERROR },
  } as const;

  const status = statusConfig[order.status];
  const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href={`/farm/${farmId}/orders/${order.id}`}
      className={cn(
        "block p-6 rounded-xl border transition-all duration-200",
        "hover:shadow-lg hover:border-2"
      )}
      style={{ backgroundColor: COLORS.BG_WHITE, borderColor: COLORS.BORDER }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-5 h-5" style={{ color: COLORS.PRIMARY }} />
            <h3 className="font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
              {orderNumber}
            </h3>
          </div>
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
