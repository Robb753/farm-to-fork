"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle, Package, Truck, MapPin, Phone, Mail, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import { supabase } from "@/utils/supabase/client";

/**
 * Interface pour une commande
 */
interface Order {
  id: number;
  order_number: string;
  farm_id: number;
  farm_name: string;
  farm_address?: string;
  farm_phone?: string;
  farm_email?: string;
  delivery_mode: "pickup" | "delivery";
  delivery_day?: string;
  pickup_code?: string;
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
 * Page Confirmation de commande - Étape 5
 *
 * Features:
 * - Message de confirmation
 * - Numéro de commande
 * - Code de retrait/livraison
 * - Informations pratiques
 */
export default function OrderConfirmationPage(): JSX.Element {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la commande
  useEffect(() => {
    async function loadOrder() {
      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            farm:listings (
              name,
              address,
              phone,
              email
            )
          `)
          .eq("id", orderId)
          .single();

        if (error) throw error;

        // Générer un numéro de commande et un code
        const orderNumber = `FDP-${String(data.id).padStart(4, "0")}`;
        const pickupCode = String(Math.floor(1000 + Math.random() * 9000));

        setOrder({
          ...data,
          order_number: orderNumber,
          pickup_code: pickupCode,
          farm_name: data.farm?.name || "Ferme",
          farm_address: data.farm?.address,
          farm_phone: data.farm?.phone,
          farm_email: data.farm?.email,
        });
      } catch (error) {
        console.error("Erreur chargement commande:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

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
          <p style={{ color: COLORS.TEXT_SECONDARY }}>Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  // Commande non trouvée
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.BG_GRAY }}>
        <div className="text-center">
          <Package className="w-20 h-20 mx-auto mb-4" style={{ color: COLORS.TEXT_MUTED }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
            Commande non trouvée
          </h2>
          <p className="mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
            Cette commande n'existe pas ou n'est plus disponible
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium"
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
        {/* Header de confirmation */}
        <div className="text-center mb-8">
          <CheckCircle
            className="w-20 h-20 mx-auto mb-4"
            style={{ color: COLORS.SUCCESS }}
          />
          <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
            ✅ Commande confirmée !
          </h1>
          <p className="text-lg" style={{ color: COLORS.TEXT_SECONDARY }}>
            Merci pour votre commande chez {order.farm_name} 🌱
          </p>
        </div>

        {/* Infos clés (très visibles) */}
        <div
          className="p-6 rounded-xl mb-6 border-2"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: `${COLORS.SUCCESS}40`,
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: COLORS.BORDER }}>
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5" style={{ color: COLORS.PRIMARY }} />
                <span className="font-medium" style={{ color: COLORS.TEXT_SECONDARY }}>
                  Commande n°
                </span>
              </div>
              <span className="font-bold text-lg" style={{ color: COLORS.PRIMARY }}>
                {order.order_number}
              </span>
            </div>

            <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: COLORS.BORDER }}>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" style={{ color: COLORS.PRIMARY }} />
                <span className="font-medium" style={{ color: COLORS.TEXT_SECONDARY }}>
                  {order.delivery_mode === "delivery" ? "Livraison prévue" : "Retrait prévu"}
                </span>
              </div>
              <span className="font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
                {order.delivery_day || "À définir"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔐</span>
                <span className="font-medium" style={{ color: COLORS.TEXT_SECONDARY }}>
                  {order.delivery_mode === "delivery" ? "Code livraison" : "Code retrait"}
                </span>
              </div>
              <span className="font-bold text-2xl tracking-wider" style={{ color: COLORS.SUCCESS }}>
                {order.pickup_code}
              </span>
            </div>
          </div>
        </div>

        {/* Récapitulatif produits */}
        <div
          className="p-6 rounded-xl mb-6 border"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.BORDER,
          }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.TEXT_PRIMARY }}>
            Récapitulatif
          </h2>

          <div className="space-y-3 mb-4">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <span style={{ color: COLORS.TEXT_PRIMARY }}>
                  • {item.product_name}
                </span>
                <span style={{ color: COLORS.TEXT_SECONDARY }}>
                  {item.quantity} {item.unit}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t flex justify-between" style={{ borderColor: COLORS.BORDER }}>
            <span className="font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
              Total
            </span>
            <span className="font-bold text-xl" style={{ color: COLORS.PRIMARY }}>
              {order.total_price.toFixed(2)} €
            </span>
          </div>
        </div>

        {/* Informations utiles */}
        <div
          className="p-6 rounded-xl mb-6 border"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.BORDER,
          }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.TEXT_PRIMARY }}>
            Informations utiles
          </h2>

          <div className="space-y-3">
            {order.farm_address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: COLORS.PRIMARY }} />
                <div>
                  <p className="font-medium text-sm mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                    Adresse de la ferme
                  </p>
                  <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                    {order.farm_address}
                  </p>
                </div>
              </div>
            )}

            {order.farm_phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: COLORS.PRIMARY }} />
                <div>
                  <p className="font-medium text-sm mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
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
              className="p-3 rounded-lg text-sm"
              style={{
                backgroundColor: COLORS.PRIMARY_BG,
                color: COLORS.TEXT_SECONDARY,
              }}
            >
              ℹ️ Vous serez notifié quand la commande sera prête
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={`/shop/ma-commande/${order.id}`}
            className={cn(
              "py-3 px-4 rounded-lg text-center font-medium",
              "transition-all duration-200 hover:shadow-md"
            )}
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
            }}
          >
            Voir ma commande
          </Link>

          <Link
            href="/shop"
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
