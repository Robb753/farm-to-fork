/**
 * Route API : POST /api/orders/create
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { createOrderSchema } from "@/lib/validations/order";
import type { CreateOrderResponse, OrderItem } from "@/lib/types/order";
import type { Database, Json } from "@/lib/types/database";

// ------------------------------------------------------
// Helpers
// ------------------------------------------------------

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token || null;
}

/**
 * On lit "sub" du JWT sans vérifier la signature.
 * -> OK ici car Supabase vérifie la signature côté DB/RLS.
 * -> Et RLS empêchera toute création si le sub ne correspond pas.
 */
function getJwtSub(token: string): string | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    const json = Buffer.from(padded, "base64").toString("utf8");
    const data = JSON.parse(json) as { sub?: unknown };

    return typeof data.sub === "string" && data.sub.length > 0
      ? data.sub
      : null;
  } catch {
    return null;
  }
}

function supabaseFromToken(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

// ------------------------------------------------------
// Route
// ------------------------------------------------------

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ListingRow = Database["public"]["Tables"]["listing"]["Row"];
type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateOrderResponse>> {
  try {
    // ==========================================
    // 1) AUTH (Bearer Clerk JWT)
    // ==========================================
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    const clerkUserId = getJwtSub(token);
    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: "Token invalide (sub manquant)" },
        { status: 401 }
      );
    }

    const supabase = supabaseFromToken(token);

    // (Optionnel) ping RLS : si token invalide, certaines requêtes vont échouer.
    // On évite supabase.auth.getUser(token) car selon les setups JWKS externes,
    // ça peut être non fiable. RLS fera foi.

    // ==========================================
    // 2) VALIDATION BODY (Zod)
    // ==========================================
    const body = await request.json().catch(() => null);

    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );

      return NextResponse.json(
        { success: false, error: "Données invalides", details },
        { status: 400 }
      );
    }

    const {
      farmId,
      items,
      deliveryMode,
      deliveryDay,
      deliveryAddress,
      customerNotes,
    } = parsed.data;

    if (!deliveryDay || typeof deliveryDay !== "string") {
      return NextResponse.json(
        { success: false, error: "Jour de livraison/retrait manquant" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun article dans la commande" },
        { status: 400 }
      );
    }

    // ==========================================
    // 3) CHECK FARM
    // ==========================================
    const { data: farm, error: farmError } = await supabase
      .from("listing")
      .select("id, active")
      .eq("id", farmId)
      .single<ListingRow>();

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
    // 4) FETCH PRODUCTS (server prices)
    // ==========================================
    const productIdsUnique = Array.from(new Set(items.map((i) => i.productId)));

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, unit, stock_status, image_url, farm_id")
      .in("id", productIdsUnique)
      .eq("farm_id", farmId)
      .eq("active", true)
      .eq("is_published", true);

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

    const typedProducts = products as ProductRow[];

    const productsById = new Map<number, ProductRow>();
    for (const p of typedProducts) productsById.set(p.id as number, p);

    const missingIds = productIdsUnique.filter((id) => !productsById.has(id));
    if (missingIds.length > 0) {
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
    // 5) STOCK CHECK
    // ==========================================
    const outOfStock = typedProducts.filter(
      (p) => p.stock_status === "out_of_stock"
    );

    if (outOfStock.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Certains produits ne sont plus en stock",
          details: outOfStock.map((p) => p.name ?? `#${p.id}`),
        },
        { status: 400 }
      );
    }

    // ==========================================
    // 6) PRICE CALC (server-side)
    // ==========================================
    let totalPrice = 0;
    const orderItems: OrderItem[] = [];

    for (const item of items) {
      const product = productsById.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Produit ${item.productId} introuvable` },
          { status: 404 }
        );
      }

      if (product.price == null) {
        return NextResponse.json(
          {
            success: false,
            error: `Prix manquant pour le produit ${product.name ?? `#${product.id}`}`,
          },
          { status: 500 }
        );
      }

      if (!product.unit) {
        return NextResponse.json(
          {
            success: false,
            error: `Unité manquante pour le produit ${product.name ?? `#${product.id}`}`,
          },
          { status: 500 }
        );
      }

      const qty = Number(item.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Quantité invalide pour ${product.name ?? `#${product.id}`}`,
          },
          { status: 400 }
        );
      }

      const price = Number(product.price);
      const itemTotal = price * qty;
      totalPrice += itemTotal;

      orderItems.push({
        productId: Number(product.id),
        productName: product.name ?? "Produit",
        price,
        quantity: qty,
        unit: product.unit,
        imageUrl: product.image_url || undefined,
      });
    }

    // ==========================================
    // 7) DELIVERY ADDRESS CHECK
    // ==========================================
    if (deliveryMode === "delivery") {
      if (!deliveryAddress) {
        return NextResponse.json(
          {
            success: false,
            error: "Adresse de livraison requise pour ce mode",
          },
          { status: 400 }
        );
      }

      if (
        typeof deliveryAddress !== "object" ||
        Array.isArray(deliveryAddress)
      ) {
        return NextResponse.json(
          { success: false, error: "Adresse de livraison invalide" },
          { status: 400 }
        );
      }
    }

    // ==========================================
    // 8) INSERT ORDER
    // ==========================================
    const insertPayload: OrderInsert = {
      user_id: clerkUserId, // ✅ TEXT = sub Clerk
      farm_id: farmId,
      items: orderItems as unknown as Json,
      total_price: Number(totalPrice.toFixed(2)),
      delivery_mode: deliveryMode,
      delivery_day: deliveryDay,
      delivery_address:
        deliveryMode === "delivery"
          ? (deliveryAddress as unknown as Json)
          : null,
      customer_notes: customerNotes || null,
      status: "pending",
      payment_status: "unpaid",
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(insertPayload)
      .select("*")
      .single();

    if (orderError || !order) {
      console.error("Error creating order:", orderError);
      // Si token invalide / RLS refuse, Supabase peut renvoyer 401/403/42501
      return NextResponse.json(
        { success: false, error: "Erreur lors de la création de la commande" },
        { status: 500 }
      );
    }

    // ==========================================
    // 9) SUCCESS
    // ==========================================
    return NextResponse.json(
      { success: true, order: order as any },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error in /api/orders/create:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur inattendue" },
      { status: 500 }
    );
  }
}
