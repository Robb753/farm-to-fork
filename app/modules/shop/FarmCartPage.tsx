"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  MapPin,
  Truck,
  ShoppingCart,
  Plus,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import { supabase } from "@/utils/supabase/client";
import { useCartStore } from "@/lib/store/cartStore";
import { toast } from "sonner";

/**
 * Interface pour une ferme
 */
interface Farm {
  id: number;
  name: string;
  address: string;
  pickup_days: string | null;
  delivery_available: boolean | null;
  delivery_days?: string | null;
  delivery_price?: number | null;
  delivery_zones?: string[] | null;
}

/**
 * Page Panier
 */
export default function CartPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();

  const rawId = params.id as string | undefined;
  const farmId = rawId ? Number.parseInt(rawId, 10) : Number.NaN;

  const [farm, setFarm] = useState<Farm | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cart = useCartStore((s) => s.cart);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const setDeliveryMode = useCartStore((s) => s.setDeliveryMode);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotalPrice = useCartStore((s) => s.getTotalPrice);

  // Charger les infos de la ferme
  useEffect(() => {
    if (!rawId || Number.isNaN(farmId)) {
      toast.error("ID de ferme invalide");
      router.push("/explore");
      return;
    }

    let cancelled = false;

    async function loadFarm() {
      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from("listing")
          .select("*")
          .eq("id", farmId)
          .eq("active", true)
          .single();

        if (error) throw error;

        if (!data) {
          toast.error("Ferme introuvable");
          router.push("/explore");
          return;
        }

        if (!cancelled) setFarm(data);
      } catch (error) {
        console.error("Erreur chargement ferme:", error);
        toast.error("Impossible de charger les informations de la ferme");
        router.push("/explore");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadFarm();

    return () => {
      cancelled = true;
    };
  }, [rawId, farmId, router]);

  // Vérifier que le panier correspond à la ferme
  useEffect(() => {
    if (Number.isNaN(farmId)) return;

    if (cart.farmId && cart.farmId !== farmId) {
      toast.error("Ce panier ne correspond pas à cette ferme");
      router.push("/explore");
    }
  }, [cart.farmId, farmId, router]);

  // Handlers quantité
  const handleInc = useCallback(
    (productId: number, currentQty: number) => {
      updateQuantity(productId, currentQty + 1);
    },
    [updateQuantity]
  );

  const handleDec = useCallback(
    (productId: number, currentQty: number) => {
      const next = Math.max(0, currentQty - 1);

      // ✅ Si 0 => on supprime vraiment (sécurité même si store ne gère pas 0)
      if (next === 0) {
        removeItem(productId);
        return;
      }

      updateQuantity(productId, next);
    },
    [removeItem, updateQuantity]
  );

  const handleClearCart = useCallback(() => {
    clearCart();
    toast.success("Panier vidé");
  }, [clearCart]);

  // Totaux
  const deliveryPrice = useMemo(() => {
    // si la ferme ne propose pas la livraison, on force 0
    if (!farm?.delivery_available) return 0;
    return farm?.delivery_price ?? 5;
  }, [farm?.delivery_available, farm?.delivery_price]);

  const subtotal = getTotalPrice();
  const total =
    cart.deliveryMode === "delivery" ? subtotal + deliveryPrice : subtotal;

  // Early return si farmId invalide
  if (!rawId || Number.isNaN(farmId)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <div className="text-center">
          <p style={{ color: COLORS.TEXT_SECONDARY }}>Redirection...</p>
        </div>
      </div>
    );
  }

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

  if (cart.items.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: COLORS.BG_GRAY }}
      >
        <div className="text-center">
          <ShoppingCart
            className="w-20 h-20 mx-auto mb-4"
            style={{ color: COLORS.TEXT_MUTED }}
          />
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Votre panier est vide
          </h2>
          <p className="mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
            Ajoutez des produits pour continuer
          </p>
          <Link
            href={`/farm/${farmId}/shop`}
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
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <Link
              href={`/farm/${farmId}/shop`}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft
                className="w-5 h-5"
                style={{ color: COLORS.TEXT_SECONDARY }}
              />
            </Link>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                🛒 Votre panier – {cart.farmName}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearCart}
            className="text-sm px-3 py-2 rounded-lg border hover:bg-gray-50"
            style={{ borderColor: COLORS.BORDER, color: COLORS.TEXT_SECONDARY }}
            title="Vider le panier"
          >
            Vider
          </button>
        </div>

        {/* Produits */}
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
            Produits
          </h2>

          <div className="space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between pb-4 border-b last:border-b-0"
                style={{ borderColor: COLORS.BORDER }}
              >
                <div className="flex-1 min-w-0 pr-3">
                  <h3
                    className="font-semibold mb-1 truncate"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {item.product.name}
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {item.product.price.toFixed(2)} € / {item.product.unit}
                  </p>
                </div>

                {/* Quantité */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDec(item.product.id, item.quantity)}
                    className="w-9 h-9 rounded-full flex items-center justify-center border"
                    style={{
                      borderColor: COLORS.PRIMARY,
                      color: COLORS.PRIMARY,
                    }}
                    aria-label="Diminuer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <span
                    className="w-10 text-center font-bold"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleInc(item.product.id, item.quantity)}
                    className="w-9 h-9 rounded-full flex items-center justify-center border"
                    style={{
                      borderColor: COLORS.PRIMARY,
                      color: COLORS.PRIMARY,
                    }}
                    aria-label="Augmenter"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Prix + trash */}
                <div className="flex items-center gap-4 pl-4">
                  <p className="font-bold" style={{ color: COLORS.PRIMARY }}>
                    {(item.quantity * item.product.price).toFixed(2)} €
                  </p>

                  <button
                    type="button"
                    onClick={() => removeItem(item.product.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    aria-label="Supprimer"
                    title="Supprimer"
                  >
                    <Trash2
                      className="w-4 h-4"
                      style={{ color: COLORS.ERROR }}
                    />
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
          <h2
            className="text-lg font-bold mb-4"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
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
                  <MapPin
                    className="w-5 h-5"
                    style={{ color: COLORS.PRIMARY }}
                  />
                  <span
                    className="font-semibold"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Retrait à la ferme (gratuit)
                  </span>
                </div>
                <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                  📍 {farm?.pickup_days ?? "Voir avec le producteur"}
                </p>
                {farm?.address && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: COLORS.TEXT_MUTED }}
                  >
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
                    <Truck
                      className="w-5 h-5"
                      style={{ color: COLORS.PRIMARY }}
                    />
                    <span
                      className="font-semibold"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      Livraison locale
                    </span>
                  </div>
                  <p
                    className="text-sm"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
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
              <span style={{ color: COLORS.TEXT_PRIMARY }}>
                {subtotal.toFixed(2)} €
              </span>
            </div>

            {cart.deliveryMode === "delivery" && (
              <div className="flex justify-between text-sm">
                <span style={{ color: COLORS.TEXT_SECONDARY }}>Livraison</span>
                <span style={{ color: COLORS.TEXT_PRIMARY }}>
                  {deliveryPrice.toFixed(2)} €
                </span>
              </div>
            )}

            <div
              className="pt-2 border-t flex justify-between"
              style={{ borderColor: COLORS.BORDER }}
            >
              <span
                className="font-bold text-lg"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Total
              </span>
              <span
                className="font-bold text-xl"
                style={{ color: COLORS.PRIMARY }}
              >
                {total.toFixed(2)} €
              </span>
            </div>
          </div>

          <Link
            href={cart.deliveryMode ? `/farm/${farmId}/checkout` : "#"}
            className={cn(
              "block w-full py-4 px-6 rounded-lg font-semibold text-lg text-center",
              "transition-all duration-200 hover:shadow-lg",
              !cart.deliveryMode &&
                "opacity-50 cursor-not-allowed pointer-events-none"
            )}
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
            onMouseEnter={(e) => {
              if (cart.deliveryMode) {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
            }}
          >
            Procéder au paiement
          </Link>

          {!cart.deliveryMode && (
            <p
              className="text-center text-sm mt-3"
              style={{ color: COLORS.WARNING }}
            >
              Veuillez choisir un mode de réception
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
