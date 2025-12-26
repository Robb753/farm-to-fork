"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Truck, Loader2 } from "lucide-react";
import { COLORS } from "@/lib/config";
import { useCartStore } from "@/lib/store/cartStore";
import { createOrder } from "@/lib/api/orders";
import type { DeliveryAddress } from "@/lib/types/order";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase/client";

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
}

/**
 * Page Checkout - Finalisation de la commande
 */
export default function FarmCheckoutPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const farmId = params.id ? Number(params.id) : NaN;

  const cart = useCartStore((s) => s.cart);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotalPrice = useCartStore((s) => s.getTotalPrice);

  const [farm, setFarm] = useState<Farm | null>(null);
  const [isLoadingFarm, setIsLoadingFarm] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Formulaire
  const [deliveryDay, setDeliveryDay] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    street: "",
    city: "",
    postalCode: "",
    country: "France",
  });

  // Charger les infos de la ferme
  useEffect(() => {
    if (Number.isNaN(farmId)) {
      router.push("/explore");
      return;
    }

    async function loadFarm() {
      try {
        const { data, error } = await supabase
          .from("listing")
          .select("id, name, address")
          .eq("id", farmId)
          .eq("active", true)
          .single();

        if (error || !data) {
          toast.error("Ferme introuvable");
          router.push("/explore");
          return;
        }

        // Ajouter les valeurs par défaut pour les champs manquants
        setFarm({
          ...data,
          pickup_days: "À définir avec le producteur",
          delivery_available: false,
          delivery_days: "À définir",
          delivery_price: 5,
        });
      } catch (err) {
        console.error("Erreur chargement ferme:", err);
        toast.error("Impossible de charger la ferme");
        router.push("/explore");
      } finally {
        setIsLoadingFarm(false);
      }
    }

    loadFarm();
  }, [farmId, router]);

  // Rediriger si panier vide
  useEffect(() => {
    if (!isLoadingFarm && cart.items.length === 0) {
      toast.error("Votre panier est vide");
      router.push(`/farm/${farmId}/shop`);
    }
  }, [cart.items.length, farmId, router, isLoadingFarm]);

  // Calculs
  const subtotal = getTotalPrice();
  const deliveryPrice = useMemo(() => {
    if (!farm?.delivery_available || cart.deliveryMode !== "delivery") return 0;
    return farm?.delivery_price ?? 5;
  }, [farm?.delivery_available, farm?.delivery_price, cart.deliveryMode]);
  const total = subtotal + deliveryPrice;

  // Date minimum (demain)
  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }, []);

  /**
   * Handler de soumission du formulaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!cart.deliveryMode) {
      toast.error("Veuillez choisir un mode de livraison");
      return;
    }

    if (!deliveryDay) {
      toast.error("Veuillez sélectionner un jour de livraison");
      return;
    }

    if (cart.deliveryMode === "delivery") {
      if (
        !deliveryAddress.street ||
        !deliveryAddress.city ||
        !deliveryAddress.postalCode
      ) {
        toast.error("Veuillez renseigner l'adresse de livraison complète");
        return;
      }
    }

    setIsCreatingOrder(true);

    try {
      // Créer la commande via l'API
      const result = await createOrder({
        farmId: cart.farmId!,
        items: cart.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        deliveryMode: cart.deliveryMode!,
        deliveryDay,
        deliveryAddress:
          cart.deliveryMode === "delivery" ? deliveryAddress : undefined,
        customerNotes: customerNotes || undefined,
      });

      if (result.success && result.order) {
        // ✅ Succès !
        toast.success("Commande créée avec succès !");
        clearCart();
        router.push(`/farm/${farmId}/orders/${result.order.id}`);
      } else {
        // ❌ Erreur API
        toast.error(
          result.error || "Erreur lors de la création de la commande"
        );

        if (result.details) {
          result.details.forEach((detail) => {
            toast.error(detail, { duration: 5000 });
          });
        }
      }
    } catch (err) {
      console.error("Erreur checkout:", err);
      toast.error("Une erreur inattendue s'est produite");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Loading state
  if (isLoadingFarm) {
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link
          href={`/farm/${farmId}/cart`}
          className="inline-flex items-center gap-2 mb-6 text-sm hover:underline"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au panier
        </Link>

        {/* En-tête */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Finaliser ma commande
          </h1>
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            Vérifiez vos informations et confirmez votre commande
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Récapitulatif commande */}
          <div
            className="p-6 rounded-xl border"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
          >
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              📦 Récapitulatif
            </h2>

            <div className="space-y-3 mb-4">
              {cart.items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex justify-between text-sm"
                >
                  <span style={{ color: COLORS.TEXT_SECONDARY }}>
                    {item.quantity}x {item.product.name}
                  </span>
                  <span style={{ color: COLORS.TEXT_PRIMARY }}>
                    {(item.quantity * item.product.price).toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>

            <div
              className="pt-3 border-t space-y-2"
              style={{ borderColor: COLORS.BORDER }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: COLORS.TEXT_SECONDARY }}>Sous-total</span>
                <span style={{ color: COLORS.TEXT_PRIMARY }}>
                  {subtotal.toFixed(2)} €
                </span>
              </div>

              {cart.deliveryMode === "delivery" && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: COLORS.TEXT_SECONDARY }}>
                    Livraison
                  </span>
                  <span style={{ color: COLORS.TEXT_PRIMARY }}>
                    {deliveryPrice.toFixed(2)} €
                  </span>
                </div>
              )}

              <div
                className="flex justify-between pt-2 border-t"
                style={{ borderColor: COLORS.BORDER }}
              >
                <span
                  className="font-bold"
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
          </div>

          {/* Mode de livraison (lecture seule depuis cart) */}
          <div
            className="p-6 rounded-xl border"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
          >
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              {cart.deliveryMode === "pickup"
                ? "📍 Retrait à la ferme"
                : "🚚 Livraison"}
            </h2>

            <div
              className="flex items-start gap-3 p-4 rounded-lg"
              style={{ backgroundColor: COLORS.PRIMARY_BG }}
            >
              {cart.deliveryMode === "pickup" ? (
                <MapPin
                  className="w-5 h-5 mt-0.5"
                  style={{ color: COLORS.PRIMARY }}
                />
              ) : (
                <Truck
                  className="w-5 h-5 mt-0.5"
                  style={{ color: COLORS.PRIMARY }}
                />
              )}
              <div>
                <p
                  className="font-semibold mb-1"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {cart.deliveryMode === "pickup"
                    ? "Retrait gratuit"
                    : "Livraison locale"}
                </p>
                <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                  {cart.deliveryMode === "pickup"
                    ? farm?.pickup_days || "Voir avec le producteur"
                    : farm?.delivery_days || "Livraison disponible"}
                </p>
                {cart.deliveryMode === "pickup" && farm?.address && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: COLORS.TEXT_MUTED }}
                  >
                    {farm.address}
                  </p>
                )}
              </div>
            </div>

            <Link
              href={`/farm/${farmId}/cart`}
              className="text-sm hover:underline mt-3 inline-block"
              style={{ color: COLORS.PRIMARY }}
            >
              Modifier le mode de livraison
            </Link>
          </div>

          {/* Jour de livraison/retrait */}
          <div
            className="p-6 rounded-xl border"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
          >
            <label htmlFor="deliveryDay" className="block mb-2">
              <div className="flex items-center gap-2 mb-2">
                <Calendar
                  className="w-5 h-5"
                  style={{ color: COLORS.PRIMARY }}
                />
                <span
                  className="font-bold"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Jour de{" "}
                  {cart.deliveryMode === "pickup" ? "retrait" : "livraison"} *
                </span>
              </div>
            </label>
            <input
              type="date"
              id="deliveryDay"
              value={deliveryDay}
              onChange={(e) => setDeliveryDay(e.target.value)}
              min={minDate}
              className="w-full p-3 border rounded-lg"
              style={{ borderColor: COLORS.BORDER }}
              required
            />
            <p className="text-xs mt-2" style={{ color: COLORS.TEXT_MUTED }}>
              Sélectionnez le jour souhaité (minimum demain)
            </p>
          </div>

          {/* Adresse de livraison (si delivery) */}
          {cart.deliveryMode === "delivery" && (
            <div
              className="p-6 rounded-xl border"
              style={{
                backgroundColor: COLORS.BG_WHITE,
                borderColor: COLORS.BORDER,
              }}
            >
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                📍 Adresse de livraison
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="street"
                    className="block text-sm font-medium mb-1"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Rue *
                  </label>
                  <input
                    type="text"
                    id="street"
                    value={deliveryAddress.street}
                    onChange={(e) =>
                      setDeliveryAddress((prev) => ({
                        ...prev,
                        street: e.target.value,
                      }))
                    }
                    placeholder="12 rue de la Ferme"
                    className="w-full p-3 border rounded-lg"
                    style={{ borderColor: COLORS.BORDER }}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="postalCode"
                      className="block text-sm font-medium mb-1"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      Code postal *
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      value={deliveryAddress.postalCode}
                      onChange={(e) =>
                        setDeliveryAddress((prev) => ({
                          ...prev,
                          postalCode: e.target.value,
                        }))
                      }
                      placeholder="67500"
                      className="w-full p-3 border rounded-lg"
                      style={{ borderColor: COLORS.BORDER }}
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium mb-1"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      Ville *
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={deliveryAddress.city}
                      onChange={(e) =>
                        setDeliveryAddress((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      placeholder="Haguenau"
                      className="w-full p-3 border rounded-lg"
                      style={{ borderColor: COLORS.BORDER }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="additionalInfo"
                    className="block text-sm font-medium mb-1"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    Complément d'adresse (optionnel)
                  </label>
                  <input
                    type="text"
                    id="additionalInfo"
                    value={deliveryAddress.additionalInfo || ""}
                    onChange={(e) =>
                      setDeliveryAddress((prev) => ({
                        ...prev,
                        additionalInfo: e.target.value,
                      }))
                    }
                    placeholder="Bâtiment A, Code 1234"
                    className="w-full p-3 border rounded-lg"
                    style={{ borderColor: COLORS.BORDER }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Instructions spéciales */}
          <div
            className="p-6 rounded-xl border"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
          >
            <label htmlFor="customerNotes" className="block mb-2">
              <span
                className="font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                💬 Instructions spéciales (optionnel)
              </span>
            </label>
            <textarea
              id="customerNotes"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Ex: Sonnez 2 fois, code portail 1234..."
              rows={3}
              maxLength={500}
              className="w-full p-3 border rounded-lg resize-none"
              style={{ borderColor: COLORS.BORDER }}
            />
            <p className="text-xs mt-2" style={{ color: COLORS.TEXT_MUTED }}>
              {customerNotes.length}/500 caractères
            </p>
          </div>

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={isCreatingOrder}
            className="w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
          >
            {isCreatingOrder ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>✅ Confirmer ma commande ({total.toFixed(2)} €)</>
            )}
          </button>

          <p
            className="text-xs text-center"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            En confirmant, vous acceptez nos conditions générales de vente
          </p>
        </form>
      </div>
    </div>
  );
}
