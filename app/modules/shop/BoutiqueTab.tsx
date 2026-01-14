"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Minus,
  Package,
  Truck,
  MapPin,
  Search,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import { useCartStore, type Product } from "@/lib/store/cartStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Database } from "@/lib/types/database";
import { escapeHTML, sanitizeHTML } from "@/lib/utils/sanitize";
import { useSupabaseWithClerk } from "@/utils/supabase/client";

/**
 * Type pour un listing
 */
type ListingWithProducts = Database["public"]["Tables"]["listing"]["Row"];

interface BoutiqueTabProps {
  listing: ListingWithProducts | null;
  className?: string;
}

/**
 * Onglet Boutique (version moderne "aperçu")
 */
export default function BoutiqueTab({
  listing,
  className,
}: BoutiqueTabProps): JSX.Element {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useSupabaseWithClerk();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<
    "featured" | "name" | "price_asc" | "price_desc"
  >("featured");

  const cart = useCartStore((state) => state.cart);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem); // ✅ IMPORTANT
  const canAddToCart = useCartStore((state) => state.canAddToCart);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  const farmId = listing?.id;
  const farmName = listing?.name || "Ferme";

  const PREVIEW_LIMIT = 6;

  // Chargement produits
  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      if (!farmId) {
        if (!cancelled) {
          setProducts([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        if (!cancelled) setIsLoading(true);

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("farm_id", farmId)
          .eq("active", true)
          .order("name");

        if (error) throw error;

        const transformed: Product[] = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price ?? 0,
          unit: p.unit || "unité",
          farm_id: farmId,
          farm_name: farmName,
          image_url: p.image_url,
          stock_status: p.stock_status || "in_stock",
          description: p.description,
        }));

        if (!cancelled) setProducts(transformed);
      } catch (err) {
        console.error("Erreur chargement produits:", err);
        toast.error("Impossible de charger la boutique.");
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [farmId, farmName, supabase, router]); // ✅ FIX ESLint (supabase) + safe

  // Vérif panier (tunnel fermé)
  useEffect(() => {
    if (cart.farmId && farmId && cart.farmId !== farmId) {
      // 🔒 SÉCURITÉ: Noms de fermes échappés avec fallback
      toast.error(
        `Panier déjà lié à ${escapeHTML(
          cart.farmName || "une ferme"
        )}. Videz-le pour acheter chez ${escapeHTML(
          farmName || "cette ferme"
        )}.`,
        { duration: 3500 }
      );
    }
  }, [cart.farmId, cart.farmName, farmId, farmName]);

  const goToShop = useCallback(() => {
    if (!farmId) return;
    router.push(`/farm/${farmId}/shop`);
  }, [farmId, router]);

  const goToCart = useCallback(() => {
    if (!farmId) return;
    router.push(`/farm/${farmId}/cart`);
  }, [farmId, router]);

  const handleAddToCart = useCallback(
    (product: Product) => {
      if (!farmId || !canAddToCart(farmId)) {
        toast.error("Videz votre panier pour acheter chez une autre ferme");
        return;
      }
      if (!product.price || product.price <= 0) {
        toast.error("Produit sans prix défini.");
        return;
      }
      if (product.stock_status === "out_of_stock") {
        toast.error("Produit en rupture.");
        return;
      }

      addItem(product, 1);
      // 🔒 SÉCURITÉ: Nom de produit échappé
      toast.success(`${escapeHTML(product.name)} ajouté au panier`);
    },
    [addItem, canAddToCart, farmId]
  );

  // ✅ setter robuste: qty <= 0 => removeItem
  const setQty = useCallback(
    (productId: number, nextQty: number) => {
      const q = Math.max(0, Math.floor(nextQty)); // clamp + int
      if (q <= 0) {
        removeItem(productId);
        return;
      }
      updateQuantity(productId, q);
    },
    [removeItem, updateQuantity]
  );

  const normalizedQuery = query.trim().toLowerCase();

  const filteredSorted = useMemo(() => {
    let list = [...products];

    if (normalizedQuery) {
      list = list.filter((p) => {
        const hay = `${p.name} ${p.description || ""}`.toLowerCase();
        return hay.includes(normalizedQuery);
      });
    }

    if (sort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "price_asc") {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === "price_desc") {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else {
      list.sort((a, b) => {
        const scoreA =
          (a.stock_status === "in_stock"
            ? 2
            : a.stock_status === "low_stock"
              ? 1
              : 0) + (a.price && a.price > 0 ? 2 : 0);
        const scoreB =
          (b.stock_status === "in_stock"
            ? 2
            : b.stock_status === "low_stock"
              ? 1
              : 0) + (b.price && b.price > 0 ? 2 : 0);
        return scoreB - scoreA;
      });
    }

    return list;
  }, [products, normalizedQuery, sort]);

  const previewList = useMemo(
    () => filteredSorted.slice(0, PREVIEW_LIMIT),
    [filteredSorted]
  );

  if (isLoading) {
    return (
      <div className={cn("py-10", className)}>
        <div className="rounded-2xl border p-6 bg-white">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 rounded bg-gray-200" />
            <div className="h-4 w-72 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
            <div className="space-y-3 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 w-full rounded-xl bg-gray-200" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={cn("py-10", className)}>
        <div className="rounded-2xl border p-8 bg-white text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <h3
            className="text-lg font-semibold"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Boutique en préparation
          </h3>
          <p className="mt-1 text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
            Le producteur n’a pas encore ajouté de produits.
          </p>
        </div>
      </div>
    );
  }

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header modern: titre + CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2
              className="text-2xl font-bold"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              Boutique
            </h2>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border"
              style={{
                backgroundColor: COLORS.PRIMARY_BG,
                borderColor: `${COLORS.PRIMARY}33`,
                color: COLORS.PRIMARY,
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {/* 🔒 SÉCURITÉ: Nom de ferme échappé */}
              Achat chez {escapeHTML(farmName)}
            </span>
          </div>

          <p className="mt-1 text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
            Ajoutez en 1 clic, puis finalisez dans le panier.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {totalItems > 0 && (
            <Button
              variant="outline"
              onClick={goToCart}
              className="justify-between"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Voir mon panier ({totalItems})
              </span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          <Button onClick={goToShop}>
            Voir toute la boutique
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit"
            className="pl-9"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="h-10 rounded-md border bg-white px-3 text-sm"
          style={{ borderColor: COLORS.BORDER }}
          aria-label="Trier les produits"
        >
          <option value="featured">Pertinence</option>
          <option value="name">Nom (A→Z)</option>
          <option value="price_asc">Prix (croissant)</option>
          <option value="price_desc">Prix (décroissant)</option>
        </select>
      </div>

      {/* Modes réception */}
      {(listing?.pickup_days || listing?.delivery_available) && (
        <div
          className="rounded-2xl border bg-white p-4"
          style={{ borderColor: COLORS.BORDER }}
        >
          <div className="font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
            Modes de réception
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {listing.pickup_days && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin
                  className="mt-0.5 h-4 w-4"
                  style={{ color: COLORS.PRIMARY }}
                />
                <div>
                  <div
                    className="font-medium"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Retrait à la ferme
                  </div>
                  {/* 🔒 SÉCURITÉ: Jours de retrait échappés */}
                  <div style={{ color: COLORS.TEXT_SECONDARY }}>
                    {escapeHTML(listing.pickup_days)}
                  </div>
                </div>
              </div>
            )}

            {listing.delivery_available && (
              <div className="flex items-start gap-2 text-sm">
                <Truck
                  className="mt-0.5 h-4 w-4"
                  style={{ color: COLORS.PRIMARY }}
                />
                <div>
                  <div
                    className="font-medium"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    Livraison locale
                  </div>
                  <div style={{ color: COLORS.TEXT_SECONDARY }}>
                    Disponible selon zone
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liste aperçu */}
      <div className="space-y-3">
        {previewList.map((product) => {
          const cartQty =
            cart.items.find((it) => it.product.id === product.id)?.quantity ||
            0;

          return (
            <ProductRow
              key={product.id}
              product={product}
              cartQuantity={cartQty}
              canAdd={farmId ? canAddToCart(farmId) : false}
              onAdd={() => handleAddToCart(product)}
              onSetQuantity={(qty) => setQty(product.id, qty)} // ✅ robust
            />
          );
        })}
      </div>

      {/* Plus de résultats ? CTA */}
      {filteredSorted.length > PREVIEW_LIMIT && (
        <div className="pt-2">
          <Button variant="outline" onClick={goToShop} className="w-full">
            Voir les {filteredSorted.length} produits dans la boutique
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Mini cart sticky discret */}
      {totalItems > 0 && (
        <div className="sticky bottom-2 z-10">
          <div
            className="rounded-2xl border bg-white p-3 shadow-lg"
            style={{ borderColor: `${COLORS.PRIMARY}33` }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ShoppingCart
                    className="h-4 w-4"
                    style={{ color: COLORS.PRIMARY }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {totalItems} article{totalItems > 1 ? "s" : ""} dans le
                    panier
                  </span>
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Total provisoire :{" "}
                  <span className="font-semibold">
                    {totalPrice.toFixed(2)} €
                  </span>
                </div>
              </div>

              <Button onClick={goToCart} className="shrink-0">
                Finaliser
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Row produit compacte
 */
function ProductRow({
  product,
  cartQuantity,
  canAdd,
  onAdd,
  onSetQuantity,
}: {
  product: Product;
  cartQuantity: number;
  canAdd: boolean;
  onAdd: () => void;
  onSetQuantity: (qty: number) => void;
}) {
  const isOut = product.stock_status === "out_of_stock";
  const hasPrice = (product.price ?? 0) > 0;

  const stockText =
    product.stock_status === "in_stock"
      ? "En stock"
      : product.stock_status === "low_stock"
        ? "Stock faible"
        : "Rupture";

  const stockDot =
    product.stock_status === "in_stock"
      ? "bg-green-500"
      : product.stock_status === "low_stock"
        ? "bg-yellow-500"
        : "bg-red-500";

  const disabledAdd = !canAdd || isOut || !hasPrice;

  return (
    <div
      className="rounded-2xl border bg-white p-4 transition hover:shadow-sm"
      style={{ borderColor: COLORS.BORDER }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3
            className="truncate text-base font-semibold"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            {escapeHTML(product.name)}
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <div className="font-semibold" style={{ color: COLORS.PRIMARY }}>
              {hasPrice ? (
                <>
                  {product.price.toFixed(2)} €{" "}
                  <span className="font-normal">
                    / {escapeHTML(product.unit)}
                  </span>
                </>
              ) : (
                <span className="text-gray-500 font-medium">
                  Prix à définir
                </span>
              )}
            </div>

            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              <span
                className={cn("inline-block h-2 w-2 rounded-full", stockDot)}
              />
              {stockText}
              {!hasPrice && <span className="mx-1">•</span>}
              {!hasPrice && <span>Non commandable</span>}
            </div>
          </div>

          {product.description && (
            /* 🔒 SÉCURITÉ: Description sanitisée (permet formatage basique) */
            <div
              className="mt-2 line-clamp-2 text-sm prose prose-sm max-w-none"
              style={{ color: COLORS.TEXT_SECONDARY }}
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(product.description),
              }}
            />
          )}
        </div>

        {/* controls */}
        <div className="shrink-0">
          {cartQuantity > 0 ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onSetQuantity(cartQuantity - 1)} // ✅ passera par remove si 0
              >
                <Minus className="h-4 w-4" />
              </Button>

              <div
                className="w-8 text-center font-semibold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {cartQuantity}
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onSetQuantity(cartQuantity + 1)}
                disabled={isOut || !canAdd}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button type="button" onClick={onAdd} disabled={disabledAdd}>
              Ajouter
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
