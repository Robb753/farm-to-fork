"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, MapPin, Truck, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import { supabase } from "@/utils/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

/**
 * Interface pour une ferme
 */
interface Farm {
  id: number;
  name: string;
  address: string;
  pickup_days?: string;
  delivery_available?: boolean;
  delivery_days?: string;
  delivery_price?: number;
  delivery_zones?: string[];
}

/**
 * Page Panier - Étape 4
 *
 * Features:
 * - Affichage des produits du panier
 * - Choix retrait/livraison (comme Drive)
 * - Bouton Commander
 */
export default function CartPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const farmId = parseInt(params.farmId as string);

  const [farm, setFarm] = useState<Farm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cart = useCartStore((state) => state.cart);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const setDeliveryMode = useCartStore((state) => state.setDeliveryMode);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  // Charger les infos de la ferme
  useEffect(() => {
    async function loadFarm() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("id", farmId)
          .eq("active", true)
          .single();

        if (error) throw error;
        setFarm(data);
      } catch (error) {
        console.error("Erreur chargement ferme:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (farmId) {
      loadFarm();
    }
  }, [farmId]);

  // Vérifier que le panier correspond à la ferme
  useEffect(() => {
    if (cart.farmId && cart.farmId !== farmId) {
      toast.error("Ce panier ne correspond pas à cette ferme");
      router.push("/shop");
    }
  }, [cart.farmId, farmId, router]);

  // Calculer le total avec livraison
  const deliveryPrice = farm?.delivery_price || 5;
  const subtotal = getTotalPrice();
  const total =
    cart.deliveryMode === "delivery" ? subtotal + deliveryPrice : subtotal;

  // Soumettre la commande
  const handleOrder = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour commander");
      router.push("/sign-in");
      return;
    }

    if (cart.items.length === 0) {
      toast.error("Votre panier est vide");
      return;
    }

    if (!cart.deliveryMode) {
      toast.error("Veuillez choisir un mode de réception");
      return;
    }

    try {
      setIsSubmitting(true);

      // Créer la commande dans Supabase
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          farm_id: farmId,
          delivery_mode: cart.deliveryMode,
          total_price: total,
          status: "pending",
          items: cart.items.map((item) => ({
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.product.price,
            unit: item.product.unit,
          })),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Vider le panier
      clearCart();

      // Rediriger vers la confirmation
      router.push(`/shop/commande/${orderData.id}`);
      toast.success("Commande passée avec succès !");
    } catch (error) {
      console.error("Erreur création commande:", error);
      toast.error("Erreur lors de la création de la commande");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.BG_GRAY }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: `${COLORS.PRIMARY} ${COLORS.PRIMARY} ${COLORS.PRIMARY} transparent`
            }}
          />
          <p style={{ color: COLORS.TEXT_SECONDARY }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.BG_GRAY }}>
        <div className="text-center">
          <ShoppingCart className="w-20 h-20 mx-auto mb-4" style={{ color: COLORS.TEXT_MUTED }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
            Votre panier est vide
          </h2>
          <p className="mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
            Ajoutez des produits pour continuer
          </p>
          <Link
            href={`/shop/${farmId}/boutique`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium"
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la boutique
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.BG_GRAY }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={`/shop/${farmId}/boutique`}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: COLORS.TEXT_SECONDARY }} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
              🛒 Votre panier – {cart.farmName}
            </h1>
          </div>
        </div>

        {/* Produits */}
        <div
          className="p-6 rounded-xl mb-6 border"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.BORDER,
          }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.TEXT_PRIMARY }}>
            Produits
          </h2>

          <div className="space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between pb-4 border-b last:border-b-0"
                style={{ borderColor: COLORS.BORDER }}
              >
                <div className="flex-1">
                  <h3 className="font-semibold mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
                    {item.product.name}
                  </h3>
                  <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                    {item.quantity} {item.product.unit} × {item.product.price.toFixed(2)} €
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <p className="font-bold" style={{ color: COLORS.PRIMARY }}>
                    {(item.quantity * item.product.price).toFixed(2)} €
                  </p>

                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" style={{ color: COLORS.ERROR }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mode de réception */}
        <div
          className="p-6 rounded-xl mb-6 border"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.BORDER,
          }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.TEXT_PRIMARY }}>
            Comment souhaitez-vous recevoir votre commande ?
          </h2>

          <div className="space-y-3">
            {/* Retrait */}
            <label
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                cart.deliveryMode === "pickup"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <input
                type="radio"
                name="deliveryMode"
                value="pickup"
                checked={cart.deliveryMode === "pickup"}
                onChange={() => setDeliveryMode("pickup")}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-5 h-5" style={{ color: COLORS.PRIMARY }} />
                  <span className="font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
                    Retrait à la ferme (gratuit)
                  </span>
                </div>
                <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                  📍 {farm?.pickup_days || "Voir avec le producteur"}
                </p>
                {farm?.address && (
                  <p className="text-xs mt-1" style={{ color: COLORS.TEXT_MUTED }}>
                    {farm.address}
                  </p>
                )}
              </div>
              <span className="font-bold" style={{ color: COLORS.SUCCESS }}>
                Gratuit
              </span>
            </label>

            {/* Livraison */}
            {farm?.delivery_available && (
              <label
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                  cart.deliveryMode === "delivery"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <input
                  type="radio"
                  name="deliveryMode"
                  value="delivery"
                  checked={cart.deliveryMode === "delivery"}
                  onChange={() => setDeliveryMode("delivery")}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="w-5 h-5" style={{ color: COLORS.PRIMARY }} />
                    <span className="font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
                      Livraison locale
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                    🚚 {farm?.delivery_days || "Livraison disponible"}
                  </p>
                </div>
                <span className="font-bold" style={{ color: COLORS.PRIMARY }}>
                  {deliveryPrice.toFixed(2)} €
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Récapitulatif */}
        <div
          className="p-6 rounded-xl mb-6 border"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.BORDER,
          }}
        >
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span style={{ color: COLORS.TEXT_SECONDARY }}>Sous-total</span>
              <span style={{ color: COLORS.TEXT_PRIMARY }}>{subtotal.toFixed(2)} €</span>
            </div>

            {cart.deliveryMode === "delivery" && (
              <div className="flex justify-between text-sm">
                <span style={{ color: COLORS.TEXT_SECONDARY }}>Livraison</span>
                <span style={{ color: COLORS.TEXT_PRIMARY }}>{deliveryPrice.toFixed(2)} €</span>
              </div>
            )}

            <div className="pt-2 border-t flex justify-between" style={{ borderColor: COLORS.BORDER }}>
              <span className="font-bold text-lg" style={{ color: COLORS.TEXT_PRIMARY }}>
                Total
              </span>
              <span className="font-bold text-xl" style={{ color: COLORS.PRIMARY }}>
                {total.toFixed(2)} €
              </span>
            </div>
          </div>

          <button
            onClick={handleOrder}
            disabled={isSubmitting || !cart.deliveryMode}
            className={cn(
              "w-full py-4 px-6 rounded-lg font-semibold text-lg",
              "transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && cart.deliveryMode) {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
            }}
          >
            {isSubmitting ? "Commande en cours..." : "Commander"}
          </button>

          {!cart.deliveryMode && (
            <p className="text-center text-sm mt-3" style={{ color: COLORS.WARNING }}>
              Veuillez choisir un mode de réception
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
