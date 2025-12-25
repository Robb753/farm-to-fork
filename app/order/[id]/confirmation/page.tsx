"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle, Package, MapPin, Phone, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import { supabase } from "@/utils/supabase/client";
import type { Database, Json } from "@/lib/types/database";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type ListingRow = Database["public"]["Tables"]["listing"]["Row"];

// Ce que tu affiches vraiment côté UI
interface OrderUI {
  id: number;
  order_number: string;
  farm_id: number;
  farm_name: string;
  farm_address: string | null;
  farm_phone: string | null;
  farm_email: string | null;
  delivery_mode: "pickup" | "delivery";
  delivery_day: string | null;
  pickup_code: string;
  total_price: number;
  status: "pending" | "confirmed" | "ready" | "delivered" | "cancelled";
  items: Array<{
    product_name: string;
    quantity: number;
    unit: string;
  }>;
  created_at: string;
}

type ItemsJson = Array<{
  product_name: string;
  quantity: number;
  unit: string;
}>;

export default function OrderConfirmationPage(): JSX.Element {
  const params = useParams();
  const orderIdParam = params.id as string | undefined;
  const orderId = orderIdParam ? Number(orderIdParam) : NaN;

  const [order, setOrder] = useState<OrderUI | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!Number.isFinite(orderId)) {
        setIsLoading(false);
        setOrder(null);
        return;
      }

      try {
        setIsLoading(true);

        // 1) Charger la commande (sans embed)
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

        // 2) Charger la ferme (table listing, pas listings)
        const { data: farmRow, error: farmError } = await supabase
          .from("listing")
          .select<
            string,
            Pick<ListingRow, "name" | "address" | "phoneNumber" | "email">
          >(
            `
            name,
            address,
            phoneNumber,
            email
          `
          )
          .eq("id", orderRow.farm_id)
          .single();

        if (farmError) throw farmError;

        // 3) Construire l'objet UI
        const orderNumber = `FDP-${String(orderRow.id).padStart(4, "0")}`;

        // ⚠️ Ton "pickup_code" est aléatoire actuellement -> idéalement le stocker en DB.
        const pickupCode = String(Math.floor(1000 + Math.random() * 9000));

        const items = (orderRow.items ?? []) as unknown as ItemsJson;

        const mapped: OrderUI = {
          id: orderRow.id,
          order_number: orderNumber,
          farm_id: orderRow.farm_id,
          farm_name: farmRow?.name ?? "Ferme",
          farm_address: farmRow?.address ?? null,
          farm_phone: farmRow?.phoneNumber ?? null,
          farm_email: farmRow?.email ?? null,
          delivery_mode: orderRow.delivery_mode,
          delivery_day: orderRow.delivery_day ?? null,
          pickup_code: pickupCode,
          total_price: Number(orderRow.total_price ?? 0),
          status: orderRow.status,
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
          <p className="mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
            Cette commande n'existe pas ou n'est plus disponible
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium"
            style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.BG_WHITE }}
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
        <div className="text-center mb-8">
          <CheckCircle
            className="w-20 h-20 mx-auto mb-4"
            style={{ color: COLORS.SUCCESS }}
          />
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            ✅ Commande confirmée !
          </h1>
          <p className="text-lg" style={{ color: COLORS.TEXT_SECONDARY }}>
            Merci pour votre commande chez {order.farm_name} 🌱
          </p>
        </div>

        <div
          className="p-6 rounded-xl mb-6 border-2"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: `${COLORS.SUCCESS}40`,
          }}
        >
          <div className="space-y-4">
            <div
              className="flex items-center justify-between pb-4 border-b"
              style={{ borderColor: COLORS.BORDER }}
            >
              <div className="flex items-center gap-3">
                <Package
                  className="w-5 h-5"
                  style={{ color: COLORS.PRIMARY }}
                />
                <span
                  className="font-medium"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Commande n°
                </span>
              </div>
              <span
                className="font-bold text-lg"
                style={{ color: COLORS.PRIMARY }}
              >
                {order.order_number}
              </span>
            </div>

            <div
              className="flex items-center justify-between pb-4 border-b"
              style={{ borderColor: COLORS.BORDER }}
            >
              <div className="flex items-center gap-3">
                <Calendar
                  className="w-5 h-5"
                  style={{ color: COLORS.PRIMARY }}
                />
                <span
                  className="font-medium"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {order.delivery_mode === "delivery"
                    ? "Livraison prévue"
                    : "Retrait prévu"}
                </span>
              </div>
              <span
                className="font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {order.delivery_day || "À définir"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔐</span>
                <span
                  className="font-medium"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {order.delivery_mode === "delivery"
                    ? "Code livraison"
                    : "Code retrait"}
                </span>
              </div>
              <span
                className="font-bold text-2xl tracking-wider"
                style={{ color: COLORS.SUCCESS }}
              >
                {order.pickup_code}
              </span>
            </div>
          </div>
        </div>

        {/* ... ton JSX reste identique ensuite (récap, infos, actions) ... */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={`/shop/ma-commande/${order.id}`}
            className={cn(
              "py-3 px-4 rounded-lg text-center font-medium",
              "transition-all duration-200 hover:shadow-md"
            )}
            style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.BG_WHITE }}
          >
            Voir ma commande
          </Link>

          <Link
            href="/explore"
            className={cn(
              "py-3 px-4 rounded-lg text-center font-medium border-2",
              "transition-all duration-200 hover:shadow-md"
            )}
            style={{
              borderColor: COLORS.PRIMARY,
              color: COLORS.PRIMARY,
              backgroundColor: "transparent",
            }}
          >
            Retour aux fermes
          </Link>
        </div>
      </div>
    </div>
  );
}
