"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Package, Truck, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import { supabase } from "@/utils/supabase/client";
import type { Database, Json } from "@/lib/types/database";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type ListingRow = Database["public"]["Tables"]["listing"]["Row"];

type ItemsJson = Array<{
  product_name: string;
  quantity: number;
  unit: string;
}>;

interface OrderUI {
  id: number;
  order_number: string;

  farm_id: number;
  farm_name: string;
  farm_address: string | null;
  farm_phone: string | null;

  delivery_mode: "pickup" | "delivery";
  delivery_day: string | null;

  total_price: number;
  status: "pending" | "confirmed" | "ready" | "delivered" | "cancelled";

  status_label: string;
  status_icon: string;

  items: ItemsJson;
  created_at: string;
}

const statusMap: Record<OrderUI["status"], { label: string; icon: string }> = {
  pending: { label: "En préparation", icon: "🟡" },
  confirmed: { label: "Confirmée", icon: "🟢" },
  ready: { label: "Prête", icon: "✅" },
  delivered: { label: "Livrée", icon: "📦" },
  cancelled: { label: "Annulée", icon: "❌" },
};

export default function MyOrderPage(): JSX.Element {
  const params = useParams();
  const orderIdParam = params.id as string | undefined;
  const orderId = orderIdParam ? Number(orderIdParam) : NaN;

  const [order, setOrder] = useState<OrderUI | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la commande (full)
  useEffect(() => {
    async function loadOrder() {
      if (!Number.isFinite(orderId)) {
        setIsLoading(false);
        setOrder(null);
        return;
      }

      try {
        setIsLoading(true);

        // 1) Commande (sans embed)
        const { data: orderRow, error: orderError } = await supabase
          .from("orders")
          .select<
            string,
            Pick<
              OrderRow,
              | "id"
              | "farm_id"
              | "delivery_mode"
              | "delivery_day"
              | "total_price"
              | "status"
              | "items"
              | "created_at"
            >
          >(
            `
            id,
            farm_id,
            delivery_mode,
            delivery_day,
            total_price,
            status,
            items,
            created_at
          `
          )
          .eq("id", orderId)
          .single();

        if (orderError) throw orderError;
        if (!orderRow) {
          setOrder(null);
          return;
        }

        // 2) Ferme (table listing)
        const { data: farmRow, error: farmError } = await supabase
          .from("listing")
          .select<string, Pick<ListingRow, "name" | "address" | "phoneNumber">>(
            `
            name,
            address,
            phoneNumber
          `
          )
          .eq("id", orderRow.farm_id)
          .single();

        if (farmError) throw farmError;

        const statusInfo =
          statusMap[orderRow.status as OrderUI["status"]] ?? statusMap.pending;

        const orderNumber = `FDP-${String(orderRow.id).padStart(4, "0")}`;

        const items = (orderRow.items ?? []) as unknown as ItemsJson;

        const mapped: OrderUI = {
          id: orderRow.id,
          order_number: orderNumber,

          farm_id: orderRow.farm_id,
          farm_name: farmRow?.name ?? "Ferme",
          farm_address: farmRow?.address ?? null,
          farm_phone: farmRow?.phoneNumber ?? null,

          delivery_mode: orderRow.delivery_mode,
          delivery_day: orderRow.delivery_day ?? null,

          total_price: Number(orderRow.total_price ?? 0),
          status: orderRow.status,

          status_label: statusInfo.label,
          status_icon: statusInfo.icon,

          items,
          created_at: orderRow.created_at,
        };

        setOrder(mapped);
      } catch (error) {
        console.error("Erreur chargement commande:", error);
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  // Polling toutes les 30s (sans reload)
  useEffect(() => {
    if (!Number.isFinite(orderId)) return;

    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from("orders")
        .select<string, Pick<OrderRow, "status">>("status")
        .eq("id", orderId)
        .single();

      if (error || !data) return;

      setOrder((prev) => {
        if (!prev) return prev;
        if (data.status === prev.status) return prev;

        const statusInfo =
          statusMap[data.status as OrderUI["status"]] ?? statusMap.pending;

        return {
          ...prev,
          status: data.status,
          status_label: statusInfo.label,
          status_icon: statusInfo.icon,
        };
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [orderId]);

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
            Chargement de la commande...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <div className="text-center">
          <Package
            className="w-20 h-20 mx-auto mb-4"
            style={{ color: COLORS.TEXT_MUTED }}
          />
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Commande non trouvée
          </h2>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium mt-4"
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
          >
            Retour aux fermes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.BG_GRAY }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 mb-4 text-sm hover:underline"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux fermes
          </Link>

          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Commande #{order.order_number}
          </h1>

          <div className="flex items-center gap-2">
            <span className="text-2xl">{order.status_icon}</span>
            <span className="font-semibold" style={{ color: COLORS.PRIMARY }}>
              {order.status_label}
            </span>
          </div>

          {order.delivery_mode === "delivery" && (
            <div className="flex items-center gap-2 mt-2 text-sm">
              <Truck
                className="w-4 h-4"
                style={{ color: COLORS.TEXT_SECONDARY }}
              />
              <span style={{ color: COLORS.TEXT_SECONDARY }}>
                Livraison {order.delivery_day || "à définir"}
              </span>
            </div>
          )}
        </div>

        <div
          className="p-6 rounded-xl mb-6 border-2"
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderColor: `${COLORS.PRIMARY}40`,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ backgroundColor: COLORS.BG_WHITE }}
            >
              {order.status_icon}
            </div>

            <div className="flex-1">
              <p
                className="font-bold text-lg mb-1"
                style={{ color: COLORS.PRIMARY }}
              >
                {order.status_label}
              </p>
              <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                {order.status === "pending" &&
                  "Votre commande est en cours de préparation"}
                {order.status === "confirmed" &&
                  "Votre commande a été confirmée par le producteur"}
                {order.status === "ready" &&
                  "Votre commande est prête à être récupérée"}
                {order.status === "delivered" && "Votre commande a été livrée"}
                {order.status === "cancelled" && "Cette commande a été annulée"}
              </p>
            </div>
          </div>
        </div>

        <div
          className="p-6 rounded-xl mb-6 border"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.BORDER,
          }}
        >
          <h2
            className="text-lg font-bold mb-4"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Détails de la commande
          </h2>

          <div className="space-y-3 mb-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-xl">📦</span>
                <span style={{ color: COLORS.TEXT_PRIMARY }}>
                  {item.quantity} {item.unit} {item.product_name}
                </span>
              </div>
            ))}
          </div>

          <div
            className="pt-4 border-t flex justify-between"
            style={{ borderColor: COLORS.BORDER }}
          >
            <span className="font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
              Total payé
            </span>
            <span
              className="font-bold text-xl"
              style={{ color: COLORS.PRIMARY }}
            >
              {order.total_price.toFixed(2)} €
            </span>
          </div>
        </div>

        <div
          className="p-6 rounded-xl mb-6 border"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.BORDER,
          }}
        >
          <h2
            className="text-lg font-bold mb-4"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Informations pratiques
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin
                className="w-5 h-5 mt-0.5 flex-shrink-0"
                style={{ color: COLORS.PRIMARY }}
              />
              <div>
                <p
                  className="font-medium text-sm mb-1"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {order.farm_name}
                </p>
                <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                  {order.farm_address || "Adresse non disponible"}
                </p>
              </div>
            </div>

            {order.farm_phone && (
              <div className="flex items-start gap-3">
                <Phone
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  style={{ color: COLORS.PRIMARY }}
                />
                <div>
                  <p
                    className="font-medium text-sm mb-1"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Contact producteur
                  </p>
                  <a
                    href={`tel:${order.farm_phone}`}
                    className="text-sm hover:underline"
                    style={{ color: COLORS.LINK }}
                  >
                    {order.farm_phone}
                  </a>
                </div>
              </div>
            )}

            <div
              className="p-3 rounded-lg text-sm flex items-start gap-2"
              style={{
                backgroundColor: COLORS.PRIMARY_BG,
                color: COLORS.TEXT_SECONDARY,
              }}
            >
              <span>ℹ️</span>
              <span>
                Vous serez notifié par email ou SMS lorsque votre commande sera
                prête
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/explore"
          className={cn(
            "block w-full py-3 px-4 rounded-lg text-center font-medium",
            "transition-all duration-200 hover:shadow-md"
          )}
          style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.BG_WHITE }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
          }}
        >
          Retour aux fermes
        </Link>
      </div>
    </div>
  );
}
