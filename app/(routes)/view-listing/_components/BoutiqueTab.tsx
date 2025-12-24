"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Plus, Minus, Package, Truck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import { supabase } from "@/utils/supabase/client";
import { useCartStore, type Product } from "@/lib/store/cartStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/types/database";

/**
 * Type pour un listing
 */
type ListingWithProducts = Database["public"]["Tables"]["listing"]["Row"];

/**
 * Props du composant BoutiqueTab
 */
interface BoutiqueTabProps {
  listing: ListingWithProducts | null;
  className?: string;
}

/**
 * Composant Boutique (tunnel fermé) - Remplace ProductsTab
 *
 * Features:
 * - Liste produits ACHETABLES avec prix et unités
 * - Ajouter au panier directement
 * - Mini panier sticky
 * - Choix retrait/livraison
 * - Bouton Commander
 * - PAS de map, téléphone, liens externes (tunnel fermé)
 */
export default function BoutiqueTab({
  listing,
  className,
}: BoutiqueTabProps): JSX.Element {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cart = useCartStore((state) => state.cart);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const canAddToCart = useCartStore((state) => state.canAddToCart);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  const farmId = listing?.id;

  // Charger les produits de cette ferme
  useEffect(() => {
    async function loadProducts() {
      if (!farmId) return;

      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("farm_id", farmId)
          .eq("active", true)
          .order("name");

        if (error) throw error;

        // Transformer les données pour matcher notre interface
        const transformedProducts: Product[] = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price || 0,
          unit: p.unit || "unité",
          farm_id: farmId,
          farm_name: listing?.name || "Ferme",
          image_url: p.image_url,
          stock_status: p.stock_status || "in_stock",
          description: p.description,
        }));

        setProducts(transformedProducts);
      } catch (error) {
        console.error("Erreur chargement produits:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, [farmId, listing?.name]);

  // Vérifier compatibilité panier
  useEffect(() => {
    if (cart.farmId && farmId && cart.farmId !== farmId) {
      toast.error(
        `Vous avez déjà des produits de ${cart.farmName} dans votre panier.`,
        { duration: 3000 }
      );
    }
  }, [cart.farmId, cart.farmName, farmId]);

  const handleAddToCart = (product: Product) => {
    if (!farmId || !canAddToCart(farmId)) {
      toast.error("Videz votre panier pour acheter chez une autre ferme");
      return;
    }

    addItem(product, 1);
    toast.success(`${product.name} ajouté au panier`);
  };

  const handleGoToCart = () => {
    if (farmId) {
      router.push(`/shop/${farmId}/panier`);
    }
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
          style={{
            borderColor: `${COLORS.PRIMARY} ${COLORS.PRIMARY} ${COLORS.PRIMARY} transparent`
          }}
        />
        <p style={{ color: COLORS.TEXT_SECONDARY }}>
          Chargement de la boutique...
        </p>
      </div>
    );
  }

  // État vide
  if (products.length === 0) {
    return (
      <div className={cn("text-center py-12 bg-gray-50 rounded-xl", className)}>
        <Package className="w-16 h-16 mx-auto mb-4" style={{ color: COLORS.TEXT_MUTED }} />
        <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
          Boutique en préparation
        </h3>
        <p className="mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
          Le producteur n'a pas encore ajouté de produits à sa boutique.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
            🛒 Boutique
          </h2>
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            {products.length} produit{products.length > 1 ? "s" : ""} disponible{products.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Badge tunnel fermé */}
        <div
          className="px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderColor: `${COLORS.PRIMARY}40`,
          }}
        >
          <p className="text-sm font-medium" style={{ color: COLORS.PRIMARY }}>
            🔒 Achat exclusif chez {listing?.name}
          </p>
        </div>
      </div>

      {/* Liste des produits */}
      <div className="space-y-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            canAdd={farmId ? canAddToCart(farmId) : false}
            cartQuantity={
              cart.items.find((item) => item.product.id === product.id)?.quantity || 0
            }
            onUpdateQuantity={(qty) => updateQuantity(product.id, qty)}
          />
        ))}
      </div>

      {/* Infos livraison/retrait */}
      {(listing?.pickup_days || listing?.delivery_available) && (
        <div
          className="p-4 rounded-xl border space-y-3"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.BORDER,
          }}
        >
          <h3 className="font-semibold" style={{ color: COLORS.TEXT_PRIMARY }}>
            📍 Modes de réception
          </h3>

          {listing.pickup_days && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4" style={{ color: COLORS.PRIMARY }} />
              <span style={{ color: COLORS.TEXT_SECONDARY }}>
                Retrait : {listing.pickup_days}
              </span>
            </div>
          )}

          {listing.delivery_available && (
            <div className="flex items-center gap-2 text-sm">
              <Truck className="w-4 h-4" style={{ color: COLORS.PRIMARY }} />
              <span style={{ color: COLORS.TEXT_SECONDARY }}>
                Livraison locale disponible
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mini panier sticky (si produits ajoutés) */}
      {getTotalItems() > 0 && (
        <div
          className="sticky bottom-0 left-0 right-0 p-4 rounded-xl border-2 shadow-xl"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.PRIMARY,
          }}
        >
          <button
            onClick={handleGoToCart}
            className="w-full flex items-center justify-between px-6 py-4 rounded-xl transition-all"
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
            }}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-6 h-6" />
              <span className="font-semibold">
                Panier – {getTotalItems()} article{getTotalItems() > 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xl font-bold">
                {getTotalPrice().toFixed(2)} €
              </span>
              <span className="text-sm">→</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Carte produit individuelle
 */
function ProductCard({
  product,
  onAddToCart,
  canAdd,
  cartQuantity,
  onUpdateQuantity,
}: {
  product: Product;
  onAddToCart: (product: Product) => void;
  canAdd: boolean;
  cartQuantity: number;
  onUpdateQuantity: (qty: number) => void;
}): JSX.Element {
  const stockIcon =
    product.stock_status === "in_stock"
      ? "🟢"
      : product.stock_status === "low_stock"
      ? "🟡"
      : "🔴";

  const stockText =
    product.stock_status === "in_stock"
      ? "En stock"
      : product.stock_status === "low_stock"
      ? "Stock faible"
      : "Rupture";

  return (
    <div
      className="p-4 rounded-xl border hover:shadow-md transition-all"
      style={{
        backgroundColor: COLORS.BG_WHITE,
        borderColor: COLORS.BORDER,
      }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Infos produit */}
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1" style={{ color: COLORS.TEXT_PRIMARY }}>
            {product.name}
          </h3>
          <p className="text-lg font-semibold mb-2" style={{ color: COLORS.PRIMARY }}>
            {product.price.toFixed(2)} € / {product.unit}
          </p>
          {product.description && (
            <p className="text-sm mb-2" style={{ color: COLORS.TEXT_SECONDARY }}>
              {product.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span>{stockIcon}</span>
            <span style={{ color: COLORS.TEXT_SECONDARY }}>{stockText}</span>
          </div>
        </div>

        {/* Contrôles quantité */}
        <div className="flex items-center gap-3">
          {cartQuantity > 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(cartQuantity - 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center border transition-colors"
                style={{
                  borderColor: COLORS.PRIMARY,
                  color: COLORS.PRIMARY,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.PRIMARY_BG;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="w-12 text-center font-bold" style={{ color: COLORS.TEXT_PRIMARY }}>
                {cartQuantity}
              </span>

              <button
                onClick={() => onUpdateQuantity(cartQuantity + 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center border transition-colors"
                style={{
                  borderColor: COLORS.PRIMARY,
                  color: COLORS.PRIMARY,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.PRIMARY_BG;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button
              onClick={() => onAddToCart(product)}
              disabled={!canAdd || product.stock_status === "out_of_stock"}
              className="px-6 py-2"
              style={{
                backgroundColor: COLORS.PRIMARY,
                color: COLORS.BG_WHITE,
              }}
            >
              Ajouter
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
