/**
 * Helper client pour créer des commandes
 * Abstrait la logique d'appel API avec gestion d'erreurs
 * À placer dans: lib/api/orders.ts
 */

import type {
  CreateOrderPayload,
  CreateOrderResponse,
} from "@/lib/types/order";
import { supabase } from "@/utils/supabase/client";

/**
 * Crée une commande via l'API
 *
 * @param payload - Données de la commande
 * @returns Réponse de l'API avec order créée ou erreur
 *
 * @example
 * ```tsx
 * const handleCheckout = async () => {
 *   const result = await createOrder({
 *     farmId: cart.farmId!,
 *     items: cart.items.map(item => ({
 *       productId: item.product.id,
 *       quantity: item.quantity,
 *     })),
 *     deliveryMode: cart.deliveryMode!,
 *     deliveryDay: selectedDay,
 *   });
 *
 *   if (result.success) {
 *     clearCart();
 *     router.push(`/orders/confirmation?orderId=${result.order.id}`);
 *   } else {
 *     toast.error(result.error);
 *   }
 * };
 * ```
 */
export async function createOrder(
  payload: CreateOrderPayload
): Promise<CreateOrderResponse> {
  try {
    // 1. Récupérer la session utilisateur
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        success: false,
        error: "Vous devez être connecté pour passer une commande",
      };
    }

    // 2. Appeler l'API avec le token
    const response = await fetch("/api/orders/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    // 3. Parser la réponse
    const data: CreateOrderResponse = await response.json();

    // 4. Gérer les erreurs HTTP
    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Erreur lors de la création de la commande",
        details: data.details,
      };
    }

    return data;
  } catch (error) {
    console.error("Error in createOrder:", error);
    return {
      success: false,
      error: "Erreur de connexion au serveur",
    };
  }
}

/**
 * Vérifier si l'utilisateur est connecté avant checkout
 */
export async function checkAuthBeforeCheckout(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return !!session;
}
