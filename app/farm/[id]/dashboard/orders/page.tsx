"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  User,
  MapPin,
  Truck,
  Check,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import { useSupabaseWithClerk } from "@/utils/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Row minimal pour listing
 */
type ListingSelectRow = {
  id: number;
  name: string | null;
  clerk_user_id: string | null;
};

/**
 * ✅ Row “SELECT” orders typée localement (indépendant de Database types)
 * -> évite le TS error si tes types Supabase sont en retard
 */
type OrdersSelectRow = {
  id: number;
  user_id: string; // (si tu as gardé uuid côté DB, mets string quand même côté UI)
  farm_id: number;
  items: unknown; // jsonb
  total_price: number | string | null;
  delivery_mode: "pickup" | "delivery";
  delivery_day: string | null;
  delivery_address: unknown | null; // jsonb
  customer_notes: string | null;
  status: "pending" | "confirmed" | "ready" | "delivered" | "cancelled";
  payment_status: "unpaid" | "paid" | "refunded" | null;
  created_at: string;
};

/**
 * Profile minimal
 */
type ProfileSelectRow = {
  user_id: string | null;
  email: string | null;
};

/**
 * Interface UI finale
 */
interface FarmerOrderUI {
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
    additionalInfo?: string;
    country?: string;
  };
  customer_notes?: string;
  status: "pending" | "confirmed" | "ready" | "delivered" | "cancelled";
  payment_status: "unpaid" | "paid" | "refunded";
  created_at: string;
  user?: { email: string };
}

export default function FarmDashboardOrdersPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const farmId = params.id ? Number(params.id) : NaN;

  const supabase = useSupabaseWithClerk();

  const [farmName, setFarmName] = useState<string>("");
  const [orders, setOrders] = useState<FarmerOrderUI[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "confirmed" | "ready"
  >("all");

  useEffect(() => {
    if (Number.isNaN(farmId)) {
      router.push("/explore");
      return;
    }

    let mounted = true;

    async function loadOrders() {
      try {
        setIsLoading(true);

        // ✅ charge listing
        const { data: listing, error: listingError } = await supabase
          .from("listing")
          .select("id, name, clerk_user_id")
          .eq("id", farmId)
          .single<ListingSelectRow>();

        if (listingError || !listing) {
          toast.error("Ferme introuvable");
          router.push("/explore");
          return;
        }

        if (!mounted) return;

        // ✅ name peut être null
        setFarmName(listing.name ?? "Ma ferme");

        // ✅ charge orders (delivery_address inclus)
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select(
            "id, user_id, farm_id, items, total_price, delivery_mode, delivery_day, delivery_address, customer_notes, status, payment_status, created_at"
          )
          .eq("farm_id", farmId)
          .order("created_at", { ascending: false })
          .returns<OrdersSelectRow[]>();

        if (ordersError) throw ordersError;

        if (!ordersData || ordersData.length === 0) {
          setOrders([]);
          return;
        }

        // ✅ récupérer emails depuis profiles
        const userIds = [...new Set(ordersData.map((o) => String(o.user_id)))];

        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, email")
          .in("user_id", userIds)
          .returns<ProfileSelectRow[]>();

        const emailMap = new Map<string, string>();
        (profiles ?? []).forEach((p) => {
          if (p.user_id && p.email) emailMap.set(p.user_id, p.email);
        });

        // ✅ normalisation
        const normalized: FarmerOrderUI[] = ordersData.map((o) => {
          const deliveryAddr =
            o.delivery_address && typeof o.delivery_address === "object"
              ? (o.delivery_address as FarmerOrderUI["delivery_address"])
              : undefined;

          const items = Array.isArray(o.items)
            ? (o.items as FarmerOrderUI["items"])
            : [];

          return {
            id: Number(o.id),
            user_id: String(o.user_id),
            farm_id: Number(o.farm_id),
            items,
            total_price: Number(o.total_price ?? 0),
            delivery_mode: o.delivery_mode,
            delivery_day: o.delivery_day ?? "",
            delivery_address: deliveryAddr,
            customer_notes: o.customer_notes ?? undefined,
            status: o.status,
            payment_status: (o.payment_status ??
              "unpaid") as FarmerOrderUI["payment_status"],
            created_at: o.created_at,
            user: {
              email: emailMap.get(String(o.user_id)) || String(o.user_id),
            },
          };
        });

        setOrders(normalized);
      } catch (err) {
        console.error("Erreur chargement commandes:", err);
        toast.error("Impossible de charger les commandes");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadOrders();

    return () => {
      mounted = false;
    };
  }, [farmId, router, supabase]);

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
        <Link
          href={`/farm/${farmId}`}
          className="inline-flex items-center gap-2 mb-6 text-sm hover:underline"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à ma ferme
        </Link>

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
                supabase={supabase}
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
  supabase,
  onStatusChange,
}: {
  order: FarmerOrderUI;
  supabase: SupabaseClient<Database>;
  onStatusChange: () => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const orderNumber = `FM2K-${String(order.id).padStart(6, "0")}`;

  const handleStatusChange = async (newStatus: FarmerOrderUI["status"]) => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);

      if (error) throw error;

      toast.success(
        `Commande ${
          newStatus === "confirmed"
            ? "confirmée"
            : newStatus === "ready"
              ? "marquée prête"
              : "mise à jour"
        }`
      );

      onStatusChange();
    } catch (err) {
      console.error("Erreur mise à jour statut:", err);
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
