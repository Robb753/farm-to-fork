"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, Package, MapPin, Truck, Calendar } from "lucide-react";
import { COLORS } from "@/lib/config";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

/**
 * Interface pour une commande avec infos jointes
 */
interface OrderWithFarm {
  id: number;
  user_id: string;
  farm_id: number;
  items: Array<{
    productId: number;
    productName: string;
    price: number;
    quantity: number;
    unit: string;
    imageUrl?: string;
  }>;
  total_price: number;
  delivery_mode: "pickup" | "delivery";
  delivery_day: string;
  delivery_address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
    additionalInfo?: string;
  };
  customer_notes?: string;
  status: "pending" | "confirmed" | "ready" | "delivered" | "cancelled";
  payment_status: "unpaid" | "paid" | "refunded";
  created_at: string;

  farm?: {
    id: number;
    name: string;
    address: string;
    email: string;
    phone_number?: string;
  };
}

/**
 * Page de confirmation de commande (spécifique à une ferme)
 * Route: /farm/[id]/orders/[orderId]
 *
 * ✅ VERSION CORRIGÉE avec toutes les améliorations de sécurité
 */
export default function FarmOrderConfirmationPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();

  const farmId = params.id ? Number(params.id) : NaN;
  const orderId = params.orderId ? Number(params.orderId) : NaN;

  const [order, setOrder] = useState<OrderWithFarm | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ✅ CORRECTION 1: Redirection si IDs invalides
    if (Number.isNaN(farmId) || Number.isNaN(orderId)) {
      toast.error("Identifiants de commande invalides");
      router.push("/orders");
      return;
    }

    async function loadOrder() {
      try {
        setIsLoading(true);

        // ✅ CORRECTION 2: Vérification de l'authentification
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Vous devez être connecté pour voir cette commande");
          router.push("/login");
          return;
        }

        // ✅ CORRECTION 3: Ajout du filtre user_id pour la sécurité
        const response = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .eq("farm_id", farmId)
          .eq("user_id", user.id) // 🔒 SÉCURITÉ: Vérifier que la commande appartient bien à l'utilisateur
          .single();

        // Cast explicite pour éviter les erreurs TypeScript avec jsonb
        const orderData = response.data as any;
        const orderError = response.error;

        if (orderError) {
          console.error("Erreur chargement commande:", orderError);

          // ✅ AMÉLIORATION: Message d'erreur plus clair
          if (orderError.code === "PGRST116") {
            toast.error("Commande introuvable ou vous n'y avez pas accès");
          } else {
            toast.error("Erreur lors du chargement de la commande");
          }

          router.push("/orders");
          return;
        }

        if (!orderData) {
          toast.error("Commande introuvable");
          router.push("/orders");
          return;
        }

        // Charger les infos de la ferme
        const farmResponse = await supabase
          .from("listing")
          .select("id, name, address, email, phone_number")
          .eq("id", farmId)
          .single();

        // Cast explicite pour la ferme aussi
        const farmData = farmResponse.data as any;
        const farmError = farmResponse.error;

        if (farmError) {
          console.error("Erreur chargement ferme:", farmError);
          // On continue même si la ferme n'est pas chargée
        }

        // ✅ AMÉLIORATION: Gérer delivery_address (jsonb dans Supabase)
        let parsedDeliveryAddress = undefined;

        if (orderData.delivery_address) {
          // delivery_address est déjà un objet si c'est du jsonb
          parsedDeliveryAddress = orderData.delivery_address;
        }

        // Mapper les données avec type safety
        const mappedOrder: OrderWithFarm = {
          id: orderData.id,
          user_id: orderData.user_id,
          farm_id: orderData.farm_id,
          items: orderData.items || [],
          total_price: orderData.total_price || 0,
          delivery_mode: orderData.delivery_mode,
          delivery_day: orderData.delivery_day || "",
          delivery_address: parsedDeliveryAddress,
          customer_notes: orderData.customer_notes || undefined,
          status: orderData.status,
          payment_status: orderData.payment_status,
          created_at: orderData.created_at,
          farm: farmData
            ? {
                id: farmData.id,
                name: farmData.name,
                address: farmData.address,
                email: farmData.email || "",
                phone_number: farmData.phone_number || undefined,
              }
            : undefined,
        };

        setOrder(mappedOrder);
      } catch (error) {
        console.error("Erreur inattendue chargement commande:", error);
        toast.error("Une erreur inattendue s'est produite");
        router.push("/orders");
      } finally {
        setIsLoading(false);
      }
    }

    loadOrder();
  }, [farmId, orderId, router]);

  // Loading state
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
            Chargement de votre commande...
          </p>
        </div>
      </div>
    );
  }

  // ✅ AMÉLIORATION: État vide plus informatif (normalement ne devrait jamais arriver)
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
            Commande introuvable
          </h2>
          <p className="mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
            Cette commande n'existe pas ou n'appartient pas à votre compte
          </p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium"
            style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.BG_WHITE }}
          >
            Voir toutes mes commandes
          </Link>
        </div>
      </div>
    );
  }

  const orderNumber = `FM2K-${String(order.id).padStart(6, "0")}`;

  const statusEmoji =
    order.status === "pending"
      ? "⏳"
      : order.status === "confirmed"
        ? "✅"
        : order.status === "ready"
          ? "📦"
          : order.status === "delivered"
            ? "🎉"
            : "❌";

  const statusLabel =
    order.status === "pending"
      ? "En attente"
      : order.status === "confirmed"
        ? "Confirmée"
        : order.status === "ready"
          ? "Prête"
          : order.status === "delivered"
            ? "Livrée"
            : "Annulée";

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.BG_GRAY }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link
          href={`/farm/${farmId}/orders`}
          className="inline-flex items-center gap-2 mb-6 text-sm hover:underline"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          ← Retour à mes commandes
        </Link>

        {/* Header succès */}
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
            Merci pour votre commande chez {order.farm?.name || "cette ferme"}{" "}
            🌱
          </p>
        </div>

        {/* Numéro de commande + statut */}
        <div
          className="p-6 rounded-xl mb-6 border-2"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: `${COLORS.SUCCESS}40`,
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package
                  className="w-6 h-6"
                  style={{ color: COLORS.PRIMARY }}
                />
                <span
                  className="font-medium"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Numéro de commande
                </span>
              </div>
              <span
                className="font-bold text-lg"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {orderNumber}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {order.delivery_mode === "pickup" ? (
                  <MapPin
                    className="w-6 h-6"
                    style={{ color: COLORS.PRIMARY }}
                  />
                ) : (
                  <Truck
                    className="w-6 h-6"
                    style={{ color: COLORS.PRIMARY }}
                  />
                )}
                <span
                  className="font-medium"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Mode de réception
                </span>
              </div>
              <span
                className="font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {order.delivery_mode === "pickup" ? "Retrait" : "Livraison"}
              </span>
            </div>

            <div className="flex items-center justify-between">
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
                {new Date(order.delivery_day).toLocaleDateString("fr-FR")}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{statusEmoji}</span>
                <span
                  className="font-medium"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Statut
                </span>
              </div>
              <span
                className="font-bold text-lg"
                style={{ color: COLORS.SUCCESS }}
              >
                {statusLabel}
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
          <h2
            className="text-lg font-bold mb-4"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            📦 Vos produits
          </h2>

          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-start pb-3 border-b last:border-b-0"
                style={{ borderColor: COLORS.BORDER }}
              >
                <div className="flex-1">
                  <p
                    className="font-semibold"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {item.quantity}x {item.productName}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {item.price.toFixed(2)} € / {item.unit}
                  </p>
                </div>
                <p className="font-bold" style={{ color: COLORS.PRIMARY }}>
                  {(item.quantity * item.price).toFixed(2)} €
                </p>
              </div>
            ))}
          </div>

          <div
            className="pt-4 mt-4 border-t flex justify-between"
            style={{ borderColor: COLORS.BORDER }}
          >
            <span
              className="font-bold text-lg"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Total
            </span>
            <span
              className="font-bold text-2xl"
              style={{ color: COLORS.PRIMARY }}
            >
              {order.total_price.toFixed(2)} €
            </span>
          </div>
        </div>

        {/* Infos livraison */}
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
            {order.delivery_mode === "pickup"
              ? "📍 Retrait à la ferme"
              : "🚚 Livraison"}
          </h2>

          {order.delivery_mode === "pickup" ? (
            <div>
              <p
                className="font-semibold mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {order.farm?.name}
              </p>
              <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                {order.farm?.address}
              </p>
              {order.farm?.phone_number && (
                <p
                  className="text-sm mt-2"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  📞 {order.farm.phone_number}
                </p>
              )}
            </div>
          ) : (
            <div>
              <p
                className="font-semibold mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Adresse de livraison
              </p>
              {order.delivery_address && (
                <div
                  className="text-sm"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  <p>{order.delivery_address.street}</p>
                  <p>
                    {order.delivery_address.postalCode}{" "}
                    {order.delivery_address.city}
                  </p>
                  {order.delivery_address.additionalInfo && (
                    <p className="mt-1 italic">
                      {order.delivery_address.additionalInfo}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {order.customer_notes && (
            <div
              className="mt-4 pt-4 border-t"
              style={{ borderColor: COLORS.BORDER }}
            >
              <p
                className="font-semibold mb-1"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                💬 Vos instructions
              </p>
              <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                {order.customer_notes}
              </p>
            </div>
          )}
        </div>

        {/* Prochaines étapes */}
        <div
          className="p-6 rounded-xl mb-6 border"
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderColor: COLORS.PRIMARY,
          }}
        >
          <h2
            className="text-lg font-bold mb-3"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            📋 Prochaines étapes
          </h2>
          <ol
            className="space-y-2 text-sm"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Le producteur va confirmer votre commande sous 24h</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Vous recevrez un email de confirmation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>
                {order.delivery_mode === "pickup"
                  ? "Venez récupérer votre commande à la date prévue"
                  : "Votre commande sera livrée à la date prévue"}
              </span>
            </li>
          </ol>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={`/farm/${farmId}/orders`}
            className="py-3 px-4 rounded-lg text-center font-medium transition-all duration-200 hover:shadow-md"
            style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.BG_WHITE }}
          >
            Mes commandes chez cette ferme
          </Link>

          <Link
            href={`/farm/${farmId}/shop`}
            className="py-3 px-4 rounded-lg text-center font-medium border-2 transition-all duration-200 hover:shadow-md"
            style={{
              borderColor: COLORS.PRIMARY,
              color: COLORS.PRIMARY,
              backgroundColor: "transparent",
            }}
          >
            Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  );
}
