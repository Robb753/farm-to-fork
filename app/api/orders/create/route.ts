/**
 * Route API : POST /api/orders/create
 * Crée une nouvelle commande avec toutes les vérifications côté serveur
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server";
import { createOrderSchema } from "@/lib/validations/order";
import type { CreateOrderResponse, OrderItem } from "@/lib/types/order";
import type { Json } from "@/lib/types/database";
import { z } from "zod";

/**
 * POST /api/orders/create
 *
 * Sécurité :
 * - Vérifie l'authentification
 * - Re-calcule les prix côté serveur (JAMAIS confiance au client)
 * - Vérifie le stock
 * - Valide les données avec Zod
 *
 * @returns Order créée ou erreur détaillée
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateOrderResponse>> {
  try {
    // ==========================================
    // 1. VÉRIFICATION AUTHENTIFICATION
    // ==========================================
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Vérifier le token avec Supabase
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    // ==========================================
    // 2. VALIDATION DES DONNÉES
    // ==========================================
    const body = await request.json();

    let validatedData;
    try {
      validatedData = createOrderSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: "Données invalides",
            details: error.errors.map(
              (e) => `${e.path.join(".")}: ${e.message}`
            ),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const {
      farmId,
      items,
      deliveryMode,
      deliveryDay,
      deliveryAddress,
      customerNotes,
    } = validatedData;

    // ==========================================
    // 3. VÉRIFICATION DE LA FERME
    // ==========================================
    const { data: farm, error: farmError } = await supabaseServer
      .from("listing")
      .select("id, name, email, active")
      .eq("id", farmId)
      .single();

    if (farmError || !farm) {
      return NextResponse.json(
        { success: false, error: "Ferme introuvable" },
        { status: 404 }
      );
    }

    if (!farm.active) {
      return NextResponse.json(
        { success: false, error: "Ferme non disponible" },
        { status: 400 }
      );
    }

    // ==========================================
    // 4. RÉCUPÉRATION DES PRODUITS (PRIX SERVEUR)
    // ==========================================
    const productIds = items.map((item) => item.productId);

    const { data: products, error: productsError } = await supabaseServer
      .from("products")
      .select("id, name, price, unit, stock_status, image_url, farm_id")
      .in("id", productIds)
      .eq("farm_id", farmId)
      .eq("is_published", true)
      .eq("active", true);

    if (productsError) {
      console.error("Error fetching products:", productsError);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la récupération des produits",
        },
        { status: 500 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun produit trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que tous les produits existent
    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      return NextResponse.json(
        {
          success: false,
          error: "Certains produits sont introuvables",
          details: [`Produits manquants: ${missingIds.join(", ")}`],
        },
        { status: 404 }
      );
    }

    // ==========================================
    // 5. VÉRIFICATION DU STOCK
    // ==========================================
    const outOfStockProducts = products.filter(
      (p) => p.stock_status === "out_of_stock"
    );

    if (outOfStockProducts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Certains produits ne sont plus en stock",
          details: outOfStockProducts.map((p) => p.name),
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 6. CALCUL DU PRIX TOTAL (CÔTÉ SERVEUR)
    // ==========================================
    let totalPrice = 0;
    const orderItems: OrderItem[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);

      if (!product) {
        return NextResponse.json(
          { success: false, error: `Produit ${item.productId} introuvable` },
          { status: 404 }
        );
      }

      // ✅ Vérification null safety pour price et unit
      if (product.price === null || product.price === undefined) {
        return NextResponse.json(
          {
            success: false,
            error: `Prix manquant pour le produit ${product.name}`,
          },
          { status: 500 }
        );
      }

      if (!product.unit) {
        return NextResponse.json(
          {
            success: false,
            error: `Unité manquante pour le produit ${product.name}`,
          },
          { status: 500 }
        );
      }

      const itemTotal = product.price * item.quantity;
      totalPrice += itemTotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        unit: product.unit,
        imageUrl: product.image_url || undefined,
      });
    }

    // ==========================================
    // 7. VALIDATION DE L'ADRESSE SI DELIVERY
    // ==========================================
    if (deliveryMode === "delivery" && !deliveryAddress) {
      return NextResponse.json(
        { success: false, error: "Adresse de livraison requise pour ce mode" },
        { status: 400 }
      );
    }

    // ==========================================
    // 8. CRÉATION DE LA COMMANDE
    // ==========================================
    const { data: order, error: orderError } = await supabaseServer
      .from("orders")
      .insert({
        user_id: user.id,
        farm_id: farmId,
        items: orderItems as unknown as Json, // ✅ Cast pour Supabase Json type
        total_price: totalPrice,
        delivery_mode: deliveryMode,
        delivery_day: deliveryDay,
        delivery_address: (deliveryAddress as unknown as Json) || null, // ✅ Cast pour Json
        customer_notes: customerNotes || null,
        status: "pending",
        payment_status: "unpaid",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return NextResponse.json(
        { success: false, error: "Erreur lors de la création de la commande" },
        { status: 500 }
      );
    }

    // ==========================================
    // 9. TODO : ENVOYER NOTIFICATIONS
    // ==========================================
    // await sendOrderNotifications(order.id, "created");

    // ==========================================
    // 10. RETOUR SUCCÈS
    // ==========================================
    return NextResponse.json(
      {
        success: true,
        order: order as any, // Cast pour correspondre au type Order complet
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error in /api/orders/create:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur inattendue",
      },
      { status: 500 }
    );
  }
}
