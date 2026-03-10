/**
 * Route API : POST /api/orders/create
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { createOrderSchema } from "@/lib/validations/order";
import type { CreateOrderResponse, OrderItem } from "@/lib/types/order";
import type { Database, Json } from "@/lib/types/database";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getJwtSub } from "@/lib/api/jwt";

// ------------------------------------------------------
// Security helpers (Origin/Referer guard)
// ------------------------------------------------------

function normalizeOrigin(input: string): string | null {
  try {
    return new URL(input).origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins(): string[] {
  const origins = new Set<string>();

  // ✅ URL canonique de l’app (ex: https://farm2fork.fr)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    const o = normalizeOrigin(appUrl);
    if (o) origins.add(o);
  }

  // ✅ Dev
  origins.add("http://localhost:3000");
  origins.add("http://127.0.0.1:3000");

  // ✅ Vercel : NEXT_PUBLIC_VERCEL_URL souvent sans protocole
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercel) {
    const candidate = vercel.startsWith("http") ? vercel : `https://${vercel}`;
    const o = normalizeOrigin(candidate);
    if (o) origins.add(o);
  }

  // ✅ (Optionnel) autoriser les previews Vercel (*.vercel.app)
  // Utile si tu testes souvent en preview.
  // Exemple: https://myapp-git-branch-xxx.vercel.app
  const allowVercelPreviews =
    process.env.NEXT_PUBLIC_ALLOW_VERCEL_PREVIEWS === "true";
  if (allowVercelPreviews) {
    // on ne peut pas mettre de wildcard strict dans une liste,
    // donc on traitera ce cas dans assertSameOrigin.
  }

  return Array.from(origins);
}

function isAllowedVercelPreview(origin: string): boolean {
  if (process.env.NEXT_PUBLIC_ALLOW_VERCEL_PREVIEWS !== "true") return false;
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === "https:" && hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

/**
 * Anti-CSRF / Anti cross-site: exiger une origine same-site.
 */
function assertSameOrigin(req: NextRequest) {
  const allowed = getAllowedOrigins();

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (origin) {
    const o = normalizeOrigin(origin);
    if (!o) throw new Response("Forbidden (bad origin)", { status: 403 });
    if (!allowed.includes(o) && !isAllowedVercelPreview(o)) {
      throw new Response("Forbidden (invalid origin)", { status: 403 });
    }
    return;
  }

  if (referer) {
    const refOrigin = normalizeOrigin(referer);
    if (!refOrigin)
      throw new Response("Forbidden (bad referer)", { status: 403 });
    if (!allowed.includes(refOrigin) && !isAllowedVercelPreview(refOrigin)) {
      throw new Response("Forbidden (invalid referer)", { status: 403 });
    }
    return;
  }

  // Pas d'Origin ni Referer
  if (process.env.NODE_ENV === "production") {
    throw new Response("Forbidden (missing origin)", { status: 403 });
  }
}

// ------------------------------------------------------
// Helpers
// ------------------------------------------------------

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token || null;
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

type ProductForOrder = Pick<
  ProductRow,
  "id" | "name" | "price" | "unit" | "stock_status" | "image_url" | "farm_id"
> & {
  stock_quantity: number | null;
};

export async function POST(
  request: NextRequest,
): Promise<NextResponse<CreateOrderResponse>> {
  try {
    // ==========================================
    // 0) SECURITY: Same-origin guard (anti CSRF cross-site)
    // ==========================================
    assertSameOrigin(request);

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { success: false, error: "Content-Type doit être application/json" },
        { status: 415 },
      );
    }

    // ==========================================
    // 1) AUTH (Bearer Clerk JWT)
    // ==========================================
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 },
      );
    }

    const clerkUserId = getJwtSub(token);
    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: "Token invalide (sub manquant)" },
        { status: 401 },
      );
    }

    // ==========================================
    // 1b) RATE LIMITING (par userId)
    // ==========================================
    const rl = rateLimit(`orders:${clerkUserId}`, RATE_LIMITS.orders);
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: "Trop de requêtes. Réessayez dans un moment." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        },
      );
    }

    const supabase = supabaseFromToken(token);

    // ==========================================
    // 2) VALIDATION BODY (Zod)
    // ==========================================
    const body = await request.json().catch(() => null);

    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`,
      );
      return NextResponse.json(
        { success: false, error: "Données invalides", details },
        { status: 400 },
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
        { status: 400 },
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun article dans la commande" },
        { status: 400 },
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
        { status: 404 },
      );
    }

    if (!farm.active) {
      return NextResponse.json(
        { success: false, error: "Ferme non disponible" },
        { status: 400 },
      );
    }

    // ==========================================
    // 4) FETCH PRODUCTS (server prices)
    // ==========================================
    const productIdsUnique = Array.from(new Set(items.map((i) => i.productId)));

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(
        "id, name, price, unit, stock_status, stock_quantity, image_url, farm_id",
      )
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
        { status: 500 },
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun produit trouvé" },
        { status: 404 },
      );
    }

    const typedProducts = products as unknown as ProductForOrder[];

    const productsById = new Map<number, ProductForOrder>();
    for (const p of typedProducts) productsById.set(Number(p.id), p);

    const missingIds = productIdsUnique.filter((id) => !productsById.has(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Certains produits sont introuvables",
          details: [`Produits manquants: ${missingIds.join(", ")}`],
        },
        { status: 404 },
      );
    }

    // ==========================================
    // 5) STOCK CHECK (status + quantity)
    // ==========================================
    for (const item of items) {
      const product = productsById.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Produit ${item.productId} introuvable` },
          { status: 404 },
        );
      }

      if (product.stock_status === "out_of_stock") {
        return NextResponse.json(
          {
            success: false,
            error: `Stock insuffisant pour ${product.name ?? `#${product.id}`}`,
            details: ["Produit en rupture de stock"],
          },
          { status: 400 },
        );
      }

      const qty = Number(item.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Quantité invalide pour ${product.name ?? `#${product.id}`}`,
          },
          { status: 400 },
        );
      }

      // ✅ MVP choice:
      // - si stock_quantity est NULL => on considère "non géré" (illimité) pour éviter de casser le MVP
      // - si tu veux “strict”, remplace par un 500 comme tu avais.
      const available = product.stock_quantity;

      if (available != null) {
        if (!Number.isFinite(Number(available)) || Number(available) < 0) {
          return NextResponse.json(
            {
              success: false,
              error: `Stock non valide pour ${product.name ?? `#${product.id}`}`,
            },
            { status: 500 },
          );
        }

        if (Number(available) < qty) {
          return NextResponse.json(
            {
              success: false,
              error: `Stock insuffisant pour ${product.name ?? `#${product.id}`}`,
              details: [`Disponible: ${available}, demandé: ${qty}`],
            },
            { status: 400 },
          );
        }
      }
    }

    // ==========================================
    // 6) PRICE CALC (server-side)
    // ✅ reject price <= 0
    // ==========================================
    let totalPrice = 0;
    const orderItems: OrderItem[] = [];

    for (const item of items) {
      const product = productsById.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Produit ${item.productId} introuvable` },
          { status: 404 },
        );
      }

      if (product.price == null) {
        return NextResponse.json(
          {
            success: false,
            error: `Prix manquant pour le produit ${product.name ?? `#${product.id}`}`,
          },
          { status: 500 },
        );
      }

      const price = Number(product.price);
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Prix invalide pour le produit ${product.name ?? `#${product.id}`}`,
          },
          { status: 400 },
        );
      }

      if (!product.unit) {
        return NextResponse.json(
          {
            success: false,
            error: `Unité manquante pour le produit ${product.name ?? `#${product.id}`}`,
          },
          { status: 500 },
        );
      }

      const qty = Number(item.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Quantité invalide pour ${product.name ?? `#${product.id}`}`,
          },
          { status: 400 },
        );
      }

      totalPrice += price * qty;

      orderItems.push({
        productId: Number(product.id),
        productName: product.name ?? "Produit",
        price,
        quantity: qty,
        unit: product.unit,
        imageUrl: product.image_url || undefined,
      });
    }

    if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
      return NextResponse.json(
        { success: false, error: "Total de commande invalide" },
        { status: 400 },
      );
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
          { status: 400 },
        );
      }

      if (
        typeof deliveryAddress !== "object" ||
        Array.isArray(deliveryAddress)
      ) {
        return NextResponse.json(
          { success: false, error: "Adresse de livraison invalide" },
          { status: 400 },
        );
      }
    }

    // ==========================================
    // 8) INSERT ORDER
    // ==========================================
    const insertPayload: OrderInsert = {
      user_id: clerkUserId,
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
      return NextResponse.json(
        { success: false, error: "Erreur lors de la création de la commande" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, order: order as any },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        { success: false, error: error.statusText || "Forbidden" },
        { status: error.status },
      );
    }

    console.error("Unexpected error in /api/orders/create:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur inattendue" },
      { status: 500 },
    );
  }
}
