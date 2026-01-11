// lib/api/orders.ts
"use client";

import type {
  CreateOrderPayload,
  CreateOrderResponse,
} from "@/lib/types/order";
import { useAuth } from "@clerk/nextjs";

export function useOrdersApi() {
  const { getToken } = useAuth();

  const createOrder = async (
    payload: CreateOrderPayload
  ): Promise<CreateOrderResponse> => {
    try {
      const token = await getToken({ template: "supabase" });

      if (!token) {
        return {
          success: false,
          error: "Vous devez être connecté pour passer une commande",
        };
      }

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data: CreateOrderResponse = await response.json().catch(() => ({
        success: false,
        error: "Réponse serveur invalide",
      }));

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
      return { success: false, error: "Erreur de connexion au serveur" };
    }
  };

  const checkAuthBeforeCheckout = async (): Promise<boolean> => {
    const token = await getToken({ template: "supabase" });
    return !!token;
  };

  return { createOrder, checkAuthBeforeCheckout };
}
