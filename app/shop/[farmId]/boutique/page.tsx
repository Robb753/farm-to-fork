"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import { supabase } from "@/utils/supabase/client";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { useCartStore, type Product } from "@/lib/store/cartStore";
import { toast } from "sonner";

/**
 * Interface pour une ferme
 */
interface Farm {
  id: number;
  name: string;
}

/**
 * Page Boutique de la ferme (TUNNEL FERMÉ) - Étape 3
 *
 * Features:
 * - Header fixe rappelant chez qui on achète
 * - Liste produits simple et lisible
 * - Mini panier sticky bottom
 * - Logique tunnel fermé (on achète uniquement chez cette ferme)
 */
export default function FarmShopPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const farmId = parseInt(params.farmId as string);

  const [farm, setFarm] = useState<Farm | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cart = useCartStore((state) => state.cart);
  const addItem = useCartStore((state) => state.addItem);
  const canAddToCart = useCartStore((state) => state.canAddToCart);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  // Charger la ferme et ses produits
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        // Charger la ferme
        const { data: farmData, error: farmError } = await supabase
          .from("listings")
          .select("id, name")
          .eq("id", farmId)
          .eq("active", true)
          .single();

        if (farmError) throw farmError;
        setFarm(farmData);

        // Charger les produits
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .eq("farm_id", farmId)
          .eq("active", true)
          .order("name");

        if (productsError) throw productsError;

        // Transformer les données pour matcher notre interface
        const transformedProducts: Product[] = (productsData || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price || 0,
          unit: p.unit || "unité",
          farm_id: farmId,
          farm_name: farmData.name,
          image_url: p.image_url,
          stock_status: p.stock_status || "in_stock",
          description: p.description,
        }));

        setProducts(transformedProducts);
      } catch (error) {
        console.error("Erreur chargement boutique:", error);
        toast.error("Erreur lors du chargement de la boutique");
      } finally {
        setIsLoading(false);
      }
    }

    if (farmId) {
      loadData();
    }
  }, [farmId]);

  // Vérifier que le panier est compatible
  useEffect(() => {
    if (cart.farmId && cart.farmId !== farmId) {
      toast.error(
        `Vous avez déjà des produits de ${cart.farmName} dans votre panier. Videz-le pour acheter chez une autre ferme.`,
        { duration: 5000 }
      );
    }
  }, [cart.farmId, cart.farmName, farmId]);

  const handleAddToCart = (product: Product) => {
    if (!canAddToCart(farmId)) {
      toast.error("Vous ne pouvez acheter que chez une seule ferme à la fois");
      return;
    }

    addItem(product, 1);
    toast.success(`${product.name} ajouté au panier`);
  };

  // États de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.BG_GRAY }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: `${COLORS.PRIMARY} ${COLORS.PRIMARY} ${COLORS.PRIMARY} transparent`
            }}
          />
          <p style={{ color: COLORS.TEXT_SECONDARY }}>Chargement de la boutique...</p>
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.BG_GRAY }}>
        <div className="text-center">
          <p style={{ color: COLORS.TEXT_PRIMARY }}>Ferme non trouvée</p>
          <Link href="/shop" className="text-sm underline mt-2" style={{ color: COLORS.PRIMARY }}>
            Retour aux fermes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: COLORS.BG_GRAY }}>
      {/* Header fixe (supermarché-like) */}
      <div
        className="sticky top-0 z-40 border-b shadow-sm"
        style={{
          backgroundColor: COLORS.BG_WHITE,
          borderColor: COLORS.BORDER,
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧑‍🌾</span>
              <div>
                <p className="text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
                  Vous achetez chez :
                </p>
                <p className="font-bold" style={{ color: COLORS.PRIMARY }}>
                  {farm.name}
                </p>
              </div>
            </div>

            <Link
              href="/shop"
              className="text-sm hover:underline"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Retour aux fermes
            </Link>
          </div>
        </div>
      </div>

      {/* Liste produits (simple, lisible) */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: COLORS.TEXT_PRIMARY }}>
          Produits disponibles
        </h1>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
              Aucun produit disponible
            </h2>
            <p style={{ color: COLORS.TEXT_SECONDARY }}>
              Cette ferme n'a pas encore ajouté de produits
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                canAdd={canAddToCart(farmId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mini panier (sticky bottom) */}
      {getTotalItems() > 0 && (
        <MiniCart
          itemCount={getTotalItems()}
          totalPrice={getTotalPrice()}
          farmId={farmId}
        />
      )}
    </div>
  );
}

/**
 * Carte produit
 */
function ProductCard({
  product,
  onAddToCart,
  canAdd,
}: {
  product: Product;
  onAddToCart: (product: Product) => void;
  canAdd: boolean;
}): JSX.Element {
  const cart = useCartStore((state) => state.cart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const cartItem = cart.items.find((item) => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleIncrement = () => {
    if (quantity === 0) {
      onAddToCart(product);
    } else {
      updateQuantity(product.id, quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      updateQuantity(product.id, quantity - 1);
    }
  };

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
      className="p-4 rounded-xl border flex items-center justify-between"
      style={{
        backgroundColor: COLORS.BG_WHITE,
        borderColor: COLORS.BORDER,
      }}
    >
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
        {quantity > 0 ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDecrement}
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
              {quantity} {product.unit}
            </span>

            <button
              onClick={handleIncrement}
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
          <button
            onClick={() => onAddToCart(product)}
            disabled={!canAdd || product.stock_status === "out_of_stock"}
            className={cn(
              "px-6 py-2 rounded-lg font-medium transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
            onMouseEnter={(e) => {
              if (canAdd && product.stock_status !== "out_of_stock") {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
            }}
          >
            Ajouter
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Mini panier (sticky bottom)
 */
function MiniCart({
  itemCount,
  totalPrice,
  farmId,
}: {
  itemCount: number;
  totalPrice: number;
  farmId: number;
}): JSX.Element {
  const router = useRouter();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t shadow-2xl"
      style={{
        backgroundColor: COLORS.BG_WHITE,
        borderColor: COLORS.BORDER,
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-4">
        <button
          onClick={() => router.push(`/shop/${farmId}/panier`)}
          className={cn(
            "w-full flex items-center justify-between px-6 py-4 rounded-xl",
            "transition-all duration-200 hover:shadow-lg"
          )}
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
              Panier – {itemCount} article{itemCount > 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xl font-bold">{totalPrice.toFixed(2)} €</span>
            <span className="text-sm">→</span>
          </div>
        </button>
      </div>
    </div>
  );
}
